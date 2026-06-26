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


class TestRefrainServices:
    def test_search_phrase_finds_subphrase(self, verse):
        from apps.analytics.services import search_phrase

        # "رب العالمين" is a sub-phrase of the fixture verse 1:2.
        result = search_phrase("رب العالمين")
        assert result["count"] == 1
        assert result["verses"][0]["verse_key"] == "1:2"

    def test_search_phrase_is_hamza_robust(self, verse):
        from apps.analytics.services import search_phrase

        # Query with alef-wasla (ٱ); text_clean stores a plain alef (ا).
        # normalize_search unifies them, so the phrase still matches.
        result = search_phrase("ٱلحمد لله")
        assert result["count"] == 1
        assert result["verses"][0]["verse_key"] == "1:2"

    def test_search_phrase_matches_uthmani_orthography(self, surah):
        # Uthmani spelling carries standalone hamzas + unusual letters the user
        # won't type (here ءَالَآءِ). An ordinary-spelling query must still match.
        from apps.analytics.services import search_phrase
        from apps.quran.models import Verse

        Verse.objects.create(
            surah=surah,
            number=13,
            text_uthmani="فَبِأَىِّ ءَالَآءِ رَبِّكُمَا تُكَذِّبَانِ",
            text_clean="فبأى ءالاء ربكما تكذبان",
            juz_number=27,
            page_number=531,
            revelation_order=9713,
        )
        result = search_phrase("فبأي آلاء ربكما")
        assert result["count"] == 1
        assert result["verses"][0]["verse_key"] == "1:13"

    def test_search_phrase_no_match(self, verse):
        from apps.analytics.services import search_phrase

        assert search_phrase("كلمة غير موجودة")["count"] == 0

    def test_repeated_verses_groups_duplicates(self, verse, surah):
        from apps.analytics.services import get_repeated_verses
        from apps.quran.models import Verse

        # A second verse with identical text — a verbatim refrain.
        Verse.objects.create(
            surah=surah,
            number=3,
            text_uthmani=verse.text_uthmani,
            text_clean=verse.text_clean,
            juz_number=1,
            page_number=1,
            revelation_order=5003,
        )
        result = get_repeated_verses(min_count=2)
        assert len(result["refrains"]) == 1
        refrain = result["refrains"][0]
        assert refrain["count"] == 2
        assert refrain["word_count"] == 4
        assert set(refrain["verse_keys"]) == {"1:2", "1:3"}

    def test_repeated_verses_excludes_singletons(self, verse):
        from apps.analytics.services import get_repeated_verses

        # The lone fixture verse appears once — not a refrain.
        assert get_repeated_verses(min_count=2)["refrains"] == []


class TestDivineNames:
    def test_dataset_is_well_formed(self):
        # 99 names + the supreme name; unique ids; lemmas normalize cleanly.
        from apps.analytics.divine_names_data import ALLAH, DIVINE_NAMES

        assert len(DIVINE_NAMES) == 99
        entries = [ALLAH, *DIVINE_NAMES]
        ids = [n["id"] for n in entries]
        assert len(set(ids)) == len(ids)  # no duplicate ids
        assert ALLAH["lemma"] == "الله"

    def test_get_divine_names_counts_from_cache(self, computed):
        from apps.analytics.services import get_divine_names

        result = get_divine_names()
        assert len(result["names"]) == 100
        assert result["methodology"]
        # The fixture verse 1:2 contains الله once; رحمن is absent (no count).
        by_id = {n["id"]: n for n in result["names"]}
        assert by_id["allah"]["count"] == 1
        assert by_id["ar-rahman"]["count"] is None

    def test_divine_name_detail_lists_verses(self, computed):
        from apps.analytics.services import get_divine_name

        detail = get_divine_name("allah")
        assert detail["available"] is True
        assert detail["total"] == 1
        assert detail["verse_total"] == 1
        assert detail["verses"][0]["verse_key"] == "1:2"
        assert detail["per_surah"][0]["surah_id"] == 1

    def test_divine_name_unknown_id(self):
        from apps.analytics.services import get_divine_name

        assert get_divine_name("not-a-name")["available"] is False

    def test_divine_name_phrase_has_no_count(self):
        # A phrase name (lemma=None) is available but carries no word-form count.
        from apps.analytics.services import get_divine_name

        detail = get_divine_name("malik-al-mulk")
        assert detail["available"] is True
        assert detail["lemma"] is None
        assert detail["total"] is None
        assert detail["verses"] == []


class TestProphets:
    def test_dataset_is_well_formed(self):
        from apps.analytics.prophets_data import PROPHETS

        assert len(PROPHETS) == 25
        ids = [p["id"] for p in PROPHETS]
        assert len(set(ids)) == 25
        orders = sorted(p["order"] for p in PROPHETS)
        assert orders == list(range(1, 26))
        # Every prophet has exactly one way to locate his verses.
        for p in PROPHETS:
            assert sum(bool(p.get(k)) for k in ("cores", "verse_keys", "phrase")) == 1

    def test_match_set_includes_proclitic_variants(self):
        from apps.analytics.services import _prophet_match_set

        s = _prophet_match_set(["موسي"])
        assert "موسي" in s  # bare
        assert "وموسي" in s  # with conjunction و
        assert "يموسي" in s  # attached vocative

    def test_get_prophets_lists_25(self, words):
        from apps.analytics.services import get_prophets

        result = get_prophets()
        assert len(result["prophets"]) == 25
        assert result["methodology"]
        assert result["prophets"][0]["order"] == 1  # sorted by order

    def test_direct_match_by_core_and_proclitic(self, surah):
        # A verse naming Musa as "وَمُوسَىٰ" (with attached و) must still match.
        from apps.analytics.services import get_prophet
        from apps.quran.models import Verse

        Verse.objects.create(
            surah=surah, number=40,
            text_uthmani="وَمُوسَىٰ", text_clean="وموسى",
            juz_number=1, page_number=1, revelation_order=5040,
        )
        detail = get_prophet("musa")
        assert detail["available"] is True
        assert "1:40" in [v["verse_key"] for v in detail["direct_verses"]]

    def test_curated_prophet_uses_pinned_keys(self):
        # Salih is pinned to a curated verse list (collides with "righteous").
        from apps.analytics.services import get_prophet

        detail = get_prophet("salih")
        assert detail["direct_total"] == 9

    def test_unknown_prophet(self):
        from apps.analytics.services import get_prophet

        assert get_prophet("nobody")["available"] is False


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

    def test_phrase_endpoint(self, api, verse):
        res = api.get("/api/v1/analytics/phrase/?q=رب العالمين")
        assert res.status_code == 200
        assert res.json()["data"]["count"] == 1

    def test_phrase_endpoint_requires_param(self, api):
        assert api.get("/api/v1/analytics/phrase/").status_code == 400

    def test_repeated_verses_endpoint(self, api, verse):
        res = api.get("/api/v1/analytics/repeated-verses/")
        assert res.status_code == 200
        assert res.json()["data"]["refrains"] == []

    def test_divine_names_endpoint(self, api, computed):
        res = api.get("/api/v1/analytics/divine-names/")
        assert res.status_code == 200
        assert len(res.json()["data"]["names"]) == 100

    def test_divine_name_detail_endpoint(self, api, computed):
        res = api.get("/api/v1/analytics/divine-names/allah/")
        assert res.status_code == 200
        assert res.json()["data"]["total"] == 1
