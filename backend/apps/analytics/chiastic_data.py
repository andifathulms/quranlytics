"""Curated chiastic (ring) structure proposals.

Each structure lists ``levels`` in textual order; matching labels (A/A', B/B')
mark the proposed symmetric pairs, with a single central pivot (✦). These are
*scholarly proposals* presented for reflection — the app shows the verses and
the proposed symmetry and asserts nothing about what it proves. Themes are
short interpretive summaries; the authoritative content is the verse text,
which is fetched live and rendered exactly as sourced.
"""
from __future__ import annotations

CHIASTIC_STRUCTURES: list[dict] = [
    {
        "id": "al-fatihah",
        "title": "Al-Fatihah — proposed seven-verse symmetry",
        "surah": 1,
        "attribution": (
            "A symmetry discussed in modern literary analyses of the Quran "
            "(e.g. Raymond Farrin). The pivot falls on the central verse; "
            "the pairings are interpretive."
        ),
        "levels": [
            {"label": "A", "verse_key": "1:1", "theme": "In the name of Allah, the Most Gracious, the Most Merciful"},
            {"label": "B", "verse_key": "1:2", "theme": "All praise is for Allah, Lord of all worlds"},
            {"label": "C", "verse_key": "1:3", "theme": "The Most Gracious, the Most Merciful"},
            {"label": "✦", "verse_key": "1:4", "theme": "Pivot — Master of the Day of Judgment"},
            {"label": "C'", "verse_key": "1:5", "theme": "Worship and reliance belong to Allah alone"},
            {"label": "B'", "verse_key": "1:6", "theme": "Guide us along the Straight Path"},
            {"label": "A'", "verse_key": "1:7", "theme": "The path of those graced by Him"},
        ],
    },
    {
        "id": "al-baqarah-middle",
        "title": "Al-Baqarah — the central 'middle nation' pivot",
        "surah": 2,
        "attribution": (
            "Al-Baqarah's structural centre is often noted at 2:143, which "
            "speaks of a 'justly balanced (middle) nation' — framed here by an "
            "opening and closing passage on faith."
        ),
        "levels": [
            {"label": "A", "verse_key": "2:3", "theme": "The believers: faith in the unseen, prayer, charity"},
            {"label": "✦", "verse_key": "2:143", "theme": "Pivot — 'We made you a justly balanced nation'"},
            {"label": "A'", "verse_key": "2:285", "theme": "The Messenger and believers affirm faith"},
        ],
    },
]
