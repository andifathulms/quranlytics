"""Populate WordRoot.meaning_en from the bundled Lane's Lexicon dataset.

Source content is Lane's Arabic-English Lexicon (public domain); see
apps/quran/data/README.md. Idempotent: matches on the normalized root key, so
re-running only refreshes meanings.
"""
from __future__ import annotations

import json
from pathlib import Path

from django.core.management.base import BaseCommand

from apps.common.arabic import normalize_search
from apps.quran.models import WordRoot

DATA_FILE = (
    Path(__file__).resolve().parents[2] / "data" / "root_meanings_lanes.json"
)


def _key_variants(raw_key: str) -> set[str]:
    """Normalized lookup keys for a lexicon entry (space-separated letters).

    ``normalize_search`` unifies alef/hamza carriers and strips tashkeel but
    keeps the standalone hamza ``ء``; roots are stored without it, so we also
    add ء-dropped and ء→ا variants to maximise matches.
    """
    base = normalize_search(raw_key.replace(" ", ""))
    return {base, base.replace("ء", ""), base.replace("ء", "ا")}


class Command(BaseCommand):
    help = "Ingest Lane's Lexicon English glosses into WordRoot.meaning_en."

    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Also replace meanings that are already set.",
        )

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(f"Data file not found: {DATA_FILE}")
            return

        lexicon: dict[str, str] = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        # Map every key variant -> meaning (first writer wins on collision).
        lookup: dict[str, str] = {}
        for raw_key, meaning in lexicon.items():
            meaning = (meaning or "").strip()
            if not meaning:
                continue
            for k in _key_variants(raw_key):
                lookup.setdefault(k, meaning)

        roots = list(WordRoot.objects.all())
        to_update: list[WordRoot] = []
        for root in roots:
            if root.meaning_en and not options["overwrite"]:
                continue
            meaning = lookup.get(root.root_arabic)
            if meaning and meaning != root.meaning_en:
                root.meaning_en = meaning
                to_update.append(root)

        WordRoot.objects.bulk_update(to_update, ["meaning_en"], batch_size=500)

        matched = sum(1 for r in roots if lookup.get(r.root_arabic))
        self.stdout.write(
            self.style.SUCCESS(
                f"Roots: {len(roots)} · matched in lexicon: {matched} "
                f"({100 * matched // max(1, len(roots))}%) · updated: {len(to_update)}"
            )
        )
