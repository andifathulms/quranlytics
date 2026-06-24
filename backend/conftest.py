"""Shared pytest fixtures for the Quranlytics backend."""
from __future__ import annotations

import pytest
from django.utils import timezone
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clear_cache():
    """Isolate Redis-backed cache between tests (cache survives DB rollback)."""
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api() -> APIClient:
    return APIClient()


@pytest.fixture
def surah(db):
    from apps.quran.models import Surah

    return Surah.objects.create(
        number=1,
        name_arabic="الفاتحة",
        name_transliteration="Al-Fatihah",
        name_en="The Opener",
        name_id="Pembuka",
        revelation_type="Meccan",
        verse_count=7,
        revelation_order=5,
    )


@pytest.fixture
def root(db):
    from apps.quran.models import WordRoot

    return WordRoot.objects.create(
        root_arabic="كتب",
        root_display="كتب",
        root_transliteration="k-t-b",
        meaning_en="to write",
    )


@pytest.fixture
def verse(db, surah):
    from apps.quran.models import Translation, Verse

    v = Verse.objects.create(
        surah=surah,
        number=2,
        text_uthmani="ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
        text_clean="الحمد لله رب العالمين",
        juz_number=1,
        page_number=1,
        revelation_order=5002,
    )
    Translation.objects.create(
        verse=v, language="en", translator="Sahih International",
        text="All praise is due to Allah, Lord of the worlds.",
    )
    Translation.objects.create(
        verse=v, language="id", translator="Kemenag RI",
        text="Segala puji bagi Allah, Tuhan seluruh alam.",
    )
    return v


@pytest.fixture
def words(db, verse, root):
    from apps.quran.models import Word

    specs = [
        ("ٱلْحَمْدُ", "حمد", 1),
        ("لِلَّهِ", "الله", 2),
        ("رَبِّ", "رب", 3),
        ("كِتَٰب", "كتاب", 4),  # shares the كتب root
    ]
    created = []
    for arabic, lemma, pos in specs:
        created.append(
            Word.objects.create(
                verse=verse,
                position=pos,
                arabic=arabic,
                lemma=lemma,
                root=root if lemma == "كتاب" else None,
            )
        )
    return created
