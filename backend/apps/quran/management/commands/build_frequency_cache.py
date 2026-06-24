"""Rebuild the materialised WordFrequency cache."""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.quran.aggregation import build_frequency_cache


class Command(BaseCommand):
    help = "Rebuild the materialised word/root frequency cache."

    def handle(self, *args, **options) -> None:
        written = build_frequency_cache()
        self.stdout.write(
            self.style.SUCCESS(f"WordFrequency cache rebuilt: {written} rows.")
        )
