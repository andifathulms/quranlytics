"""Arabic text utilities.

CRITICAL: these helpers are used ONLY to derive the ``text_clean`` search field
and to normalise user search input. They are NEVER used to mutate displayed
Quranic text. The Uthmani text shown to users is always rendered exactly as
sourced.
"""
from __future__ import annotations

import unicodedata

# Arabic diacritics (tashkeel) and Quranic annotation marks.
_TASHKEEL = (
    "ؘؙؚؐؑؒؓؔؕؖؗ"
    "ًٌٍَُِّْٕٓٔ"
    "ٖٜٟٗ٘ٙٚٛٝٞ"
    "ٰ"  # superscript alef
    "ۖۗۘۙۚۛۜ۟۠ۡۢ"
    "ۣۤۥۦ۪ۭۧۨ۫۬"
    "ـ"  # tatweel
)
_TASHKEEL_TABLE = {ord(c): None for c in _TASHKEEL}

# Hamza forms normalised to bare forms for fuzzy / clean search.
_HAMZA_TABLE = {
    ord("آ"): "ا",  # آ -> ا
    ord("أ"): "ا",  # أ -> ا
    ord("إ"): "ا",  # إ -> ا
    ord("ٱ"): "ا",  # ٱ -> ا
    ord("ى"): "ي",  # ى -> ي
    ord("ة"): "ه",  # ة -> ه
}


def strip_tashkeel(text: str) -> str:
    """Remove diacritics. For deriving ``text_clean`` (search only)."""
    return unicodedata.normalize("NFC", text).translate(_TASHKEEL_TABLE)


def normalize_search(text: str) -> str:
    """Normalise user search input: strip tashkeel + unify hamza/alef forms."""
    return strip_tashkeel(text).translate(_HAMZA_TABLE).strip()


# Per-letter phonetic transliteration for trilateral roots (e.g. كتب -> k-t-b).
# Used only to label roots in the UI; never applied to displayed Quranic text.
_ROOT_TRANSLIT = {
    "ء": "ʾ", "ا": "a", "أ": "ʾ", "إ": "ʾ", "آ": "ʾ", "ب": "b", "ت": "t",
    "ث": "th", "ج": "j", "ح": "ḥ", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r",
    "ز": "z", "س": "s", "ش": "sh", "ص": "ṣ", "ض": "ḍ", "ط": "ṭ", "ظ": "ẓ",
    "ع": "ʿ", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m",
    "ن": "n", "ه": "h", "و": "w", "ي": "y", "ى": "ā",
}


def transliterate_root(root_arabic: str) -> str:
    """Hyphen-joined phonetic transliteration of a root (كتب -> 'k-t-b')."""
    letters = [_ROOT_TRANSLIT.get(ch, ch) for ch in root_arabic if not ch.isspace()]
    return "-".join(letters)
