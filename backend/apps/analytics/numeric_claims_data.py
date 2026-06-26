"""Curated library of popular numeric/word-count claims about the Quran.

Many widely-shared "numerical miracle" claims (several trace to the discredited
Code-19 tradition) only hold under selective counting; others hold honestly.
This library presents both kinds. For each claim we record the popular figure,
the word-family (``lemma``) we count live against the corpus, a curated scholarly
``verdict``, and a ``note`` that explains how the popular figure was reached.

Counting metric: the live ``count`` shown for each term is the frequency of the
Arabic **word-family** (lemma) across the Quran — the morphologically honest
total (all inflected forms). Popular claims often count only one form (e.g. just
the singular, or only the definite noun); where that matters, the note says so
and gives the form-level figure. Quranlytics shows the live number and the
verses, states a transparent verdict, and leaves the conclusion to the reader.

verdict ∈ {"verified", "disputed", "refuted"}:
  - verified : the claim holds under honest counting.
  - disputed : the popular number is reached only by a specific counting method
               (e.g. singular-only); the word-family total differs.
  - refuted  : the claim does not hold under any straightforward counting.
"""
from __future__ import annotations

from typing import Any

CATEGORIES = ["Numerical", "Linguistic", "Structural", "Thematic"]

CLAIMS: list[dict[str, Any]] = [
    {
        "id": "day-365",
        "category": "Numerical",
        "title": "‘Day’ (yawm) — 365 times?",
        "claim_en": "A widely shared claim holds that the word ‘day’ (يوم) "
        "occurs 365 times, matching the days of a solar year.",
        "claimed_display": "365",
        "terms": [{"label": "يوم — day (word-family)", "lemma": "يوم"}],
        "verdict": "disputed",
        "note_en": "The word-family يوم occurs 475 times in total. The figure "
        "365 is reached by counting only the singular يوم and excluding the dual "
        "(يومين) and plural (أيّام). The singular alone lands near 362–365, so "
        "the match is approximate and depends on excluding the other forms.",
    },
    {
        "id": "months-12",
        "category": "Numerical",
        "title": "‘Month’ (shahr) — 12 times?",
        "claim_en": "The word ‘month’ (شهر) is said to appear 12 times, matching "
        "the twelve months of the year.",
        "claimed_display": "12",
        "terms": [{"label": "شهر — month (word-family)", "lemma": "شهر"}],
        "verdict": "disputed",
        "note_en": "The singular شهر does occur 12 times — a genuine match. But "
        "the full word-family (including the plural أشهر / شهور) occurs 21 times, "
        "so the claim depends on counting the singular form only.",
    },
    {
        "id": "dunya-akhira",
        "category": "Linguistic",
        "title": "‘This world’ vs ‘the Hereafter’ — 115 each?",
        "claim_en": "The words for ‘this world’ (الدنيا) and ‘the Hereafter’ "
        "(الآخرة) are said to each occur 115 times — a perfect balance.",
        "claimed_display": "115 each",
        "terms": [
            {"label": "دنيا — this world", "lemma": "دنيا"},
            {"label": "آخر — hereafter / last (word-family)", "lemma": "اخر"},
        ],
        "verdict": "disputed",
        "note_en": "Counted as nouns, الدنيا and الآخرة each occur about 115 "
        "times — the balance is real at the noun level. But the lemma آخر also "
        "covers the adjective ‘last/other’, so its word-family total (≈240) is "
        "much higher than دنيا (115). The balance holds only when آخر is "
        "restricted to ‘the Hereafter’.",
    },
    {
        "id": "shaytan-88",
        "category": "Thematic",
        "title": "‘Satan’ (Shayṭān) — 88 times?",
        "claim_en": "The word Shayṭān (شيطان) is said to occur 88 times.",
        "claimed_display": "88",
        "terms": [{"label": "شيطان — Satan (word-family)", "lemma": "شيطان"}],
        "verdict": "verified",
        "note_en": "The word-family شيطان occurs 88 times across the Quran — the "
        "claim holds under an honest count.",
    },
    {
        "id": "iblis-11",
        "category": "Thematic",
        "title": "‘Iblīs’ — 11 times?",
        "claim_en": "The proper name Iblīs (إبليس) is said to occur 11 times.",
        "claimed_display": "11",
        "terms": [{"label": "إبليس — Iblīs", "lemma": "ابليس"}],
        "verdict": "verified",
        "note_en": "Iblīs occurs 11 times by name — confirmed against the corpus.",
    },
    {
        "id": "angels-devils-88",
        "category": "Thematic",
        "title": "‘Angels’ vs ‘Devils’ — 88 each?",
        "claim_en": "Angels (ملائكة) and devils (شياطين) are said to each occur "
        "88 times, mirroring one another.",
        "claimed_display": "88 each",
        "terms": [
            {"label": "ملك — angel / king (word-family)", "lemma": "ملك"},
            {"label": "شيطان — devil (word-family)", "lemma": "شيطان"},
        ],
        "verdict": "disputed",
        "note_en": "‘Devils’ (شيطان) does occur 88 times. But ‘angels’ cannot be "
        "isolated this way: the word مَلَك (angel) shares its lemma with مَلِك "
        "(king) and the verb ‘to possess’, so the word-family count (≈152) "
        "conflates all three. The neat 88-to-88 balance relies on hand-picking "
        "only the ‘angel’ occurrences.",
    },
    {
        "id": "life-death-145",
        "category": "Linguistic",
        "title": "‘Life’ vs ‘Death’ — 145 each?",
        "claim_en": "‘Life’ (الحياة) and ‘death’ (الموت) are said to each occur "
        "145 times, in perfect balance.",
        "claimed_display": "145 each",
        "terms": [
            {"label": "حياة — life (word-family)", "lemma": "حياه"},
            {"label": "موت — death (word-family)", "lemma": "موت"},
        ],
        "verdict": "refuted",
        "note_en": "Under straightforward word-family counting the two are not "
        "equal: حياة occurs 76 times and موت 50 times — and neither approaches "
        "145. The 145 figure requires bundling many derived forms and related "
        "phrases on each side until the totals are forced to match.",
    },
    {
        "id": "land-sea-ratio",
        "category": "Structural",
        "title": "‘Land’ vs ‘Sea’ — the 71% water ratio?",
        "claim_en": "‘Land’ (بر) is said to occur 13 times and ‘sea’ (بحر) 32 "
        "times, a ratio said to match the proportion of water on Earth.",
        "claimed_display": "13 land / 32 sea",
        "terms": [
            {"label": "بر — land / dry land (word-family)", "lemma": "بر"},
            {"label": "بحر — sea", "lemma": "بحر"},
        ],
        "verdict": "disputed",
        "note_en": "The word-family بحر (sea) occurs 41 times and بر 30 times — "
        "but بر also means ‘righteousness / dutifulness’ and is a divine name "
        "(al-Barr), so its ‘dry land’ sense is far rarer. The famous 13/32 ratio "
        "depends on counting only specific forms in a specific way; it is not "
        "reproducible from an honest word-family count.",
    },
]

METHODOLOGY_NOTE = (
    "Each claim is checked live against the corpus. The number we count is the "
    "frequency of the Arabic word-family (its dictionary lemma) — the honest "
    "total across all forms. Popular ‘miracle’ figures often count only one form "
    "(just the singular, or only a definite noun); where that matters the note "
    "explains it. We show the data and the verses and let you decide — we make "
    "no claim about what any number proves."
)
