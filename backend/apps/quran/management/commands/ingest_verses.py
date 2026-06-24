"""Ingest verses + Uthmani Arabic text for every surah.

The Uthmani text is stored verbatim in ``text_uthmani``. ``text_clean`` is
derived by stripping tashkeel and exists solely for search.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.common.arabic import normalize_search
from apps.quran.models import Surah, Verse

from ._client import QuranAPIClient


class Command(BaseCommand):
    help = "Ingest verses + Uthmani Arabic text for every surah."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--surah",
            type=int,
            default=None,
            help="Ingest a single surah by number (default: all 114).",
        )

    def handle(self, *args, **options) -> None:
        client = QuranAPIClient()
        surah_filter = options["surah"]
        surahs = Surah.objects.all()
        if surah_filter:
            surahs = surahs.filter(number=surah_filter)

        if not surahs.exists():
            self.stderr.write(
                self.style.ERROR("No surahs found. Run ingest_surahs first.")
            )
            return

        total = 0
        for surah in surahs:
            total += self._ingest_surah(client, surah)
        self.stdout.write(
            self.style.SUCCESS(f"Verses ingested: {total} total.")
        )

    @transaction.atomic
    def _ingest_surah(self, client: QuranAPIClient, surah: Surah) -> int:
        self.stdout.write(f"Surah {surah.number} ({surah.name_transliteration})...")
        count = 0
        for verse in client.paginate(
            "verses/by_chapter/%d" % surah.number,
            results_key="verses",
            fields="text_uthmani",
            words="false",
        ):
            text_uthmani = verse["text_uthmani"]
            Verse.objects.update_or_create(
                surah=surah,
                number=verse["verse_number"],
                defaults={
                    "text_uthmani": text_uthmani,
                    # Search key: tashkeel stripped + alef/hamza/taa forms
                    # unified, matching how query input is normalized so search
                    # actually hits. Never displayed to users.
                    "text_clean": normalize_search(text_uthmani),
                    "juz_number": verse.get("juz_number", 0),
                    "page_number": verse.get("page_number", 0),
                    # Global revelation order is approximated by chapter order;
                    # refined later if a chronological dataset is loaded.
                    "revelation_order": surah.revelation_order * 1000
                    + verse["verse_number"],
                },
            )
            count += 1
        return count
