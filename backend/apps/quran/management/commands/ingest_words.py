"""Ingest word-level morphology (lemma, root, POS) for every verse.

Word positions are normalised to 1-indexed. Hamza/alef forms in roots are
normalised on ingestion (see apps.common.arabic).

Note on data sources: the quran.com verses endpoint provides the surface form
and translation but NOT lemma/root. True morphology comes from the Quranic
Arabic Corpus (a separate dataset — see PRD). Until that is wired in, when the
API supplies no lemma we fall back to the tashkeel-stripped surface form so
that frequency, rare-word, and numeric-claim analytics work at the
surface-word level. The clean form is what user search input is matched
against (search input is likewise tashkeel-stripped).
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.common.arabic import normalize_search
from apps.quran.models import Surah, Verse, Word, WordRoot

from ._client import QuranAPIClient

# Common Arabic particles treated as stopwords for analytics.
STOPWORDS = {"و", "ف", "ب", "ل", "ك", "في", "من", "ال", "ما", "ان", "إن"}


class Command(BaseCommand):
    help = "Ingest word-level morphology from the quran.com word endpoint."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--surah", type=int, default=None)

    def handle(self, *args, **options) -> None:
        client = QuranAPIClient()
        surahs = Surah.objects.all()
        if options["surah"]:
            surahs = surahs.filter(number=options["surah"])

        total = 0
        for surah in surahs:
            total += self._ingest_surah(client, surah)
        self.stdout.write(
            self.style.SUCCESS(f"Words ingested: {total} total.")
        )

    @transaction.atomic
    def _ingest_surah(self, client: QuranAPIClient, surah: Surah) -> int:
        self.stdout.write(f"Surah {surah.number} words...")
        verses = {v.number: v for v in surah.verses.all()}
        root_cache: dict[str, WordRoot] = {}
        count = 0

        for record in client.paginate(
            f"verses/by_chapter/{surah.number}",
            results_key="verses",
            words="true",
            word_fields="text_uthmani,lemma,root,transliteration",
            fields="text_uthmani",
        ):
            _, vnum = record["verse_key"].split(":")
            verse = verses.get(int(vnum))
            if verse is None:
                continue
            count += self._ingest_verse_words(verse, record.get("words", []), root_cache)
        return count

    def _ingest_verse_words(
        self,
        verse: Verse,
        words: list[dict],
        root_cache: dict[str, WordRoot],
    ) -> int:
        count = 0
        position = 0
        for w in words:
            # quran.com marks the end-of-verse glyph as char_type "end"; skip it.
            if w.get("char_type_name") and w["char_type_name"] != "word":
                continue
            position += 1  # normalise to 1-indexed regardless of source indexing
            root_obj = self._get_or_create_root(w.get("root"), root_cache)
            arabic = w.get("text_uthmani") or w.get("text") or ""
            translation = (w.get("translation") or {}).get("text", "")
            transliteration = (w.get("transliteration") or {}).get("text", "")
            # Prefer a real lemma; otherwise fall back to the normalized surface
            # form (same normalization as search input) so analytics have a
            # searchable key to group on.
            lemma = w.get("lemma") or normalize_search(arabic)
            Word.objects.update_or_create(
                verse=verse,
                position=position,
                defaults={
                    "arabic": arabic,
                    "transliteration": transliteration,
                    "translation_en": translation,
                    "lemma": lemma,
                    "root": root_obj,
                    "morphology_tag": w.get("pos") or "",
                    "is_stopword": lemma in STOPWORDS or arabic in STOPWORDS,
                },
            )
            count += 1
        return count

    def _get_or_create_root(
        self, root_arabic: str | None, cache: dict[str, WordRoot]
    ) -> WordRoot | None:
        if not root_arabic:
            return None
        key = normalize_search(root_arabic)
        if not key:
            return None
        if key in cache:
            return cache[key]
        root_obj, _ = WordRoot.objects.get_or_create(
            root_arabic=key,
            defaults={"root_transliteration": root_arabic},
        )
        cache[key] = root_obj
        return root_obj
