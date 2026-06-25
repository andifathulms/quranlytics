"""Ingest verse translations for a given language.

Usage:
    python manage.py ingest_translations --language=en --translator_id=20
    python manage.py ingest_translations --language=id --translator_id=33

The quran.com ``quran/translations/{id}`` endpoint returns one record per verse
in verse order for the given chapter, with NO verse_key — so records are mapped
positionally (record N -> verse N). It returns the whole chapter in one
response (no pagination).
"""
from __future__ import annotations

import re

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.quran.models import Surah, Translation

from ._client import QuranAPIClient

_TAG_RE = re.compile(r"<[^>]+>")

TRANSLATOR_NAMES = {
    20: "Saheeh International",
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
        payload = client.get(
            f"quran/translations/{translator_id}", chapter_number=surah.number
        )
        records = payload.get("translations", [])
        count = 0
        # Records are returned in verse order; map positionally to verse N.
        for index, record in enumerate(records, start=1):
            # Prefer an explicit verse_key if the API ever provides one again.
            verse_key = record.get("verse_key") or ""
            if ":" in verse_key:
                index = int(verse_key.split(":")[1])
            verse = verses.get(index)
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
