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
