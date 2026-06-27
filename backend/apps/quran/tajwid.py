"""Tajwīd annotation of Uthmani text — for the reader's colour-coding aid.

This module NEVER alters Quranic text. ``annotate`` splits ``text_uthmani`` into
consecutive segments, tagging some with a tajwīd rule; the concatenation of all
segment texts is byte-for-byte identical to the input (guaranteed by a runtime
assert and tested across every verse). The frontend only colours these spans.

Scope (stated honestly in the UI): this covers the rules that are reliably
detectable from the script —

  ghunnah    : نّ / مّ (noon/meem with shadda) — nasalisation held ~2 counts.
  idghām     : noon-sākin / tanwīn followed by ي ر م ل و ن (yarmalūn).
  iqlāb      : noon-sākin / tanwīn followed by ب (or the small-meem mark).
  ikhfāʾ     : noon-sākin / tanwīn followed by one of the 15 ikhfāʾ letters.
  idhār      : noon-sākin / tanwīn followed by a throat letter (ء ه ع ح غ خ).
  qalqalah   : ق ط ب ج د carrying sukūn, or as the final letter at a stop.
  madd       : a letter bearing the explicit maddah sign (ٓ) — obligatory madd.

It is a study aid, not a substitute for learning tajwīd with a qualified
teacher; subtle exceptions and waqf-dependent cases are not all captured.
"""
from __future__ import annotations

from typing import Any

# ── combining marks ──────────────────────────────────────────────────────
FATHA, DAMMA, KASRA = "َ", "ُ", "ِ"
FATHATAN, DAMMATAN, KASRATAN = "ً", "ٌ", "ٍ"
SUKUN, SHADDA, MADDAH = "ْ", "ّ", "ٓ"
SMALL_HIGH_MEEM_IQLAB = "ۢ"  # Uthmani iqlāb marker
TANWIN = {FATHATAN, DAMMATAN, KASRATAN}

# A mark is any combining character that hangs off a base letter.
def _is_mark(ch: str) -> bool:
    o = ord(ch)
    return (
        0x0610 <= o <= 0x061A
        or 0x064B <= o <= 0x065F
        or o == 0x0670  # superscript alef
        or 0x06D6 <= o <= 0x06ED
    )


def _is_letter(ch: str) -> bool:
    o = ord(ch)
    return (0x0621 <= o <= 0x064A) or o in (0x0671, 0x0672, 0x0673, 0x0675)


# ── letter classes ───────────────────────────────────────────────────────
NOON, MEEM, BEH = "ن", "م", "ب"
ALEF_WASLA = "ٱ"
QALQALA = {"ق", "ط", "ب", "ج", "د"}  # ق ط ب ج د
YARMALUN = {"ي", "ر", "م", "ل", "و", "ن"}  # يرملون
THROAT = {  # idhār ḥalqī
    "ء", "أ", "إ", "آ", "ؤ", "ئ",  # hamza forms
    "ه", "ع", "ح", "غ", "خ",            # ه ع ح غ خ
}


class _Cluster:
    __slots__ = ("base", "marks", "text", "is_letter")

    def __init__(self, base: str, marks: str, is_letter: bool):
        self.base = base
        self.marks = marks
        self.text = base + marks
        self.is_letter = is_letter


def _tokenize(text: str) -> list[_Cluster]:
    """Split into letter clusters (base + its marks) and raw (space/punct) runs."""
    clusters: list[_Cluster] = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if _is_letter(ch):
            j = i + 1
            while j < n and _is_mark(text[j]):
                j += 1
            clusters.append(_Cluster(ch, text[i + 1 : j], True))
            i = j
        else:
            # Raw run of non-letter characters (spaces, ayah marks, etc.).
            j = i + 1
            while j < n and not _is_letter(text[j]):
                j += 1
            clusters.append(_Cluster(text[i:j], "", False))
            i = j
    return clusters


