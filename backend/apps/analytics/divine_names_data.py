"""Curated reference data for the Asmā' al-Ḥusnā (99 Beautiful Names of Allah).

This is a *reference* dataset presented for study. The canonical enumeration
follows the well-known list transmitted by al-Tirmidhī. For each name we record:

  - ``arabic``         : the name in its traditional written form (display only,
                         rendered exactly — never altered).
  - ``transliteration``: Latin transliteration.
  - ``meaning_en`` / ``meaning_id``: concise glosses (English / Indonesian).
  - ``root``           : the normalized trilateral root, when the name derives
                         from one. Links into the Root Explorer — the most
                         reliable way to see where a name's family of words
                         occurs in the Quran. ``None`` for the proper name اللّٰه
                         and for compound (phrase) names.
  - ``lemma``          : the normalized word-form used to count occurrences via
                         the materialised frequency cache. ``None`` when the
                         name is a phrase, is not attested as a standalone word
                         in the Quran, or where the word-form collides with an
                         unrelated common word (e.g. عَلِيّ vs the preposition
                         عَلَىٰ) so that a raw count would mislead.

INTEGRITY NOTE (surfaced in the UI): a ``lemma`` count is the frequency of the
Arabic *word-form*. For descriptive names that figure can include occurrences
referring to people or things — not only to Allah (e.g. رَحِيم also describes the
Prophet in 9:128; عَزِيز names a man in Sūrat Yūsuf). Quranlytics shows the count,
the per-surah distribution, and the verses themselves, and lets the reader judge
the context. It asserts nothing about what a number "proves".
"""
from __future__ import annotations

from typing import Any

# The supreme name, listed first as an accurate anchor (its word-form count is
# reliable — اللّٰه is a proper name, not a descriptive adjective).
ALLAH: dict[str, Any] = {
    "id": "allah",
    "number": 0,
    "arabic": "اللَّه",
    "transliteration": "Allāh",
    "meaning_en": "The Greatest Name — God, the One worshipped",
    "meaning_id": "Nama Yang Agung — Allah, Tuhan yang disembah",
    "root": "اله",
    "lemma": "الله",
}

