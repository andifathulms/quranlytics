"""Tests for the Quran reader models and APIs."""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.django_db


class TestModels:
    def test_verse_key(self, verse):
        assert verse.key == "1:2"

    def test_uthmani_stored_verbatim(self, verse):
        # The displayed Arabic must never be altered.
        assert verse.text_uthmani == "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ"


class TestSurahAPI:
    def test_list_surahs_envelope(self, api, surah):
        res = api.get("/api/v1/surahs/")
        assert res.status_code == 200
        body = res.json()
        assert set(body) == {"data", "meta", "errors"}
        assert body["meta"]["count"] == 1
        assert body["data"][0]["name_transliteration"] == "Al-Fatihah"

    def test_surah_detail(self, api, surah):
        res = api.get("/api/v1/surahs/1/")
        assert res.status_code == 200
        assert res.json()["data"]["number"] == 1

    def test_surah_verses_with_translations(self, api, verse):
        res = api.get("/api/v1/surahs/1/verses/")
        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data) == 1
        langs = {t["language"] for t in data[0]["translations"]}
        assert langs == {"en", "id"}


class TestJuzAPI:
    def test_juz_verses(self, api, verse):
        # The fixture verse 1:2 has juz_number=1.
        res = api.get("/api/v1/juz/1/verses/")
        assert res.status_code == 200
        data = res.json()["data"]
        assert any(v["verse_key"] == "1:2" for v in data)

    def test_empty_juz(self, api, verse):
        assert api.get("/api/v1/juz/30/verses/").json()["data"] == []


class TestPageAPI:
    def test_page_verses(self, api, verse):
        # The fixture verse 1:2 has page_number=1.
        res = api.get("/api/v1/page/1/verses/")
        assert res.status_code == 200
        assert any(v["verse_key"] == "1:2" for v in res.json()["data"])


class TestVerseWordsAPI:
    def test_words_breakdown(self, api, words):
        verse_id = words[0].verse_id
        res = api.get(f"/api/v1/verses/{verse_id}/words/")
        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data) == 4
        assert data[0]["position"] == 1  # 1-indexed


class TestSearchAPI:
    def test_requires_query(self, api):
        res = api.get("/api/v1/search/")
        assert res.status_code == 400
        assert res.json()["errors"]

    def test_arabic_search_hits_clean_text(self, api, verse):
        res = api.get("/api/v1/search/?q=الحمد&lang=ar")
        assert res.status_code == 200
        assert res.json()["meta"]["count"] == 1

    def test_english_search(self, api, verse):
        res = api.get("/api/v1/search/?q=praise&lang=en")
        assert res.json()["meta"]["count"] == 1
