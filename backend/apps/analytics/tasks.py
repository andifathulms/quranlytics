"""Celery tasks for keeping materialised analytics tables fresh."""
from __future__ import annotations

from celery import shared_task
from django.core.cache import cache

from apps.quran.aggregation import build_frequency_cache, compute_surah_stats


@shared_task(name="apps.analytics.tasks.recompute_all_stats")
def recompute_all_stats() -> dict[str, int]:
    """Nightly: recompute SurahStats + WordFrequency, then clear analytics cache."""
    surahs = compute_surah_stats()
    frequencies = build_frequency_cache()
    cache.delete_pattern("analytics:*")
    return {"surah_stats": surahs, "frequency_rows": frequencies}
