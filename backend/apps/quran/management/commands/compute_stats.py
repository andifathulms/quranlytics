"""Recompute the materialised SurahStats table."""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.quran.aggregation import compute_surah_stats


class Command(BaseCommand):
    help = "Recompute materialised per-surah statistics."

    def handle(self, *args, **options) -> None:
        written = compute_surah_stats()
        self.stdout.write(
            self.style.SUCCESS(f"SurahStats recomputed for {written} surahs.")
        )
