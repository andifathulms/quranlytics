"""Tests for the tajwīd annotation engine.

The non-negotiable property is integrity: annotation only colours the text, it
never changes a character. We assert that segment-joins equal the input for a
sample of crafted strings (the suite also checks every real verse — see
test_integrity_over_all_verses, which is skipped if no data is loaded).
"""
from __future__ import annotations

import pytest

from apps.quran.tajwid import annotate

pytestmark = pytest.mark.django_db


def _rules(text):
    return [(s["text"], s["rule"]) for s in annotate(text)]


def _joins(text):
    return "".join(s["text"] for s in annotate(text))


class TestIntegrity:
    @pytest.mark.parametrize(
        "text",
        [
            "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
            "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
            "إِذَا جَآءَ نَصْرُ ٱللَّهِ",
            "",
            "   ",
        ],
    )
    def test_join_equals_input(self, text):
        assert _joins(text) == text

    def test_integrity_over_all_verses(self):
        from apps.quran.models import Verse

        verses = list(Verse.objects.values_list("text_uthmani", flat=True))
        if not verses:
            pytest.skip("no verses ingested")
        for t in verses:
            assert _joins(t) == t


class TestRules:
    def test_ghunnah_on_shadda_noon_meem(self):
        # ثُمَّ — meem with shadda → ghunnah.
        assert any(r == "ghunnah" for _, r in _rules("ثُمَّ"))
        # إِنَّ — noon with shadda → ghunnah.
        assert any(r == "ghunnah" for _, r in _rules("إِنَّ"))

    def test_qalqalah_on_sukun(self):
        # قَدْ — dāl with sukūn → qalqalah.
        assert any(r == "qalqalah" for _, r in _rules("قَدْ"))

    def test_qalqalah_at_stop_final_letter(self):
        # أَحَدْ — final qalqala letter (waqf) → qalqalah.
        assert any(r == "qalqalah" for _, r in _rules("أَحَدْ"))

    def test_madd_on_maddah_sign(self):
        # لَآ — alef carrying the maddah sign → madd.
        assert any(r == "madd" for _, r in _rules("لَآ"))

    def test_idhar_noon_sakin_before_throat(self):
        # مَنْ ءَامَنَ — noon-sākin before hamza (throat) → idhār.
        assert any(r == "idhar" for _, r in _rules("مَنْ ءَامَنَ"))

    def test_ikhfa_noon_sakin_before_ikhfa_letter(self):
        # أَنْفُسَ — noon-sākin before fā → ikhfāʾ.
        assert any(r == "ikhfa" for _, r in _rules("أَنْفُسَ"))

    def test_idgham_noon_sakin_before_yarmalun(self):
        # مَنْ يَقُولُ — noon-sākin before yā → idghām.
        assert any(r == "idgham" for _, r in _rules("مَنْ يَقُولُ"))

    def test_tanwin_skips_seat_alef_to_next_consonant(self):
        # كُفُوًا أَحَدٌ — the tanwīn seat-alef is silent; the next consonant is
        # the hamza of أَحَد (throat) → idhār, not ikhfāʾ on the alef.
        assert any(r == "idhar" for _, r in _rules("كُفُوًا أَحَدٌ"))

    def test_iqlab_tanwin_before_beh(self):
        # سَمِيعٌ بَصِيرٌ — dammatan before bā → iqlāb.
        assert any(r == "iqlab" for _, r in _rules("سَمِيعٌ بَصِيرٌ"))
