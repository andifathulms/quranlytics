"""Seed a tiny, network-free dataset for smoke tests and local demos.

Creates two surahs with a handful of verses, EN+ID translations, words with a
root, and the materialised stats/frequency caches — enough to exercise the read
and analytics APIs without hitting external services or the embedding model.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.common.arabic import normalize_search
from apps.quran.aggregation import build_frequency_cache, compute_surah_stats
from apps.quran.models import Surah, Translation, Verse, Word, WordRoot

SURAHS = [
    {
        "number": 1,
        "name_arabic": "الفاتحة",
        "name_transliteration": "Al-Fatihah",
        "name_en": "The Opener",
        "name_id": "Pembuka",
        "revelation_type": "Meccan",
        "revelation_order": 5,
        "verses": [
            ("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "In the name of Allah.", "Dengan nama Allah."),
            ("ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", "All praise is for Allah.", "Segala puji bagi Allah."),
            ("ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "The Most Gracious, the Most Merciful.", "Yang Maha Pengasih."),
        ],
    },
    {
        "number": 112,
        "name_arabic": "الإخلاص",
        "name_transliteration": "Al-Ikhlas",
        "name_en": "Sincerity",
        "name_id": "Ikhlas",
        "revelation_type": "Meccan",
        "revelation_order": 22,
        "verses": [
            ("قُلْ هُوَ ٱللَّهُ أَحَدٌ", "Say, He is Allah, One.", "Katakanlah, Dialah Allah Yang Maha Esa."),
            ("ٱللَّهُ ٱلصَّمَدُ", "Allah, the Eternal Refuge.", "Allah tempat meminta."),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed a minimal demo dataset (no network, no ML)."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        root = WordRoot.objects.get_or_create(
            root_arabic=normalize_search("حمد"),
            defaults={"root_transliteration": "ḥ-m-d", "meaning_en": "to praise"},
        )[0]

        for s in SURAHS:
            surah, _ = Surah.objects.update_or_create(
                number=s["number"],
                defaults={
                    "name_arabic": s["name_arabic"],
                    "name_transliteration": s["name_transliteration"],
                    "name_en": s["name_en"],
                    "name_id": s["name_id"],
                    "revelation_type": s["revelation_type"],
                    "verse_count": len(s["verses"]),
                    "revelation_order": s["revelation_order"],
                },
            )
            for i, (ar, en, idn) in enumerate(s["verses"], start=1):
                verse, _ = Verse.objects.update_or_create(
                    surah=surah,
                    number=i,
                    defaults={
                        "text_uthmani": ar,
                        "text_clean": normalize_search(ar),
                        "juz_number": 1,
                        "page_number": 1,
                        "revelation_order": s["revelation_order"] * 1000 + i,
                    },
                )
                Translation.objects.update_or_create(
                    verse=verse, language="en", translator="Demo",
                    defaults={"text": en},
                )
                Translation.objects.update_or_create(
                    verse=verse, language="id", translator="Demo",
                    defaults={"text": idn},
                )
                for pos, token in enumerate(ar.split(), start=1):
                    Word.objects.update_or_create(
                        verse=verse,
                        position=pos,
                        defaults={
                            "arabic": token,
                            "lemma": normalize_search(token),
                            "root": root if "حمد" in normalize_search(token) else None,
                        },
                    )

        compute_surah_stats()
        build_frequency_cache()
        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {Surah.objects.count()} surahs, "
                f"{Verse.objects.count()} verses, {Word.objects.count()} words."
            )
        )
