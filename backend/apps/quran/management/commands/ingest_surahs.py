"""Ingest the 114 surahs (chapters) from quran.com."""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.quran.models import Surah

from ._client import QuranAPIClient


class Command(BaseCommand):
    help = "Ingest the 114 surahs from the quran.com API."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        client = QuranAPIClient()
        self.stdout.write("Fetching chapters...")
        payload = client.get("chapters", language="en")
        chapters = payload.get("chapters", [])

        created = updated = 0
        for ch in chapters:
            obj, was_created = Surah.objects.update_or_create(
                number=ch["id"],
                defaults={
                    "name_arabic": ch["name_arabic"],
                    "name_transliteration": ch["name_simple"],
                    "name_en": ch["translated_name"]["name"],
                    # Indonesian name filled by ingest_translations metadata pass;
                    # default to transliteration so the column is never empty.
                    "name_id": ch.get("name_simple", ""),
                    "revelation_type": (
                        "Meccan"
                        if ch["revelation_place"] == "makkah"
                        else "Medinan"
                    ),
                    "verse_count": ch["verses_count"],
                    "revelation_order": ch["revelation_order"],
                },
            )
            created += was_created
            updated += not was_created

        self.stdout.write(
            self.style.SUCCESS(
                f"Surahs ingested: {created} created, {updated} updated "
                f"({Surah.objects.count()} total)."
            )
        )
