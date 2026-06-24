"""Tests for the Quranic Arabic Corpus morphology parser."""
from __future__ import annotations

from apps.quran.management.commands.ingest_morphology import Command

# A few real segment lines from surah 1 (Al-Fatihah).
SAMPLE = "\n".join(
    [
        "# a comment line that must be ignored",
        "1:1:1:1\tبِ\tP\tP|PREF|LEM:ب",
        "1:1:1:2\tسْمِ\tN\tROOT:سمو|LEM:اسْم|M|GEN",
        "1:1:2:1\tٱللَّهِ\tN\tPN|ROOT:أله|LEM:اللَّه|GEN",
        "1:1:3:1\tٱل\tP\tDET|PREF|LEM:ال",
        "1:1:3:2\tرَّحْمَٰنِ\tN\tROOT:رحم|LEM:رَحْمٰن|MS|GEN|ADJ",
    ]
)


def test_parse_aggregates_segments_to_words():
    records = Command()._parse(SAMPLE)
    # Three distinct words: (1,1,1), (1,1,2), (1,1,3).
    assert set(records) == {(1, 1, 1), (1, 1, 2), (1, 1, 3)}


def test_parse_extracts_root_and_lemma_from_stem_segment():
    records = Command()._parse(SAMPLE)
    # Word 1 spans a prefix (بِ) + stem (سْمِ); ROOT/LEM come from the stem.
    assert records[(1, 1, 1)]["root"] == "سمو"
    assert records[(1, 1, 1)]["lemma"] == "اسْم"
    assert records[(1, 1, 1)]["pos"] == "N"


def test_parse_word_without_root_keeps_lemma():
    # Word (1,1,3) is ٱل + رَّحْمَٰنِ — the stem carries ROOT:رحم.
    records = Command()._parse(SAMPLE)
    assert records[(1, 1, 3)]["root"] == "رحم"
    assert records[(1, 1, 3)]["lemma"] == "رَحْمٰن"


def test_parse_ignores_comments_and_blank_lines():
    records = Command()._parse(SAMPLE + "\n\n#trailing\n")
    assert len(records) == 3
