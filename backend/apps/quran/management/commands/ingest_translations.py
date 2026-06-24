"""Ingest verse translations for a given language.

Usage:
    python manage.py ingest_translations --language=en --translator_id=131
    python manage.py ingest_translations --language=id --translator_id=33
"""
from __future__ import annotations

import re

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.quran.models import Surah, Translation, Verse

from ._client import QuranAPIClient

_TAG_RE = re.compile(r"<[^>]+>")

TRANSLATOR_NAMES = {
    131: "Sahih International",
    33: "Kemenag RI",
}


class Command(BaseCommand):
    help = "Ingest verse translations for a language from quran.com."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--language", required=True, choices=["en", "id"])
        parser.add_argument("--translator_id", required=True, type=int)

    def handle(self, *args, **options) -> None:
        language = options["language"]
        translator_id = options["translator_id"]
        translator = TRANSLATOR_NAMES.get(translator_id, f"resource:{translator_id}")

        client = QuranAPIClient()
        surahs = Surah.objects.all()
        if not surahs.exists():
            raise CommandError("No surahs found. Run ingest_surahs first.")

        total = 0
        for surah in surahs:
            total += self._ingest_surah(
                client, surah, language, translator_id, translator
            )
        self.stdout.write(
            self.style.SUCCESS(
                f"Translations ingested ({language}/{translator}): {total} verses."
            )
        )

    @transaction.atomic
    def _ingest_surah(
        self,
        client: QuranAPIClient,
        surah: Surah,
        language: str,
        translator_id: int,
        translator: str,
    ) -> int:
        self.stdout.write(f"Surah {surah.number} [{language}]...")
        verses = {v.number: v for v in surah.verses.all()}
        count = 0
        for record in client.paginate(
            f"quran/translations/{translator_id}",
            results_key="translations",
            chapter_number=surah.number,
        ):
            verse_key = record.get("verse_key", "")
            try:
                _, vnum = verse_key.split(":")
            except ValueError:
                continue
            verse = verses.get(int(vnum))
            if verse is None:
                continue
            Translation.objects.update_or_create(
                verse=verse,
                language=language,
                translator=translator,
                defaults={"text": _TAG_RE.sub("", record["text"]).strip()},
            )
            count += 1
        return count
