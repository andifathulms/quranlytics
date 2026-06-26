"""Curated reference data for the 25 prophets named in the Quran.

For each prophet we record display metadata plus how to locate the verses that
mention him. Two layers are surfaced in the UI:

  - DIRECT  — verses that name the prophet. Most are matched automatically from
    the text via ``cores`` (the normalized name-forms as they occur, allowing
    for the attached conjunction/preposition proclitics و ف ب ل ك and the
    vocative يا). A few names collide with a common word and so are pinned to a
    curated, scholar-verified ``verse_keys`` list instead (e.g. صالح also means
    "righteous"; هود in the accusative هودًا also means "Jews"; يحيى collides
    with the verb yuḥyī "gives life"). Dhū al-Kifl is a compound name matched by
    ``phrase``.
  - INDIRECT / OTHER REFERENCES — ``epithets``: titles and by-names the Quran
    uses for the prophet without his personal name (e.g. al-Masīḥ and Ibn Maryam
    for ʿĪsā, Dhū al-Nūn for Yūnus, Aḥmad for Muḥammad). Each is matched as an
    exact phrase in the text.

Matching is over the search-only ``text_clean`` field; the verses shown to the
reader are always the exact ``text_uthmani``. Quranlytics surfaces the verses
and leaves interpretation to the reader.
"""
from __future__ import annotations

from typing import Any

# Proclitics that attach to a name in Arabic script (conjunctions, prepositions,
# and the attached vocative), and the accusative tanwīn residue ``ا``.
NAME_PROCLITICS = [
    "", "و", "ف", "ب", "ل", "ك", "وب", "فب",
    "ولل", "فلل", "بال", "وال", "فال", "كال", "لل", "يا", "ويا", "فيا", "ي",
]
NAME_SUFFIXES = ["", "ا"]