# The 99 names (Tirmidhī enumeration). lemma values were verified against the
# ingested morphology; None where not reliably countable as a single word-form.
DIVINE_NAMES: list[dict[str, Any]] = [
    {"id": "ar-rahman", "number": 1, "arabic": "الرَّحْمَٰن", "transliteration": "Ar-Raḥmān", "meaning_en": "The Most Compassionate", "meaning_id": "Yang Maha Pengasih", "root": "رحم", "lemma": "رحمن"},
    {"id": "ar-rahim", "number": 2, "arabic": "الرَّحِيم", "transliteration": "Ar-Raḥīm", "meaning_en": "The Most Merciful", "meaning_id": "Yang Maha Penyayang", "root": "رحم", "lemma": "رحيم"},
    {"id": "al-malik", "number": 3, "arabic": "الْمَلِك", "transliteration": "Al-Malik", "meaning_en": "The King, the Sovereign", "meaning_id": "Yang Maha Merajai", "root": "ملك", "lemma": "ملك"},
    {"id": "al-quddus", "number": 4, "arabic": "الْقُدُّوس", "transliteration": "Al-Quddūs", "meaning_en": "The Most Holy", "meaning_id": "Yang Maha Suci", "root": "قدس", "lemma": "قدوس"},
    {"id": "as-salam", "number": 5, "arabic": "السَّلَام", "transliteration": "As-Salām", "meaning_en": "The Source of Peace", "meaning_id": "Yang Maha Sejahtera", "root": "سلم", "lemma": "سلام"},
    {"id": "al-mumin", "number": 6, "arabic": "الْمُؤْمِن", "transliteration": "Al-Muʾmin", "meaning_en": "The Granter of Security", "meaning_id": "Yang Maha Memberi Keamanan", "root": "امن", "lemma": "مؤمن"},
    {"id": "al-muhaymin", "number": 7, "arabic": "الْمُهَيْمِن", "transliteration": "Al-Muhaymin", "meaning_en": "The Guardian, the Overseer", "meaning_id": "Yang Maha Memelihara", "root": "همن", "lemma": "مهيمن"},
    {"id": "al-aziz", "number": 8, "arabic": "الْعَزِيز", "transliteration": "Al-ʿAzīz", "meaning_en": "The Almighty, the Mighty", "meaning_id": "Yang Maha Perkasa", "root": "عزز", "lemma": "عزيز"},
    {"id": "al-jabbar", "number": 9, "arabic": "الْجَبَّار", "transliteration": "Al-Jabbār", "meaning_en": "The Compeller", "meaning_id": "Yang Maha Kuasa / Memaksa", "root": "جبر", "lemma": "جبار"},
    {"id": "al-mutakabbir", "number": 10, "arabic": "الْمُتَكَبِّر", "transliteration": "Al-Mutakabbir", "meaning_en": "The Supreme in Greatness", "meaning_id": "Yang Maha Megah", "root": "كبر", "lemma": "متكبر"},
    {"id": "al-khaliq", "number": 11, "arabic": "الْخَالِق", "transliteration": "Al-Khāliq", "meaning_en": "The Creator", "meaning_id": "Yang Maha Pencipta", "root": "خلق", "lemma": "خالق"},
    {"id": "al-bari", "number": 12, "arabic": "الْبَارِئ", "transliteration": "Al-Bāriʾ", "meaning_en": "The Originator", "meaning_id": "Yang Maha Mengadakan", "root": "برا", "lemma": "بارئ"},
    {"id": "al-musawwir", "number": 13, "arabic": "الْمُصَوِّر", "transliteration": "Al-Muṣawwir", "meaning_en": "The Fashioner of Forms", "meaning_id": "Yang Maha Membentuk Rupa", "root": "صور", "lemma": "مصور"},
    {"id": "al-ghaffar", "number": 14, "arabic": "الْغَفَّار", "transliteration": "Al-Ghaffār", "meaning_en": "The Ever-Forgiving", "meaning_id": "Yang Maha Pengampun", "root": "غفر", "lemma": "غفار"},
    {"id": "al-qahhar", "number": 15, "arabic": "الْقَهَّار", "transliteration": "Al-Qahhār", "meaning_en": "The All-Subduer", "meaning_id": "Yang Maha Memaksa", "root": "قهر", "lemma": "قهار"},
    {"id": "al-wahhab", "number": 16, "arabic": "الْوَهَّاب", "transliteration": "Al-Wahhāb", "meaning_en": "The Bestower", "meaning_id": "Yang Maha Pemberi Karunia", "root": "وهب", "lemma": "وهاب"},
    {"id": "ar-razzaq", "number": 17, "arabic": "الرَّزَّاق", "transliteration": "Ar-Razzāq", "meaning_en": "The Provider", "meaning_id": "Yang Maha Pemberi Rezeki", "root": "رزق", "lemma": "رزاق"},
    {"id": "al-fattah", "number": 18, "arabic": "الْفَتَّاح", "transliteration": "Al-Fattāḥ", "meaning_en": "The Opener, the Judge", "meaning_id": "Yang Maha Pembuka", "root": "فتح", "lemma": "فتاح"},
    {"id": "al-alim", "number": 19, "arabic": "الْعَلِيم", "transliteration": "Al-ʿAlīm", "meaning_en": "The All-Knowing", "meaning_id": "Yang Maha Mengetahui", "root": "علم", "lemma": "عليم"},
    {"id": "al-qabid", "number": 20, "arabic": "الْقَابِض", "transliteration": "Al-Qābiḍ", "meaning_en": "The Withholder", "meaning_id": "Yang Maha Menyempitkan", "root": "قبض", "lemma": None},
    {"id": "al-basit", "number": 21, "arabic": "الْبَاسِط", "transliteration": "Al-Bāsiṭ", "meaning_en": "The Extender", "meaning_id": "Yang Maha Melapangkan", "root": "بسط", "lemma": "باسط"},
    {"id": "al-khafid", "number": 22, "arabic": "الْخَافِض", "transliteration": "Al-Khāfiḍ", "meaning_en": "The Abaser", "meaning_id": "Yang Maha Merendahkan", "root": "خفض", "lemma": None},
    {"id": "ar-rafi", "number": 23, "arabic": "الرَّافِع", "transliteration": "Ar-Rāfiʿ", "meaning_en": "The Exalter", "meaning_id": "Yang Maha Meninggikan", "root": "رفع", "lemma": None},
    {"id": "al-muizz", "number": 24, "arabic": "الْمُعِزّ", "transliteration": "Al-Muʿizz", "meaning_en": "The Giver of Honour", "meaning_id": "Yang Maha Memuliakan", "root": "عزز", "lemma": None},
    {"id": "al-mudhill", "number": 25, "arabic": "الْمُذِلّ", "transliteration": "Al-Mudhill", "meaning_en": "The Giver of Dishonour", "meaning_id": "Yang Maha Menghinakan", "root": "ذلل", "lemma": None},
    {"id": "as-sami", "number": 26, "arabic": "السَّمِيع", "transliteration": "As-Samīʿ", "meaning_en": "The All-Hearing", "meaning_id": "Yang Maha Mendengar", "root": "سمع", "lemma": "سميع"},
    {"id": "al-basir", "number": 27, "arabic": "الْبَصِير", "transliteration": "Al-Baṣīr", "meaning_en": "The All-Seeing", "meaning_id": "Yang Maha Melihat", "root": "بصر", "lemma": "بصير"},
    {"id": "al-hakam", "number": 28, "arabic": "الْحَكَم", "transliteration": "Al-Ḥakam", "meaning_en": "The Judge", "meaning_id": "Yang Maha Menetapkan Hukum", "root": "حكم", "lemma": "حكم"},
    {"id": "al-adl", "number": 29, "arabic": "الْعَدْل", "transliteration": "Al-ʿAdl", "meaning_en": "The Utterly Just", "meaning_id": "Yang Maha Adil", "root": "عدل", "lemma": "عدل"},
    {"id": "al-latif", "number": 30, "arabic": "اللَّطِيف", "transliteration": "Al-Laṭīf", "meaning_en": "The Subtle, the Gracious", "meaning_id": "Yang Maha Lembut", "root": "لطف", "lemma": "لطيف"},
    {"id": "al-khabir", "number": 31, "arabic": "الْخَبِير", "transliteration": "Al-Khabīr", "meaning_en": "The All-Aware", "meaning_id": "Yang Maha Mengetahui (Teliti)", "root": "خبر", "lemma": "خبير"},
    {"id": "al-halim", "number": 32, "arabic": "الْحَلِيم", "transliteration": "Al-Ḥalīm", "meaning_en": "The Forbearing", "meaning_id": "Yang Maha Penyantun", "root": "حلم", "lemma": "حليم"},
    {"id": "al-azim", "number": 33, "arabic": "الْعَظِيم", "transliteration": "Al-ʿAẓīm", "meaning_en": "The Magnificent", "meaning_id": "Yang Maha Agung", "root": "عظم", "lemma": "عظيم"},
    {"id": "al-ghafur", "number": 34, "arabic": "الْغَفُور", "transliteration": "Al-Ghafūr", "meaning_en": "The All-Forgiving", "meaning_id": "Yang Maha Pengampun", "root": "غفر", "lemma": "غفور"},
    {"id": "ash-shakur", "number": 35, "arabic": "الشَّكُور", "transliteration": "Ash-Shakūr", "meaning_en": "The Most Appreciative", "meaning_id": "Yang Maha Mensyukuri", "root": "شكر", "lemma": "شكور"},
    {"id": "al-aliyy", "number": 36, "arabic": "الْعَلِيّ", "transliteration": "Al-ʿAliyy", "meaning_en": "The Most High", "meaning_id": "Yang Maha Tinggi", "root": "علو", "lemma": None},
    {"id": "al-kabir", "number": 37, "arabic": "الْكَبِير", "transliteration": "Al-Kabīr", "meaning_en": "The Most Great", "meaning_id": "Yang Maha Besar", "root": "كبر", "lemma": "كبير"},
    {"id": "al-hafiz", "number": 38, "arabic": "الْحَفِيظ", "transliteration": "Al-Ḥafīẓ", "meaning_en": "The Preserver", "meaning_id": "Yang Maha Memelihara", "root": "حفظ", "lemma": "حفيظ"},
    {"id": "al-muqit", "number": 39, "arabic": "الْمُقِيت", "transliteration": "Al-Muqīt", "meaning_en": "The Sustainer, the Nourisher", "meaning_id": "Yang Maha Pemberi Kecukupan", "root": "قوت", "lemma": "مقيت"},
    {"id": "al-hasib", "number": 40, "arabic": "الْحَسِيب", "transliteration": "Al-Ḥasīb", "meaning_en": "The Reckoner", "meaning_id": "Yang Maha Penghitung", "root": "حسب", "lemma": "حسيب"},
    {"id": "al-jalil", "number": 41, "arabic": "الْجَلِيل", "transliteration": "Al-Jalīl", "meaning_en": "The Majestic", "meaning_id": "Yang Maha Mulia (Luhur)", "root": "جلل", "lemma": None},
    {"id": "al-karim", "number": 42, "arabic": "الْكَرِيم", "transliteration": "Al-Karīm", "meaning_en": "The Most Generous", "meaning_id": "Yang Maha Pemurah", "root": "كرم", "lemma": "كريم"},
    {"id": "ar-raqib", "number": 43, "arabic": "الرَّقِيب", "transliteration": "Ar-Raqīb", "meaning_en": "The Watchful", "meaning_id": "Yang Maha Mengawasi", "root": "رقب", "lemma": "رقيب"},
    {"id": "al-mujib", "number": 44, "arabic": "الْمُجِيب", "transliteration": "Al-Mujīb", "meaning_en": "The Responsive", "meaning_id": "Yang Maha Mengabulkan", "root": "جوب", "lemma": "مجيب"},
    {"id": "al-wasi", "number": 45, "arabic": "الْوَاسِع", "transliteration": "Al-Wāsiʿ", "meaning_en": "The All-Encompassing", "meaning_id": "Yang Maha Luas", "root": "وسع", "lemma": "واسع"},
    {"id": "al-hakim", "number": 46, "arabic": "الْحَكِيم", "transliteration": "Al-Ḥakīm", "meaning_en": "The All-Wise", "meaning_id": "Yang Maha Bijaksana", "root": "حكم", "lemma": "حكيم"},
    {"id": "al-wadud", "number": 47, "arabic": "الْوَدُود", "transliteration": "Al-Wadūd", "meaning_en": "The Most Loving", "meaning_id": "Yang Maha Mengasihi", "root": "ودد", "lemma": "ودود"},
    {"id": "al-majid", "number": 48, "arabic": "الْمَجِيد", "transliteration": "Al-Majīd", "meaning_en": "The All-Glorious", "meaning_id": "Yang Maha Mulia", "root": "مجد", "lemma": "مجيد"},
    {"id": "al-baith", "number": 49, "arabic": "الْبَاعِث", "transliteration": "Al-Bāʿith", "meaning_en": "The Resurrector", "meaning_id": "Yang Maha Membangkitkan", "root": "بعث", "lemma": None},
    {"id": "ash-shahid", "number": 50, "arabic": "الشَّهِيد", "transliteration": "Ash-Shahīd", "meaning_en": "The Witness", "meaning_id": "Yang Maha Menyaksikan", "root": "شهد", "lemma": "شهيد"},
    {"id": "al-haqq", "number": 51, "arabic": "الْحَقّ", "transliteration": "Al-Ḥaqq", "meaning_en": "The Absolute Truth", "meaning_id": "Yang Maha Benar", "root": "حقق", "lemma": "حق"},
    {"id": "al-wakil", "number": 52, "arabic": "الْوَكِيل", "transliteration": "Al-Wakīl", "meaning_en": "The Trustee, the Disposer", "meaning_id": "Yang Maha Pemelihara (Wakil)", "root": "وكل", "lemma": "وكيل"},
    {"id": "al-qawiyy", "number": 53, "arabic": "الْقَوِيّ", "transliteration": "Al-Qawiyy", "meaning_en": "The Most Strong", "meaning_id": "Yang Maha Kuat", "root": "قوي", "lemma": "قوي"},
    {"id": "al-matin", "number": 54, "arabic": "الْمَتِين", "transliteration": "Al-Matīn", "meaning_en": "The Firm, the Steadfast", "meaning_id": "Yang Maha Kokoh", "root": "متن", "lemma": "متين"},
    {"id": "al-waliyy", "number": 55, "arabic": "الْوَلِيّ", "transliteration": "Al-Waliyy", "meaning_en": "The Protecting Friend", "meaning_id": "Yang Maha Melindungi", "root": "ولي", "lemma": "ولي"},
    {"id": "al-hamid", "number": 56, "arabic": "الْحَمِيد", "transliteration": "Al-Ḥamīd", "meaning_en": "The Praiseworthy", "meaning_id": "Yang Maha Terpuji", "root": "حمد", "lemma": "حميد"},
    {"id": "al-muhsi", "number": 57, "arabic": "الْمُحْصِي", "transliteration": "Al-Muḥṣī", "meaning_en": "The All-Enumerating", "meaning_id": "Yang Maha Menghitung", "root": "حصي", "lemma": None},
    {"id": "al-mubdi", "number": 58, "arabic": "الْمُبْدِئ", "transliteration": "Al-Mubdiʾ", "meaning_en": "The Originator", "meaning_id": "Yang Maha Memulai", "root": "بدا", "lemma": None},
    {"id": "al-muid", "number": 59, "arabic": "الْمُعِيد", "transliteration": "Al-Muʿīd", "meaning_en": "The Restorer", "meaning_id": "Yang Maha Mengembalikan", "root": "عود", "lemma": None},
    {"id": "al-muhyi", "number": 60, "arabic": "الْمُحْيِي", "transliteration": "Al-Muḥyī", "meaning_en": "The Giver of Life", "meaning_id": "Yang Maha Menghidupkan", "root": "حيي", "lemma": None},
    {"id": "al-mumit", "number": 61, "arabic": "الْمُمِيت", "transliteration": "Al-Mumīt", "meaning_en": "The Bringer of Death", "meaning_id": "Yang Maha Mematikan", "root": "موت", "lemma": None},
    {"id": "al-hayy", "number": 62, "arabic": "الْحَيّ", "transliteration": "Al-Ḥayy", "meaning_en": "The Ever-Living", "meaning_id": "Yang Maha Hidup", "root": "حيي", "lemma": "حي"},
    {"id": "al-qayyum", "number": 63, "arabic": "الْقَيُّوم", "transliteration": "Al-Qayyūm", "meaning_en": "The Self-Subsisting Sustainer", "meaning_id": "Yang Maha Berdiri Sendiri", "root": "قوم", "lemma": "قيوم"},
    {"id": "al-wajid", "number": 64, "arabic": "الْوَاجِد", "transliteration": "Al-Wājid", "meaning_en": "The Perceiver, the Finder", "meaning_id": "Yang Maha Menemukan", "root": "وجد", "lemma": None},
    {"id": "al-majid-2", "number": 65, "arabic": "الْمَاجِد", "transliteration": "Al-Mājid", "meaning_en": "The Illustrious", "meaning_id": "Yang Maha Mulia", "root": "مجد", "lemma": None},
    {"id": "al-wahid", "number": 66, "arabic": "الْوَاحِد", "transliteration": "Al-Wāḥid", "meaning_en": "The One", "meaning_id": "Yang Maha Esa", "root": "وحد", "lemma": "واحد"},
    {"id": "al-ahad", "number": 67, "arabic": "الْأَحَد", "transliteration": "Al-Aḥad", "meaning_en": "The Unique, the Indivisible", "meaning_id": "Yang Maha Tunggal", "root": "وحد", "lemma": "احد"},
    {"id": "as-samad", "number": 68, "arabic": "الصَّمَد", "transliteration": "Aṣ-Ṣamad", "meaning_en": "The Eternal Refuge", "meaning_id": "Yang Maha Dibutuhkan (Tempat Bergantung)", "root": "صمد", "lemma": "صمد"},
    {"id": "al-qadir", "number": 69, "arabic": "الْقَادِر", "transliteration": "Al-Qādir", "meaning_en": "The All-Able", "meaning_id": "Yang Maha Kuasa", "root": "قدر", "lemma": "قادر"},
    {"id": "al-muqtadir", "number": 70, "arabic": "الْمُقْتَدِر", "transliteration": "Al-Muqtadir", "meaning_en": "The All-Determining", "meaning_id": "Yang Maha Berkuasa", "root": "قدر", "lemma": "مقتدر"},
    {"id": "al-muqaddim", "number": 71, "arabic": "الْمُقَدِّم", "transliteration": "Al-Muqaddim", "meaning_en": "The Expediter", "meaning_id": "Yang Maha Mendahulukan", "root": "قدم", "lemma": None},
    {"id": "al-muakhkhir", "number": 72, "arabic": "الْمُؤَخِّر", "transliteration": "Al-Muʾakhkhir", "meaning_en": "The Delayer", "meaning_id": "Yang Maha Mengakhirkan", "root": "اخر", "lemma": None},
    {"id": "al-awwal", "number": 73, "arabic": "الْأَوَّل", "transliteration": "Al-Awwal", "meaning_en": "The First", "meaning_id": "Yang Maha Awal", "root": "اول", "lemma": "اول"},
    {"id": "al-akhir", "number": 74, "arabic": "الْآخِر", "transliteration": "Al-Ākhir", "meaning_en": "The Last", "meaning_id": "Yang Maha Akhir", "root": "اخر", "lemma": "اخر"},
    {"id": "az-zahir", "number": 75, "arabic": "الظَّاهِر", "transliteration": "Aẓ-Ẓāhir", "meaning_en": "The Manifest", "meaning_id": "Yang Maha Nyata", "root": "ظهر", "lemma": "ظاهر"},
    {"id": "al-batin", "number": 76, "arabic": "الْبَاطِن", "transliteration": "Al-Bāṭin", "meaning_en": "The Hidden", "meaning_id": "Yang Maha Tersembunyi (Batin)", "root": "بطن", "lemma": "باطن"},
    {"id": "al-wali", "number": 77, "arabic": "الْوَالِي", "transliteration": "Al-Wālī", "meaning_en": "The Governor, the Patron", "meaning_id": "Yang Maha Memerintah", "root": "ولي", "lemma": None},
    {"id": "al-mutaali", "number": 78, "arabic": "الْمُتَعَالِي", "transliteration": "Al-Mutaʿālī", "meaning_en": "The Self-Exalted", "meaning_id": "Yang Maha Tinggi", "root": "علو", "lemma": "متعال"},
    {"id": "al-barr", "number": 79, "arabic": "الْبَرّ", "transliteration": "Al-Barr", "meaning_en": "The Source of Goodness", "meaning_id": "Yang Maha Pemberi Kebaikan", "root": "برر", "lemma": "بر"},
    {"id": "at-tawwab", "number": 80, "arabic": "التَّوَّاب", "transliteration": "At-Tawwāb", "meaning_en": "The Ever-Relenting", "meaning_id": "Yang Maha Penerima Tobat", "root": "توب", "lemma": "تواب"},
    {"id": "al-muntaqim", "number": 81, "arabic": "الْمُنْتَقِم", "transliteration": "Al-Muntaqim", "meaning_en": "The Avenger", "meaning_id": "Yang Maha Penyiksa (Pembalas)", "root": "نقم", "lemma": None},
    {"id": "al-afuww", "number": 82, "arabic": "الْعَفُوّ", "transliteration": "Al-ʿAfuww", "meaning_en": "The Pardoner", "meaning_id": "Yang Maha Pemaaf", "root": "عفو", "lemma": "عفو"},
    {"id": "ar-rauf", "number": 83, "arabic": "الرَّؤُوف", "transliteration": "Ar-Raʾūf", "meaning_en": "The Most Kind", "meaning_id": "Yang Maha Pengasih (Belas Kasih)", "root": "راف", "lemma": "رءوف"},
    {"id": "malik-al-mulk", "number": 84, "arabic": "مَالِكُ الْمُلْك", "transliteration": "Mālik al-Mulk", "meaning_en": "Master of the Kingdom", "meaning_id": "Pemilik Kerajaan / Kekuasaan", "root": None, "lemma": None},
    {"id": "dhul-jalal", "number": 85, "arabic": "ذُو الْجَلَالِ وَالْإِكْرَام", "transliteration": "Dhū al-Jalāl wa-l-Ikrām", "meaning_en": "Lord of Majesty and Honour", "meaning_id": "Pemilik Keagungan dan Kemuliaan", "root": None, "lemma": None},
    {"id": "al-muqsit", "number": 86, "arabic": "الْمُقْسِط", "transliteration": "Al-Muqsiṭ", "meaning_en": "The Equitable", "meaning_id": "Yang Maha Adil", "root": "قسط", "lemma": None},
    {"id": "al-jami", "number": 87, "arabic": "الْجَامِع", "transliteration": "Al-Jāmiʿ", "meaning_en": "The Gatherer", "meaning_id": "Yang Maha Mengumpulkan", "root": "جمع", "lemma": "جامع"},
    {"id": "al-ghaniyy", "number": 88, "arabic": "الْغَنِيّ", "transliteration": "Al-Ghaniyy", "meaning_en": "The Self-Sufficient", "meaning_id": "Yang Maha Kaya", "root": "غني", "lemma": "غني"},
    {"id": "al-mughni", "number": 89, "arabic": "الْمُغْنِي", "transliteration": "Al-Mughnī", "meaning_en": "The Enricher", "meaning_id": "Yang Maha Pemberi Kekayaan", "root": "غني", "lemma": None},
    {"id": "al-mani", "number": 90, "arabic": "الْمَانِع", "transliteration": "Al-Māniʿ", "meaning_en": "The Preventer", "meaning_id": "Yang Maha Mencegah", "root": "منع", "lemma": None},
    {"id": "ad-darr", "number": 91, "arabic": "الضَّارّ", "transliteration": "Aḍ-Ḍārr", "meaning_en": "The Distresser", "meaning_id": "Yang Maha Pemberi Bahaya", "root": "ضرر", "lemma": None},
    {"id": "an-nafi", "number": 92, "arabic": "النَّافِع", "transliteration": "An-Nāfiʿ", "meaning_en": "The Benefactor", "meaning_id": "Yang Maha Pemberi Manfaat", "root": "نفع", "lemma": None},
    {"id": "an-nur", "number": 93, "arabic": "النُّور", "transliteration": "An-Nūr", "meaning_en": "The Light", "meaning_id": "Yang Maha Bercahaya", "root": "نور", "lemma": "نور"},
    {"id": "al-hadi", "number": 94, "arabic": "الْهَادِي", "transliteration": "Al-Hādī", "meaning_en": "The Guide", "meaning_id": "Yang Maha Pemberi Petunjuk", "root": "هدي", "lemma": "هادي"},
    {"id": "al-badi", "number": 95, "arabic": "الْبَدِيع", "transliteration": "Al-Badīʿ", "meaning_en": "The Incomparable Originator", "meaning_id": "Yang Maha Pencipta (Tiada Bandingan)", "root": "بدع", "lemma": "بديع"},
    {"id": "al-baqi", "number": 96, "arabic": "الْبَاقِي", "transliteration": "Al-Bāqī", "meaning_en": "The Everlasting", "meaning_id": "Yang Maha Kekal", "root": "بقي", "lemma": None},
    {"id": "al-warith", "number": 97, "arabic": "الْوَارِث", "transliteration": "Al-Wārith", "meaning_en": "The Inheritor", "meaning_id": "Yang Maha Mewarisi", "root": "ورث", "lemma": "وارث"},
    {"id": "ar-rashid", "number": 98, "arabic": "الرَّشِيد", "transliteration": "Ar-Rashīd", "meaning_en": "The Guide to the Right Path", "meaning_id": "Yang Maha Pandai (Pembimbing)", "root": "رشد", "lemma": "رشيد"},
    {"id": "as-sabur", "number": 99, "arabic": "الصَّبُور", "transliteration": "Aṣ-Ṣabūr", "meaning_en": "The Most Patient", "meaning_id": "Yang Maha Penyabar", "root": "صبر", "lemma": None},
]

# Shown verbatim in the UI so the figures are never read as a "miracle" claim.
METHODOLOGY_NOTE = (
    "Counts are the frequency of the Arabic word-form across the Quran, drawn "
    "from the morphological data. For descriptive names this can include "
    "occurrences that refer to people or things — not only to Allah (for "
    "example رَحِيم also describes the Prophet in 9:128). Some names are phrases "
    "or are expressed through related word-forms rather than a single word; for "
    "those, explore the shared root. Quranlytics shows the data and the verses "
    "and leaves interpretation to you."
)
