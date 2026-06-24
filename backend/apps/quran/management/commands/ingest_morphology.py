"""Ingest word-level morphology from the Quranic Arabic Corpus.

Source: a tab-separated morphology export whose roots and lemmas are already in
Arabic script (no Buckwalter round-trip needed). Each line is one *segment*:

    location <TAB> form <TAB> tag <TAB> features
    1:1:1:2   سْمِ   N    ROOT:سمو|LEM:اسْم|M|GEN

``location`` is ``surah:verse:word:segment`` (all 1-indexed). A word can span
several segments (prefixes/suffixes); ROOT/LEM live on the stem segment. We
aggregate to the word level and update the matching ``Word`` rows, creating
``WordRoot`` entries keyed on the normalized root so the Root Explorer lookups
match user input.

This makes frequency grouping and the Root Explorer morphologically accurate,
replacing the surface-form lemma fallback used by ``ingest_words``.
"""
from __future__ import annotations

from collections import defaultdict

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.common.arabic import normalize_search, transliterate_root
from apps.quran.models import Verse, Word, WordRoot


class Command(BaseCommand):
    help = "Ingest roots + lemmas from the Quranic Arabic Corpus morphology file."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--file",
            default=None,
            help="Path to a local morphology .txt (skips download).",
        )
        parser.add_argument(
            "--url",
            default=settings.QURAN_MORPHOLOGY_URL,
            help="URL of the morphology file.",
        )

    def handle(self, *args, **options) -> None:
        raw = self._load(options["file"], options["url"])
        morphology = self._parse(raw)
        self.stdout.write(f"Parsed morphology for {len(morphology)} words.")
        self._apply(morphology)

    # ── load ────────────────────────────────────────────────────────────
    def _load(self, path: str | None, url: str) -> str:
        if path:
            self.stdout.write(f"Reading {path}...")
            with open(path, encoding="utf-8") as fh:
                return fh.read()
        self.stdout.write(f"Downloading {url}...")
        resp = requests.get(url, timeout=120)
        resp.raise_for_status()
        resp.encoding = "utf-8"
        return resp.text

    # ── parse ───────────────────────────────────────────────────────────
    def _parse(self, raw: str) -> dict[tuple[int, int, int], dict]:
        """Aggregate segment lines into one record per (surah, verse, word)."""
        words: dict[tuple[int, int, int], dict] = {}
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            location, _form, tag = parts[0], parts[1], parts[2]
            features = parts[3] if len(parts) > 3 else ""

            loc = location.strip().strip("()")
            bits = loc.split(":")
            if len(bits) < 3:
                continue
            try:
                s, v, w = int(bits[0]), int(bits[1]), int(bits[2])
            except ValueError:
                continue

            root = lem = None
            for feat in features.split("|"):
                if feat.startswith("ROOT:"):
                    root = feat[5:].strip()
                elif feat.startswith("LEM:"):
                    lem = feat[4:].strip()

            key = (s, v, w)
            rec = words.get(key)
            if rec is None:
                rec = {"root": None, "lemma": None, "pos": tag}
                words[key] = rec
            # The stem segment carries the ROOT; prefer it for pos + lemma too.
            if root and not rec["root"]:
                rec["root"] = root
                rec["pos"] = tag
                if lem:
                    rec["lemma"] = lem
            elif lem and not rec["lemma"]:
                rec["lemma"] = lem
        return words

    # ── apply ───────────────────────────────────────────────────────────
    @transaction.atomic
    def _apply(self, morphology: dict[tuple[int, int, int], dict]) -> None:
        root_map = self._ensure_roots(morphology)

        updated = with_root = 0
        batch: list[Word] = []
        verses = Verse.objects.select_related("surah").prefetch_related("words")
        for verse in verses.iterator(chunk_size=500):
            s, v = verse.surah.number, verse.number
            for word in verse.words.all():
                rec = morphology.get((s, v, word.position))
                if rec is None:
                    continue
                changed = False
                if rec["lemma"]:
                    word.lemma = normalize_search(rec["lemma"])
                    changed = True
                if rec["root"]:
                    word.root_id = root_map.get(normalize_search(rec["root"]))
                    with_root += 1
                    changed = True
                if rec["pos"]:
                    word.morphology_tag = rec["pos"]
                    changed = True
                if changed:
                    batch.append(word)
                    updated += 1
                if len(batch) >= 4000:
                    Word.objects.bulk_update(
                        batch, ["lemma", "root", "morphology_tag"]
                    )
                    batch = []
        if batch:
            Word.objects.bulk_update(batch, ["lemma", "root", "morphology_tag"])

        total = Word.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Morphology applied: {updated}/{total} words updated, "
                f"{with_root} given a root, {WordRoot.objects.count()} roots."
            )
        )

    def _ensure_roots(
        self, morphology: dict[tuple[int, int, int], dict]
    ) -> dict[str, int]:
        """Create any missing WordRoot rows; return {normalized_root: id}."""
        wanted: dict[str, str] = {}  # normalized -> a raw form (for translit)
        for rec in morphology.values():
            raw = rec["root"]
            if not raw:
                continue
            norm = normalize_search(raw)
            if norm:
                wanted.setdefault(norm, raw)

        existing = dict(
            WordRoot.objects.filter(root_arabic__in=wanted).values_list(
                "root_arabic", "id"
            )
        )
        to_create = [
            WordRoot(
                root_arabic=norm,
                root_transliteration=transliterate_root(raw),
            )
            for norm, raw in wanted.items()
            if norm not in existing
        ]
        if to_create:
            WordRoot.objects.bulk_create(to_create, batch_size=1000)
        return dict(
            WordRoot.objects.filter(root_arabic__in=wanted).values_list(
                "root_arabic", "id"
            )
        )
