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