PROPHETS: list[dict[str, Any]] = [
    {"id": "adam", "order": 1, "arabic": "آدَم", "transliteration": "Ādam", "name_en": "Adam", "name_id": "Adam", "blurb_en": "The first human and prophet.", "cores": ["ادم"]},
    {"id": "idris", "order": 2, "arabic": "إِدْرِيس", "transliteration": "Idrīs", "name_en": "Idris (Enoch)", "name_id": "Idris", "blurb_en": "Raised to a high station; associated with knowledge.", "cores": ["ادريس"]},
    {"id": "nuh", "order": 3, "arabic": "نُوح", "transliteration": "Nūḥ", "name_en": "Noah", "name_id": "Nuh", "blurb_en": "Built the ark; preached for centuries before the flood.", "cores": ["نوح"]},
    {"id": "hud", "order": 4, "arabic": "هُود", "transliteration": "Hūd", "name_en": "Hud", "name_id": "Hud", "blurb_en": "Sent to the people of ʿĀd.", "verse_keys": ["7:65", "11:50", "11:53", "11:58", "11:60", "11:89", "26:124"]},
    {"id": "salih", "order": 5, "arabic": "صَالِح", "transliteration": "Ṣāliḥ", "name_en": "Salih", "name_id": "Saleh", "blurb_en": "Sent to Thamūd; the she-camel was his sign.", "verse_keys": ["7:73", "7:75", "7:77", "11:61", "11:62", "11:66", "11:89", "26:142", "27:45"]},
    {"id": "ibrahim", "order": 6, "arabic": "إِبْرَاهِيم", "transliteration": "Ibrāhīm", "name_en": "Abraham", "name_id": "Ibrahim", "blurb_en": "The friend of God (Khalīl Allāh); father of prophets.", "cores": ["ابرهيم", "ابراهيم", "ابرهم"]},
    {"id": "lut", "order": 7, "arabic": "لُوط", "transliteration": "Lūṭ", "name_en": "Lot", "name_id": "Lut", "blurb_en": "Nephew of Ibrāhīm; sent to his people.", "cores": ["لوط"]},
    {"id": "ismail", "order": 8, "arabic": "إِسْمَاعِيل", "transliteration": "Ismāʿīl", "name_en": "Ishmael", "name_id": "Ismail", "blurb_en": "Son of Ibrāhīm; helped raise the Kaʿba.", "cores": ["اسمعيل", "اسماعيل"]},
    {"id": "ishaq", "order": 9, "arabic": "إِسْحَاق", "transliteration": "Isḥāq", "name_en": "Isaac", "name_id": "Ishaq", "blurb_en": "Son of Ibrāhīm; father of Yaʿqūb.", "cores": ["اسحق", "اسحاق"]},
    {"id": "yaqub", "order": 10, "arabic": "يَعْقُوب", "transliteration": "Yaʿqūb", "name_en": "Jacob", "name_id": "Yaqub", "blurb_en": "Also called Isrāʾīl; father of the twelve tribes.", "cores": ["يعقوب"]},
    {"id": "yusuf", "order": 11, "arabic": "يُوسُف", "transliteration": "Yūsuf", "name_en": "Joseph", "name_id": "Yusuf", "blurb_en": "His story fills Sūrat Yūsuf.", "cores": ["يوسف"]},
    {"id": "ayyub", "order": 12, "arabic": "أَيُّوب", "transliteration": "Ayyūb", "name_en": "Job", "name_id": "Ayyub", "blurb_en": "A model of patience through affliction.", "cores": ["ايوب"]},
    {"id": "shuayb", "order": 13, "arabic": "شُعَيْب", "transliteration": "Shuʿayb", "name_en": "Shuayb", "name_id": "Syuaib", "blurb_en": "Sent to Madyan; warned against fraud in trade.", "cores": ["شعيب"]},
    {"id": "musa", "order": 14, "arabic": "مُوسَىٰ", "transliteration": "Mūsā", "name_en": "Moses", "name_id": "Musa", "blurb_en": "Spoke with God (Kalīm Allāh); confronted Pharaoh.", "cores": ["موسي"]},
    {"id": "harun", "order": 15, "arabic": "هَارُون", "transliteration": "Hārūn", "name_en": "Aaron", "name_id": "Harun", "blurb_en": "Brother of Mūsā and his helper.", "cores": ["هرون"]},
    {"id": "dhulkifl", "order": 16, "arabic": "ذُو الْكِفْل", "transliteration": "Dhū al-Kifl", "name_en": "Dhul-Kifl", "name_id": "Zulkifli", "blurb_en": "Counted among the patient and the righteous.", "phrase": "ذا الكفل"},
    {"id": "dawud", "order": 17, "arabic": "دَاوُود", "transliteration": "Dāwūd", "name_en": "David", "name_id": "Dawud", "blurb_en": "Given the Zabūr (Psalms); the mountains glorified with him.", "cores": ["داود", "داوود"]},
    {"id": "sulayman", "order": 18, "arabic": "سُلَيْمَان", "transliteration": "Sulaymān", "name_en": "Solomon", "name_id": "Sulaiman", "blurb_en": "Understood the speech of birds; commanded the wind.", "cores": ["سليمن", "سليمان"]},
    {"id": "ilyas", "order": 19, "arabic": "إِلْيَاس", "transliteration": "Ilyās", "name_en": "Elijah", "name_id": "Ilyas", "blurb_en": "Called his people away from worshipping Baʿl.", "cores": ["الياس"]},
    {"id": "alyasa", "order": 20, "arabic": "الْيَسَع", "transliteration": "Al-Yasaʿ", "name_en": "Elisha", "name_id": "Ilyasa", "blurb_en": "Among the outstanding ones (al-akhyār).", "cores": ["اليسع"]},
    {"id": "yunus", "order": 21, "arabic": "يُونُس", "transliteration": "Yūnus", "name_en": "Jonah", "name_id": "Yunus", "blurb_en": "Swallowed by the fish; his people believed and were spared.", "cores": ["يونس"], "epithets": [
        {"label_en": "Dhū al-Nūn — the one of the fish", "arabic": "ذُو النُّون", "phrase": "ذا النون"},
        {"label_en": "Ṣāḥib al-Ḥūt — companion of the fish", "arabic": "صَاحِب الْحُوت", "phrase": "صاحب الحوت"},
    ]},
    {"id": "zakariya", "order": 22, "arabic": "زَكَرِيَّا", "transliteration": "Zakariyyā", "name_en": "Zechariah", "name_id": "Zakaria", "blurb_en": "Guardian of Maryam; father of Yaḥyā.", "cores": ["زكريا"]},
    {"id": "yahya", "order": 23, "arabic": "يَحْيَىٰ", "transliteration": "Yaḥyā", "name_en": "John", "name_id": "Yahya", "blurb_en": "Given wisdom as a child; confirmed ʿĪsā.", "verse_keys": ["3:39", "6:85", "19:7", "19:12", "21:90"]},
    {"id": "isa", "order": 24, "arabic": "عِيسَىٰ", "transliteration": "ʿĪsā", "name_en": "Jesus", "name_id": "Isa", "blurb_en": "Son of Maryam; the Messiah; given the Injīl.", "cores": ["عيسي"], "epithets": [
        {"label_en": "Al-Masīḥ — the Messiah", "arabic": "الْمَسِيح", "phrase": "المسيح"},
        {"label_en": "Ibn Maryam — son of Mary", "arabic": "ابْن مَرْيَم", "phrase": "ابن مريم"},
    ]},
    {"id": "muhammad", "order": 25, "arabic": "مُحَمَّد", "transliteration": "Muḥammad", "name_en": "Muhammad", "name_id": "Muhammad", "blurb_en": "The final prophet; the seal of the prophets.", "cores": ["محمد"], "epithets": [
        {"label_en": "Aḥmad — most praised", "arabic": "أَحْمَد", "phrase": "احمد"},
    ]},
]

# Methodology note shown verbatim in the UI.
METHODOLOGY_NOTE = (
    "“Direct” verses are those that mention the prophet by name; most are matched "
    "automatically from the text, while a few names that collide with common "
    "words (e.g. صالح “righteous”, هود, يحيى) are pinned to a scholar-verified "
    "list of verses. “Other references” are titles and by-names the Quran uses "
    "for a prophet without his personal name. Counts are of verses, and a verse "
    "may name more than one prophet. Quranlytics shows the verses and leaves "
    "interpretation to you."
)