# Silent seats skipped when finding the next pronounced consonant: the alef-
# waṣla (ٱ), and the bare alef (ا) — including the tanwīn seat-alef in ‘ـًا’ and
# the alef of prolongation. None of these is a consonant the noon assimilates to.
_SILENT_SEATS = {ALEF_WASLA, "ا"}


def _next_pronounced_base(clusters: list[_Cluster], idx: int) -> str | None:
    """Base of the next pronounced letter after ``idx`` (skips raw runs and
    silent seats, so e.g. a noon before ‘ٱل’ sees the lām, and a tanwīn before
    ‘ـًا أَحَد’ sees the hamza)."""
    for k in range(idx + 1, len(clusters)):
        c = clusters[k]
        if not c.is_letter:
            continue
        if c.base in _SILENT_SEATS:
            continue
        return c.base
    return None


def _noon_tanwin_rule(next_base: str | None) -> str | None:
    if next_base is None:
        return None
    if next_base in THROAT:
        return "idhar"
    if next_base == BEH:
        return "iqlab"
    if next_base in YARMALUN:
        return "idgham"
    return "ikhfa"  # one of the remaining (ikhfāʾ) letters


def _last_letter_index(clusters: list[_Cluster]) -> int:
    for k in range(len(clusters) - 1, -1, -1):
        if clusters[k].is_letter:
            return k
    return -1


def _classify(clusters: list[_Cluster], idx: int, last_letter: int) -> str | None:
    c = clusters[idx]
    if not c.is_letter:
        return None
    marks = c.marks

    # 1) Ghunnah: noon/meem with shadda.
    if c.base in (NOON, MEEM) and SHADDA in marks:
        return "ghunnah"

    # 2) Noon-sākin / tanwīn rules (look at the next pronounced letter).
    is_noon_sakin = c.base == NOON and SUKUN in marks
    has_tanwin = any(t in marks for t in TANWIN)
    if SMALL_HIGH_MEEM_IQLAB in marks:
        return "iqlab"
    if is_noon_sakin or has_tanwin:
        rule = _noon_tanwin_rule(_next_pronounced_base(clusters, idx))
        if rule:
            return rule

    # 3) Qalqalah: qalqala letter with sukūn, or final letter at a stop.
    if c.base in QALQALA:
        if SUKUN in marks:
            return "qalqalah"
        if idx == last_letter:  # waqf — the final letter is pronounced sākin
            return "qalqalah"

    # 4) Madd: explicit maddah sign, or the precomposed alef-madda (آ).
    if MADDAH in marks or c.base == "آ":
        return "madd"

    return None


def annotate(text: str) -> list[dict[str, Any]]:
    """Return ``[{"text": str, "rule": str | None}, ...]`` covering ``text``
    exactly (segments joined == input). Adjacent same-rule clusters are merged."""
    clusters = _tokenize(text)
    last_letter = _last_letter_index(clusters)

    segments: list[dict[str, Any]] = []
    for idx, c in enumerate(clusters):
        rule = _classify(clusters, idx, last_letter)
        if segments and segments[-1]["rule"] == rule:
            segments[-1]["text"] += c.text
        else:
            segments.append({"text": c.text, "rule": rule})

    # Integrity: we must never have altered the text.
    assert "".join(s["text"] for s in segments) == text, "tajwīd altered text"
    return segments


# Rule metadata for the UI legend (id → label + colour hint).
RULES_LEGEND = [
    {"id": "ghunnah", "label_en": "Ghunnah (nasalisation)", "color": "#0d9488"},
    {"id": "idgham", "label_en": "Idghām (merging)", "color": "#7c3aed"},
    {"id": "ikhfa", "label_en": "Ikhfāʾ (concealment)", "color": "#2563eb"},
    {"id": "iqlab", "label_en": "Iqlāb (conversion)", "color": "#db2777"},
    {"id": "idhar", "label_en": "Idhār (clear)", "color": "#475569"},
    {"id": "qalqalah", "label_en": "Qalqalah (echo)", "color": "#dc2626"},
    {"id": "madd", "label_en": "Madd (elongation)", "color": "#d97706"},
]
