"""Tests for the analytics engine: aggregation + services + APIs."""
from __future__ import annotations

import pytest

from apps.quran.aggregation import build_frequency_cache, compute_surah_stats

pytestmark = pytest.mark.django_db


@pytest.fixture
def computed(words):
    """Build the materialized stats + frequency cache from fixture words."""
    compute_surah_stats()
    build_frequency_cache()
    return words


class TestAggregation:
    def test_surah_stats_counts(self, computed, surah):
        surah.refresh_from_db()
        stats = surah.stats
        assert stats.word_count == 4
        assert stats.unique_root_count == 1  # only كتاب has a root

    def test_frequency_cache_built(self, computed):
        from apps.quran.models import WordFrequency

        # 4 lemma rows + 1 root row
        assert WordFrequency.objects.filter(root__isnull=True).count() == 4
        assert WordFrequency.objects.filter(root__isnull=False).count() == 1


class TestServices:
    def test_word_frequency_from_cache(self, computed):
        from apps.analytics.services import get_word_frequency

        result = get_word_frequency(word="حمد")
        assert result["total"] == 1
        assert result["per_surah"][0]["surah_id"] == 1

    def test_root_tree(self, computed, root):
        from apps.analytics.services import get_root_tree

        tree = get_root_tree("كتب")
        assert tree["root"] == "كتب"
        assert len(tree["derivatives"]) == 1
        assert tree["derivatives"][0]["total_count"] == 1

    def test_root_tree_returns_display_orthography(self, db):
        # Normalized key (اله) resolves but display preserves hamza (أله).
        from apps.analytics.services import get_root_tree
        from apps.quran.models import WordRoot

        WordRoot.objects.create(
            root_arabic="اله", root_display="أله", root_transliteration="ʾ-l-h"
        )
        tree = get_root_tree("أله")  # query in raw form, normalized internally
        assert tree["root"] == "أله"  # display
        assert tree["root_key"] == "اله"  # lookup key

    def test_all_surah_stats(self, computed, surah):
        from apps.analytics.services import get_all_surah_stats

        rows = get_all_surah_stats()
        assert len(rows) == 1
        assert rows[0]["surah_id"] == 1
        assert rows[0]["word_count"] == 4

    def test_cooccurrence_shared_verse(self, computed):
        from apps.analytics.services import get_cooccurrence

        # حمد and رب both appear in the fixture verse 1:2.
        result = get_cooccurrence("حمد", "رب")
        assert result["count"] == 1
        assert result["verses"][0]["verse_key"] == "1:2"

    def test_verify_numeric_claim(self, computed):
        from apps.analytics.services import verify_numeric_claim

        result = verify_numeric_claim("حمد", expected_count=1)
        assert result["actual"] == 1
        assert result["verified"] is True


class TestStructuralServices:
    def test_verse_lengths(self, words, surah):
        from apps.analytics.services import get_verse_lengths

        result = get_verse_lengths(1)
        assert result["available"] is True
        assert result["summary"]["verse_count"] == 1
        assert result["verses"][0]["word_count"] == 4

    def test_verse_lengths_missing_surah(self):
        from apps.analytics.services import get_verse_lengths

        assert get_verse_lengths(99)["available"] is False

    def test_find_rare_words_caps_and_resolves_verse(self, computed):
        from apps.analytics.services import find_rare_words

        rare = find_rare_words(max_count=1, limit=10)
        # Every fixture lemma appears once; results carry a verse_key.
        assert rare
        assert all(r["verse_key"] == "1:2" for r in rare)

    def test_surah_pair(self, db):
        from apps.analytics.services import get_surah_pair
        from apps.quran.models import Surah

        for n in (113, 114):
            Surah.objects.create(
                number=n,
                name_arabic="x",
                name_transliteration=f"S{n}",
                name_en="x",
                name_id="x",
                revelation_type="Meccan",
                verse_count=5,
                revelation_order=n,
            )
        pair = get_surah_pair(113, 114)
        assert pair["available"] is True
        assert pair["symmetry"]["same_verse_count"] is True

    def test_chiastic_enriches_with_text(self, verse, surah):
        from apps.analytics.services import get_chiastic_structures

        structures = get_chiastic_structures()
        assert len(structures) >= 1
        fatihah = next(s for s in structures if s["id"] == "al-fatihah")
        level_12 = next(l for l in fatihah["levels"] if l["verse_key"] == "1:2")
        # The fixture verse 1:2 text is injected into the matching level.
        assert level_12["text_uthmani"].startswith("ٱلْحَمْدُ")


class TestAnalyticsAPI:
    def test_word_frequency_endpoint_caches(self, api, computed):
        url = "/api/v1/analytics/word-frequency/?word=حمد"
        first = api.get(url)
        assert first.status_code == 200
        assert first["X-Cache"] == "MISS"
        second = api.get(url)
        assert second["X-Cache"] == "HIT"

    def test_word_frequency_requires_param(self, api):
        res = api.get("/api/v1/analytics/word-frequency/")
        assert res.status_code == 400

    def test_verify_claim_endpoint(self, api, computed):
        res = api.get("/api/v1/analytics/verify-claim/?word=حمد&expected=1")
        assert res.status_code == 200
        assert res.json()["data"]["verified"] is True
