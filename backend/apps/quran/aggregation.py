"""Materialised-stat builders for surah stats and word-frequency cache.

These functions are the single source of truth for the ``SurahStats`` and
``WordFrequency`` tables. They are invoked by the ``compute_stats`` /
``build_frequency_cache`` management commands and by the nightly Celery task.
"""
from __future__ import annotations

from collections import Counter, defaultdict

from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from apps.common.arabic import strip_tashkeel

from .models import Surah, SurahStats, Word, WordFrequency, WordRoot


def _letter_count(text_clean: str) -> int:
    """Count Arabic letters (no spaces, no tashkeel)."""
    return sum(1 for ch in text_clean if not ch.isspace())


@transaction.atomic
def compute_surah_stats() -> int:
    """Recompute SurahStats for every surah. Returns rows written."""
    now = timezone.now()
    written = 0
    for surah in Surah.objects.prefetch_related("verses__words"):
        verses = list(surah.verses.all())
        words = [w for v in verses for w in v.words.all()]
        lemmas = {w.lemma for w in words if w.lemma}
        roots = {w.root_id for w in words if w.root_id}
        letters = sum(_letter_count(strip_tashkeel(v.text_clean)) for v in verses)
        SurahStats.objects.update_or_create(
            surah=surah,
            defaults={
                "verse_count": len(verses),
                "word_count": len(words),
                "letter_count": letters,
                "unique_word_count": len(lemmas),
                "unique_root_count": len(roots),
                "computed_at": now,
            },
        )
        written += 1
    return written


@transaction.atomic
def build_frequency_cache() -> int:
    """Rebuild the WordFrequency materialised table from the Word table.

    Aggregates counts per lemma and per root, with a per-surah distribution
    stored as jsonb. Returns the number of frequency rows written.
    """
    now = timezone.now()
    WordFrequency.objects.all().delete()

    lemma_totals: Counter[str] = Counter()
    lemma_dist: dict[str, Counter[int]] = defaultdict(Counter)
    root_totals: Counter[int] = Counter()
    root_dist: dict[int, Counter[int]] = defaultdict(Counter)

    qs = Word.objects.select_related("verse__surah").only(
        "lemma", "root_id", "verse__surah__number"
    )
    for word in qs.iterator(chunk_size=5000):
        surah_no = word.verse.surah.number
        if word.lemma:
            lemma_totals[word.lemma] += 1
            lemma_dist[word.lemma][surah_no] += 1
        if word.root_id:
            root_totals[word.root_id] += 1
            root_dist[word.root_id][surah_no] += 1

    rows = [
        WordFrequency(
            lemma=lemma,
            root=None,
            total_count=total,
            surah_distribution={str(k): v for k, v in lemma_dist[lemma].items()},
            computed_at=now,
        )
        for lemma, total in lemma_totals.items()
    ]
    rows += [
        WordFrequency(
            lemma="",
            root_id=root_id,
            total_count=total,
            surah_distribution={str(k): v for k, v in root_dist[root_id].items()},
            computed_at=now,
        )
        for root_id, total in root_totals.items()
    ]
    WordFrequency.objects.bulk_create(rows, batch_size=2000)
    return len(rows)
