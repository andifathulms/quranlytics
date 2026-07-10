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

from collections import Counter, defaultdict

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.common.arabic import normalize_search, transliterate_root
from apps.quran.models import Verse, Word, WordRoot, WordSegment

# Feature tokens that are grammatical-agreement markers, not a word-class — so
# ``pos_detail`` skips past them to the genuine POS subclass (or falls back to
# the coarse tag). INDEF is definiteness, likewise not a class.
_CASE = {"NOM", "ACC", "GEN"}
_GENDER_NUMBER = {
    "M", "F", "MS", "FS", "MD", "FD", "MP", "FP", "S", "D", "DU", "MDU", "FDU",
}
_AGREEMENT = _CASE | _GENDER_NUMBER | {"INDEF"}

_ROMAN = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
    7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
}


def _pos_detail(tokens: list[str]) -> str:
    """First genuine word-class token in a segment's features (else "")."""
    for t in tokens:
        if not t or ":" in t or t in ("PREF", "SUFF"):
            continue
        if t in _AGREEMENT or t[0] in "123":  # agreement or person marker (2MS…)
            continue
        return t
    return ""


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
        segments = self._parse_segments(raw)
        self.stdout.write(
            f"Parsed {len(morphology)} words / "
            f"{sum(len(v) for v in segments.values())} segments."
        )
        self._apply(morphology, segments)

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
            is_clitic = False
            for feat in features.split("|"):
                if feat in ("PREF", "SUFF"):
                    # Proclitic (و، ال، بـ، يـ vocative…) or enclitic (pronoun,
                    # emphatic ن…) segment — never the word's stem.
                    is_clitic = True
                elif feat.startswith("ROOT:"):
                    root = feat[5:].strip()
                elif feat.startswith("LEM:"):
                    lem = feat[4:].strip()

            key = (s, v, w)
            rec = words.setdefault(key, {"root": None, "lemma": None, "pos": None})

            # Only the stem contributes lemma/root/pos. Skipping PREF/SUFF
            # segments stops a prefix's own LEM (e.g. the conjunction LEM:و on
            # "وَيَعْقُوبَ") from being mistaken for the name's lemma — critical
            # for proper nouns, which carry a LEM but no ROOT.
            if is_clitic:
                continue
            if root and not rec["root"]:
                rec["root"] = root
            if lem and not rec["lemma"]:
                rec["lemma"] = lem
            if tag and not rec["pos"]:
                rec["pos"] = tag
        return words

    def _parse_segments(
        self, raw: str
    ) -> dict[tuple[int, int, int], list[dict]]:
        """One record per *segment*, grouped by (surah, verse, word).

        Keeps the full grammatical detail the word-level ``_parse`` discards:
        segment type, POS subclass, verb form, mood, and voice.
        """
        by_word: dict[tuple[int, int, int], list[dict]] = defaultdict(list)
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            location, form, tag = parts[0], parts[1], parts[2]
            features = parts[3] if len(parts) > 3 else ""

            bits = location.strip().strip("()").split(":")
            if len(bits) < 3:
                continue
            try:
                s, v, w = int(bits[0]), int(bits[1]), int(bits[2])
                seg_pos = int(bits[3]) if len(bits) > 3 else len(by_word[(s, v, w)]) + 1
            except ValueError:
                continue

            tokens = features.split("|") if features else []
            if "PREF" in tokens:
                seg_type = "prefix"
            elif "SUFF" in tokens:
                seg_type = "suffix"
            else:
                seg_type = "stem"

            root = lemma = ""
            verb_form = mood = voice = ""
            for feat in tokens:
                if feat.startswith("ROOT:"):
                    root = normalize_search(feat[5:].strip())
                elif feat.startswith("LEM:"):
                    lemma = normalize_search(feat[4:].strip())
                elif feat.startswith("VF:"):
                    try:
                        verb_form = _ROMAN.get(int(feat[3:]), feat[3:])
                    except ValueError:
                        pass
                elif feat.startswith("MOOD:"):
                    mood = feat[5:].strip()
            if tag == "V":  # voice is meaningful only for verbs
                voice = "PASS" if "PASS" in tokens else "ACT"

            by_word[(s, v, w)].append(
                {
                    "position": seg_pos,
                    "arabic": form,
                    "segment_type": seg_type,
                    "pos_tag": tag,
                    "pos_detail": _pos_detail(tokens),
                    "lemma": lemma,
                    "root": root,  # normalized key, resolved to FK in _apply
                    "verb_form": verb_form,
                    "mood": mood,
                    "voice": voice,
                    "features": features[:200],
                }
            )
        return by_word

    # ── apply ───────────────────────────────────────────────────────────
    @transaction.atomic
    def _apply(
        self,
        morphology: dict[tuple[int, int, int], dict],
        segments: dict[tuple[int, int, int], list[dict]],
    ) -> None:
        root_map = self._ensure_roots(morphology)

        # Segments are fully rebuilt each run (a word's segmentation is derived
        # wholly from the source), so clear before recreating — idempotent.
        WordSegment.objects.all().delete()

        updated = with_root = seg_created = 0
        batch: list[Word] = []
        seg_batch: list[WordSegment] = []
        verses = Verse.objects.select_related("surah").prefetch_related("words")
        for verse in verses.iterator(chunk_size=500):
            s, v = verse.surah.number, verse.number
            for word in verse.words.all():
                # ── segment rows (independent of the word-level aggregate) ──
                for seg in segments.get((s, v, word.position), ()):  # type: ignore[assignment]
                    seg_batch.append(
                        WordSegment(
                            word=word,
                            position=seg["position"],
                            arabic=seg["arabic"],
                            segment_type=seg["segment_type"],
                            pos_tag=seg["pos_tag"],
                            pos_detail=seg["pos_detail"],
                            lemma=seg["lemma"],
                            root_id=root_map.get(seg["root"]) if seg["root"] else None,
                            verb_form=seg["verb_form"],
                            mood=seg["mood"],
                            voice=seg["voice"],
                            features=seg["features"],
                        )
                    )
                    seg_created += 1
                if len(seg_batch) >= 4000:
                    WordSegment.objects.bulk_create(seg_batch)
                    seg_batch = []

                # ── word-level aggregate (lemma / root / coarse POS) ──
                rec = morphology.get((s, v, word.position))
                if rec is None:
                    continue
                changed = False
                if rec["lemma"]:
                    new_lemma = normalize_search(rec["lemma"])
                else:
                    # No stem lemma from the corpus (e.g. a conjunction+pronoun
                    # like وَهُوَ). Fall back to the normalized surface form — the
                    # same default ingest_words uses — so a re-run never leaves a
                    # stale prefix lemma (the old "LEM:و" bug) behind.
                    new_lemma = normalize_search(word.arabic)
                if new_lemma and word.lemma != new_lemma:
                    word.lemma = new_lemma
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
        if seg_batch:
            WordSegment.objects.bulk_create(seg_batch)

        total = Word.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Morphology applied: {updated}/{total} words updated, "
                f"{with_root} given a root, {WordRoot.objects.count()} roots, "
                f"{seg_created} segments created."
            )
        )

    def _ensure_roots(
        self, morphology: dict[tuple[int, int, int], dict]
    ) -> dict[str, int]:
        """Create/refresh WordRoot rows; return {normalized_root: id}.

        ``root_arabic`` is the normalized lookup key; ``root_display`` keeps the
        most common raw orthography (hamza preserved) for the UI.
        """
        raw_counts: dict[str, Counter] = defaultdict(Counter)
        for rec in morphology.values():
            raw = rec["root"]
            if not raw:
                continue
            norm = normalize_search(raw)
            if norm:
                raw_counts[norm][raw] += 1

        # Most common raw form per normalized key.
        display = {
            norm: counts.most_common(1)[0][0] for norm, counts in raw_counts.items()
        }

        existing = set(
            WordRoot.objects.filter(root_arabic__in=display).values_list(
                "root_arabic", flat=True
            )
        )
        WordRoot.objects.bulk_create(
            [
                WordRoot(
                    root_arabic=norm,
                    root_display=raw,
                    root_transliteration=transliterate_root(raw),
                )
                for norm, raw in display.items()
                if norm not in existing
            ],
            batch_size=1000,
        )
        # Refresh display/translit for roots that already existed (idempotent).
        if existing:
            refresh = [
                WordRoot(
                    pk=pk,
                    root_arabic=norm,
                    root_display=display[norm],
                    root_transliteration=transliterate_root(display[norm]),
                )
                for norm, pk in WordRoot.objects.filter(
                    root_arabic__in=existing
                ).values_list("root_arabic", "id")
            ]
            WordRoot.objects.bulk_update(
                refresh, ["root_display", "root_transliteration"], batch_size=1000
            )

        return dict(
            WordRoot.objects.filter(root_arabic__in=display).values_list(
                "root_arabic", "id"
            )
        )
