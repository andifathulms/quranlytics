"""Tests for the semantic layer (vector search, cross-refs, themes).

These build VerseEmbedding rows directly with deterministic vectors so the ML
model is never loaded; ``semantic_search`` is exercised with a patched
``embed_query``.
"""
from __future__ import annotations

import math

import pytest
from django.utils import timezone

from apps.quran.models import Surah, Verse
from apps.semantic.models import VerseEmbedding

pytestmark = pytest.mark.django_db


def _unit(primary: int, secondary: int | None = None) -> list[float]:
    v = [0.0] * 384
    v[primary] = 1.0
    if secondary is not None:
        v[secondary] = 0.5
    norm = math.sqrt(sum(x * x for x in v))
    return [x / norm for x in v]


@pytest.fixture
def embedded(db):
    surah = Surah.objects.create(
        number=1,
        name_arabic="الفاتحة",
        name_transliteration="Al-Fatihah",
        name_en="The Opener",
        name_id="Pembuka",
        revelation_type="Meccan",
        verse_count=3,
        revelation_order=5,
    )
    verses = [
        Verse.objects.create(
            surah=surah,
            number=i + 1,
            text_uthmani=f"verse {i}",
            text_clean=f"verse {i}",
            juz_number=1,
            page_number=1,
            revelation_order=i + 1,
        )
        for i in range(3)
    ]
    now = timezone.now()
    # v0 and v1 are near each other; v2 is far. v0/v1 in cluster 0, v2 in 1.
    specs = [(_unit(0), 0), (_unit(0, 1), 0), (_unit(100), 1)]
    for verse, (vec, cluster) in zip(verses, specs):
        VerseEmbedding.objects.create(
            verse=verse,
            embedding=vec,
            theme_cluster=cluster,
            model_name="test",
            computed_at=now,
        )
    return verses


class TestCrossReferences:
    def test_ranks_nearest_first(self, embedded):
        from apps.semantic.services import cross_references

        res = cross_references(embedded[0].id, limit=2)
        assert res["available"] is True
        # v1 is closest to v0; it must rank first, with a high similarity.
        assert res["verses"][0]["verse_key"] == embedded[1].key
        assert res["verses"][0]["similarity"] > res["verses"][1]["similarity"]

    def test_excludes_self(self, embedded):
        from apps.semantic.services import cross_references

        res = cross_references(embedded[0].id, limit=5)
        keys = [v["verse_key"] for v in res["verses"]]
        assert embedded[0].key not in keys

    def test_missing_embedding(self, db):
        from apps.semantic.services import cross_references

        assert cross_references(999)["available"] is False


class TestSemanticSearch:
    def test_patched_query_ranks_by_similarity(self, embedded, monkeypatch):
        from apps.semantic import services

        monkeypatch.setattr(services, "embed_query", lambda q: _unit(0))
        res = services.semantic_search("anything", limit=2)
        assert res["count"] == 2
        assert res["verses"][0]["verse_key"] == embedded[0].key


class TestThemes:
    def test_theme_verses_filter(self, embedded):
        from apps.semantic.services import theme_verses

        assert theme_verses(1).count() == 1
        assert theme_verses(0).count() == 2
