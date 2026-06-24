"""Tests for the Arabic text utilities and response envelope."""
from __future__ import annotations

from apps.common.arabic import (
    normalize_search,
    strip_tashkeel,
    transliterate_root,
)


class TestStripTashkeel:
    def test_removes_diacritics(self):
        # Uthmani form -> bare letters, exactly the text_clean derivation.
        assert strip_tashkeel("ٱلْحَمْدُ") == "ٱلحمد"

    def test_idempotent_on_clean_text(self):
        clean = "الحمد لله"
        assert strip_tashkeel(clean) == clean

    def test_preserves_word_boundaries(self):
        assert strip_tashkeel("رَبِّ ٱلْعَٰلَمِينَ").count(" ") == 1


class TestNormalizeSearch:
    def test_unifies_alef_forms(self):
        # All hamza/alef variants collapse to bare alef for fuzzy search.
        assert normalize_search("أحمد") == normalize_search("احمد")
        assert normalize_search("إيمان").startswith("ا")

    def test_strips_and_trims(self):
        # Dagger (superscript) alef is a diacritic and is stripped along with
        # the rest of the tashkeel; alef-wasla is normalized to bare alef.
        assert normalize_search("  ٱلْكِتَٰب  ") == "الكتب"

    def test_taa_marbuta_to_haa(self):
        assert normalize_search("رحمة") == "رحمه"


class TestTransliterateRoot:
    def test_trilateral_root_hyphenated(self):
        assert transliterate_root("كتب") == "k-t-b"

    def test_handles_emphatic_and_special_letters(self):
        assert transliterate_root("رحم") == "r-ḥ-m"
        assert transliterate_root("صبر") == "ṣ-b-r"
