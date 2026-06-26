"""Analytics engine — frequency, roots, co-occurrence, stats, rare words.

Performance rules (CLAUDE.md):
  - Frequency queries read the materialised WordFrequency table — never COUNT
    the Word table live for user-facing requests.
  - Results are cached in Redis (see views) for 24h.
"""
from __future__ import annotations

from typing import Any

from django.db.models import Count, Q

from apps.common.arabic import normalize_search
from apps.quran.models import (
    Surah,
    SurahStats,
    Verse,
    Word,
    WordFrequency,
    WordRoot,
)


def _surah_name_map() -> dict[int, str]:
    return {
        s.number: s.name_transliteration
        for s in Surah.objects.only("number", "name_transliteration")
    }


def get_word_frequency(word: str | None = None, root: str | None = None) -> dict[str, Any]:
    """Total count + per-surah distribution from the materialised cache.

    If ``root`` is given, matches all words sharing that root. If ``word`` is
    given, matches the lemma exactly.
    """
    if not word and not root:
        raise ValueError("Provide either 'word' or 'root'.")

    names = _surah_name_map()
    freq: WordFrequency | None = None

    if root:
        root_norm = normalize_search(root)
        freq = (
            WordFrequency.objects.select_related("root")
            .filter(root__root_arabic=root_norm)
            .first()
        )
        label = root_norm
    else:
        # Word frequency keys are normalized (see ingest_words); normalize the
        # query the same way so user input matches.
        word_norm = normalize_search(word)
        freq = WordFrequency.objects.filter(
            root__isnull=True, lemma=word_norm
        ).first()
        label = word_norm

    if freq is None:
        return {"query": label, "total": 0, "per_surah": []}

    per_surah = [
        {
            "surah_id": int(num),
            "surah_name": names.get(int(num), ""),
            "count": count,
        }
        for num, count in sorted(
            freq.surah_distribution.items(), key=lambda kv: int(kv[0])
        )
    ]
    return {
        "query": label,
        "total": freq.total_count,
        "per_surah": per_surah,
    }


def get_root_tree(root_arabic: str) -> dict[str, Any]:
    """All words derived from a trilateral root, grouped by lemma."""
    root_norm = normalize_search(root_arabic)
    root_obj = WordRoot.objects.filter(root_arabic=root_norm).first()
    if root_obj is None:
        return {"root": root_norm, "meaning": "", "derivatives": []}

    derivatives: dict[str, dict[str, Any]] = {}
    words = (
        Word.objects.filter(root=root_obj)
        .select_related("verse__surah")
        .order_by("lemma", "verse__surah__number", "verse__number")
    )
    for w in words:
        entry = derivatives.setdefault(
            w.lemma or w.arabic,
            {
                "lemma": w.lemma or w.arabic,
                "forms": set(),
                "total_count": 0,
                "sample_verses": [],
            },
        )
        entry["forms"].add(w.arabic)
        entry["total_count"] += 1
        if len(entry["sample_verses"]) < 5:
            entry["sample_verses"].append(w.verse.key)

    return {
        "root": root_obj.display,  # proper orthography for display
        "root_key": root_obj.root_arabic,  # normalized lookup key
        "root_transliteration": root_obj.root_transliteration,
        "meaning": root_obj.meaning_en,
        "derivatives": [
            {**d, "forms": sorted(d["forms"])}
            for d in sorted(
                derivatives.values(), key=lambda x: -x["total_count"]
            )
        ],
    }


def get_cooccurrence(word1: str, word2: str) -> dict[str, Any]:
    """All verses containing both word1 AND word2 (matched on lemma or surface)."""
    w1, w2 = normalize_search(word1), normalize_search(word2)
    verses = (
        Verse.objects.filter(
            Q(words__lemma=w1) | Q(words__arabic__icontains=word1)
        )
        .filter(Q(words__lemma=w2) | Q(words__arabic__icontains=word2))
        .select_related("surah")
        .prefetch_related("translations")
        .distinct()
        .order_by("surah__number", "number")
    )
    # Local import to avoid a circular import at module load.
    from apps.quran.serializers import VerseSerializer

    serialized = VerseSerializer(verses, many=True).data
    return {
        "word1": word1,
        "word2": word2,
        "count": len(serialized),
        "verses": serialized,
    }


def _normalize_phrase(text: str) -> str:
    """Forgiving normalisation for free-text phrase matching.

    Builds on ``normalize_search`` (tashkeel stripped, alef/hamza-carriers
    unified) and additionally drops the standalone hamza ``ء`` and collapses
    runs of whitespace. Uthmani orthography is rich in standalone hamzas and
    spacing the user won't reproduce (e.g. 55:13 ``...ءَالَآءِ...``), so this
    lets a phrase typed in ordinary spelling still match the sourced text.
    Used for matching only — the exact Uthmani verse is always what's shown.
    """
    return " ".join(normalize_search(text).replace("ء", "").split())


def search_phrase(phrase: str) -> dict[str, Any]:
    """Every verse containing ``phrase`` verbatim (hamza/tashkeel-robust).

    The query and each verse's ``text_clean`` are both run through
    ``_normalize_phrase`` so matching is insensitive to tashkeel, hamza/alef
    orthography, and incidental spacing. The scan is over ~6,236 verses and the
    result is cached (see views), so no index on ``text_clean`` is required.
    """
    needle = _normalize_phrase(phrase)
    if not needle:
        return {"phrase": phrase, "count": 0, "verses": []}

    matches = [
        v
        for v in (
            Verse.objects.select_related("surah")
            .prefetch_related("translations")
            .order_by("surah__number", "number")
        )
        if needle in _normalize_phrase(v.text_clean)
    ]
    from apps.quran.serializers import VerseSerializer

    serialized = VerseSerializer(matches, many=True).data
    return {"phrase": phrase, "count": len(serialized), "verses": serialized}


def get_repeated_verses(min_count: int = 2, limit: int = 100) -> dict[str, Any]:
    """Verses whose text recurs verbatim across the Quran (refrains).

    Groups every verse by its normalized text and surfaces groups appearing at
    least ``min_count`` times — e.g. Surah Ar-Rahman's refrain. Each refrain
    carries its occurrence count, every location (verse key), and one
    representative verse (full Uthmani + translations) for display.
    """
    from collections import defaultdict

    groups: dict[str, list[Verse]] = defaultdict(list)
    for v in (
        Verse.objects.select_related("surah")
        .prefetch_related("translations")
        .order_by("surah__number", "number")
    ):
        key = normalize_search(v.text_clean)
        if key:
            groups[key].append(v)

    from apps.quran.serializers import VerseSerializer

    refrains = []
    for norm, verses in groups.items():
        if len(verses) < min_count:
            continue
        refrains.append(
            {
                "count": len(verses),
                "word_count": len(norm.split()),
                "verse_keys": [v.key for v in verses],
                "verse": VerseSerializer(verses[0]).data,
            }
        )

    # Longer refrains first within the same count — they are the more striking
    # ones; a one-word "verse" repeating is far less notable than a full ayah.
    refrains.sort(key=lambda r: (r["count"], r["word_count"]), reverse=True)
    return {"refrains": refrains[:limit]}


def get_surah_stats(surah_id: int) -> dict[str, Any]:
    """Precomputed stats from the SurahStats materialised table."""
    stats = (
        SurahStats.objects.select_related("surah")
        .filter(surah__number=surah_id)
        .first()
    )
    if stats is None:
        return {"surah_id": surah_id, "available": False}
    return {
        "surah_id": surah_id,
        "surah_name": stats.surah.name_transliteration,
        "available": True,
        "verse_count": stats.verse_count,
        "word_count": stats.word_count,
        "letter_count": stats.letter_count,
        "unique_word_count": stats.unique_word_count,
        "unique_root_count": stats.unique_root_count,
        "computed_at": stats.computed_at.isoformat(),
    }


def get_all_surah_stats() -> list[dict[str, Any]]:
    """All 114 surahs' precomputed stats — for the statistics dashboard."""
    rows = SurahStats.objects.select_related("surah").order_by("surah__number")
    return [
        {
            "surah_id": s.surah.number,
            "surah_name": s.surah.name_transliteration,
            "revelation_type": s.surah.revelation_type,
            "verse_count": s.verse_count,
            "word_count": s.word_count,
            "letter_count": s.letter_count,
            "unique_word_count": s.unique_word_count,
            "unique_root_count": s.unique_root_count,
        }
        for s in rows
    ]


def find_rare_words(max_count: int = 1, limit: int = 300) -> list[dict[str, Any]]:
    """Words (lemmas) appearing <= max_count times in the entire Quran.

    ``max_count=1`` yields hapax legomena. Capped at ``limit`` rows and resolved
    in two queries (one representative verse per lemma).
    """
    rows = list(
        WordFrequency.objects.filter(
            root__isnull=True, total_count__lte=max_count
        )
        .exclude(lemma="")
        .order_by("total_count", "lemma")[:limit]
    )
    lemmas = [r.lemma for r in rows]
    samples: dict[str, str] = {}
    for w in (
        Word.objects.filter(lemma__in=lemmas)
        .select_related("verse__surah")
        .order_by("lemma", "verse__surah__number", "verse__number")
    ):
        samples.setdefault(w.lemma, w.verse.key)
    return [
        {"lemma": r.lemma, "count": r.total_count, "verse_key": samples.get(r.lemma)}
        for r in rows
    ]


def get_verse_lengths(surah_id: int) -> dict[str, Any]:
    """Per-verse word and letter counts for a surah — for rhythm analysis."""
    surah = Surah.objects.filter(number=surah_id).first()
    if surah is None:
        return {"surah_id": surah_id, "available": False}

    verses = surah.verses.annotate(wc=Count("words")).order_by("number")
    items = [
        {
            "number": v.number,
            "verse_key": v.key,
            "word_count": v.wc,
            "letter_count": sum(1 for ch in v.text_clean if not ch.isspace()),
        }
        for v in verses
    ]
    counts = [i["word_count"] for i in items] or [0]
    return {
        "surah_id": surah_id,
        "surah_name": surah.name_transliteration,
        "available": True,
        "verses": items,
        "summary": {
            "max": max(counts),
            "min": min(counts),
            "avg": round(sum(counts) / len(counts), 1),
            "verse_count": len(items),
        },
    }


def _surah_brief(number: int) -> dict[str, Any] | None:
    surah = (
        Surah.objects.select_related("stats")
        .filter(number=number)
        .first()
    )
    if surah is None:
        return None
    from apps.quran.serializers import VerseSerializer

    verses = surah.verses.prefetch_related("translations").order_by("number")
    first, last = verses.first(), verses.last()
    stats = getattr(surah, "stats", None)
    return {
        "surah_id": surah.number,
        "name": surah.name_transliteration,
        "name_arabic": surah.name_arabic,
        "revelation_type": surah.revelation_type,
        "verse_count": surah.verse_count,
        "word_count": stats.word_count if stats else None,
        "letter_count": stats.letter_count if stats else None,
        "first_verse": VerseSerializer(first).data if first else None,
        "last_verse": VerseSerializer(last).data if last else None,
    }


def get_surah_pair(a: int, b: int) -> dict[str, Any]:
    """Side-by-side symmetry comparison of two surahs (e.g. 113 & 114)."""
    A, B = _surah_brief(a), _surah_brief(b)
    if A is None or B is None:
        return {"available": False}
    return {
        "available": True,
        "a": A,
        "b": B,
        "symmetry": {
            "same_verse_count": A["verse_count"] == B["verse_count"],
            "verse_count_diff": abs(A["verse_count"] - B["verse_count"]),
            "word_count_diff": abs((A["word_count"] or 0) - (B["word_count"] or 0)),
        },
    }


def get_chiastic_structures() -> list[dict[str, Any]]:
    """Curated chiastic (ring) structures, enriched with live verse text.

    These are scholarly *proposals* presented for study — Quranlytics surfaces
    the verses and the proposed symmetry; it asserts nothing about what the
    pattern proves.
    """
    from apps.analytics.chiastic_data import CHIASTIC_STRUCTURES

    keys = {
        lvl["verse_key"]
        for s in CHIASTIC_STRUCTURES
        for lvl in s["levels"]
    }
    lookup: dict[str, Verse] = {}
    for key in keys:
        s_no, v_no = key.split(":")
        verse = (
            Verse.objects.filter(surah__number=int(s_no), number=int(v_no))
            .prefetch_related("translations")
            .first()
        )
        if verse:
            lookup[key] = verse

    def enrich(level: dict[str, Any]) -> dict[str, Any]:
        verse = lookup.get(level["verse_key"])
        en = (
            next((t.text for t in verse.translations.all() if t.language == "en"), "")
            if verse
            else ""
        )
        return {
            **level,
            "text_uthmani": verse.text_uthmani if verse else "",
            "translation_en": en,
        }

    return [
        {**s, "levels": [enrich(lvl) for lvl in s["levels"]]}
        for s in CHIASTIC_STRUCTURES
    ]


def _norm_prophet(text: str) -> str:
    """Normalisation for prophet-name matching: like phrase search, drop ء."""
    return normalize_search(text).replace("ء", "")


def _prophet_match_set(cores: list[str]) -> set[str]:
    """Expand name cores with attachable proclitics + accusative tanwīn.

    Arabic clitics (و ف ب ل ك, the vocative يا/يـ) attach to a name with no
    space, so we match the bare form and each prefixed variant rather than try
    to strip ambiguous leading letters.
    """
    from apps.analytics.prophets_data import NAME_PROCLITICS, NAME_SUFFIXES

    return {
        pre + _norm_prophet(core) + suf
        for core in cores
        for pre in NAME_PROCLITICS
        for suf in NAME_SUFFIXES
    }


def _verse_keys_naming_prophets() -> dict[str, list[str]]:
    """One scan of the corpus → ``{prophet_id: [verse_key, ...]}`` for DIRECT
    mentions. ``cores`` prophets are matched from the text; ``verse_keys``
    prophets use their curated list; ``phrase`` prophets reuse phrase search.
    """
    from apps.analytics.prophets_data import PROPHETS

    core_sets = {
        p["id"]: _prophet_match_set(p["cores"])
        for p in PROPHETS
        if p.get("cores")
    }
    keys: dict[str, list[str]] = {p["id"]: [] for p in PROPHETS}

    if core_sets:
        for v in Verse.objects.select_related("surah").only(
            "number", "text_clean", "surah__number"
        ):
            tokens = set(_norm_prophet(v.text_clean).split())
            for pid, match in core_sets.items():
                if match & tokens:
                    keys[pid].append(v.key)

    for p in PROPHETS:
        if p.get("verse_keys"):
            keys[p["id"]] = list(p["verse_keys"])
        elif p.get("phrase"):
            keys[p["id"]] = [
                v["verse_key"] for v in search_phrase(p["phrase"])["verses"]
            ]
    return keys


def get_prophets() -> dict[str, Any]:
    """The 25 prophets with a count of verses that name each one directly."""
    from apps.analytics.prophets_data import METHODOLOGY_NOTE, PROPHETS

    keys = _verse_keys_naming_prophets()
    prophets = [
        {
            "id": p["id"],
            "order": p["order"],
            "arabic": p["arabic"],
            "transliteration": p["transliteration"],
            "name_en": p["name_en"],
            "name_id": p["name_id"],
            "blurb_en": p["blurb_en"],
            "direct_count": len(keys.get(p["id"], [])),
            "epithet_count": len(p.get("epithets", [])),
        }
        for p in sorted(PROPHETS, key=lambda x: x["order"])
    ]
    return {"prophets": prophets, "methodology": METHODOLOGY_NOTE}


def _verses_for_keys(verse_keys: list[str], limit: int) -> dict[str, Any]:
    """Serialize verses for a list of ``surah:ayah`` keys, with per-surah tally."""
    pairs = [k.split(":") for k in verse_keys]
    q = Q()
    for s_no, v_no in pairs:
        q |= Q(surah__number=int(s_no), number=int(v_no))
    verses = (
        Verse.objects.filter(q)
        .select_related("surah")
        .prefetch_related("translations")
        .order_by("surah__number", "number")
        if pairs
        else Verse.objects.none()
    )
    names = _surah_name_map()
    per_surah: dict[int, int] = {}
    for k in verse_keys:
        s = int(k.split(":")[0])
        per_surah[s] = per_surah.get(s, 0) + 1
    from apps.quran.serializers import VerseSerializer

    return {
        "total": len(verse_keys),
        "verses": VerseSerializer(verses[:limit], many=True).data,
        "per_surah": [
            {"surah_id": s, "surah_name": names.get(s, ""), "count": c}
            for s, c in sorted(per_surah.items())
        ],
    }


def get_prophet(prophet_id: str, verse_limit: int = 60) -> dict[str, Any]:
    """Detail for one prophet: DIRECT verses (named) + INDIRECT (epithets)."""
    from apps.analytics.prophets_data import METHODOLOGY_NOTE, PROPHETS

    entry = next((p for p in PROPHETS if p["id"] == prophet_id), None)
    if entry is None:
        return {"available": False}

    direct_keys = _verse_keys_naming_prophets().get(prophet_id, [])
    direct = _verses_for_keys(direct_keys, verse_limit)

    references = []
    for ep in entry.get("epithets", []):
        res = search_phrase(ep["phrase"])
        references.append(
            {
                "label_en": ep["label_en"],
                "arabic": ep["arabic"],
                "count": res["count"],
                "verses": res["verses"][:verse_limit],
            }
        )

    return {
        "available": True,
        "id": entry["id"],
        "order": entry["order"],
        "arabic": entry["arabic"],
        "transliteration": entry["transliteration"],
        "name_en": entry["name_en"],
        "name_id": entry["name_id"],
        "blurb_en": entry["blurb_en"],
        "methodology": METHODOLOGY_NOTE,
        "direct_total": direct["total"],
        "direct_per_surah": direct["per_surah"],
        "direct_verses": direct["verses"],
        "references": references,
    }


def get_divine_names() -> dict[str, Any]:
    """The Asmā' al-Ḥusnā (99 names) with word-form occurrence counts.

    Counts come from the materialised frequency cache (one batched query). A
    ``count`` of ``None`` means the name is a phrase or is not reliably countable
    as a single word-form — the root link is then the way to explore it. See
    ``divine_names_data.METHODOLOGY_NOTE`` for how the figures should be read.
    """
    from apps.analytics.divine_names_data import (
        ALLAH,
        DIVINE_NAMES,
        METHODOLOGY_NOTE,
    )

    entries = [ALLAH, *DIVINE_NAMES]
    lemmas = {
        normalize_search(n["lemma"]) for n in entries if n["lemma"]
    }
    totals = dict(
        WordFrequency.objects.filter(
            root__isnull=True, lemma__in=lemmas
        ).values_list("lemma", "total_count")
    )

    names = [
        {
            "id": n["id"],
            "number": n["number"],
            "arabic": n["arabic"],
            "transliteration": n["transliteration"],
            "meaning_en": n["meaning_en"],
            "meaning_id": n["meaning_id"],
            "root": n["root"],
            "count": totals.get(normalize_search(n["lemma"])) if n["lemma"] else None,
        }
        for n in entries
    ]
    return {"names": names, "methodology": METHODOLOGY_NOTE}


def get_divine_name(name_id: str, verse_limit: int = 50) -> dict[str, Any]:
    """Detail for one divine name: per-surah distribution + sample verses.

    The per-surah distribution and total come from the frequency cache; the
    verses are the actual ``text_uthmani`` ayāt where the word-form occurs
    (capped at ``verse_limit``, with the true total reported separately).
    """
    from apps.analytics.divine_names_data import (
        ALLAH,
        DIVINE_NAMES,
        METHODOLOGY_NOTE,
    )

    entry = next(
        (n for n in [ALLAH, *DIVINE_NAMES] if n["id"] == name_id), None
    )
    if entry is None:
        return {"available": False}

    result: dict[str, Any] = {
        "available": True,
        "id": entry["id"],
        "number": entry["number"],
        "arabic": entry["arabic"],
        "transliteration": entry["transliteration"],
        "meaning_en": entry["meaning_en"],
        "meaning_id": entry["meaning_id"],
        "root": entry["root"],
        "lemma": entry["lemma"],
        "methodology": METHODOLOGY_NOTE,
        "total": None,
        "per_surah": [],
        "verse_total": 0,
        "verses": [],
    }

    if not entry["lemma"]:
        return result  # phrase / not a single countable word-form

    needle = normalize_search(entry["lemma"])
    freq = WordFrequency.objects.filter(
        root__isnull=True, lemma=needle
    ).first()
    if freq is not None:
        names = _surah_name_map()
        result["total"] = freq.total_count
        result["per_surah"] = [
            {
                "surah_id": int(num),
                "surah_name": names.get(int(num), ""),
                "count": count,
            }
            for num, count in sorted(
                freq.surah_distribution.items(), key=lambda kv: int(kv[0])
            )
        ]

    verses = (
        Verse.objects.filter(words__lemma=needle)
        .select_related("surah")
        .prefetch_related("translations")
        .distinct()
        .order_by("surah__number", "number")
    )
    result["verse_total"] = verses.count()
    from apps.quran.serializers import VerseSerializer

    result["verses"] = VerseSerializer(verses[:verse_limit], many=True).data
    return result


def verify_numeric_claim(word: str, expected_count: int) -> dict[str, Any]:
    """Verify a popular numeric claim (e.g. 'يوم appears 365 times').

    Counts surface-form occurrences of the word across the Quran and reports
    whether it matches the claimed figure, with sample verses.
    """
    needle = normalize_search(word)
    matches = (
        Word.objects.filter(
            Q(lemma=needle) | Q(arabic__icontains=word)
        )
        .select_related("verse__surah")
        .order_by("verse__surah__number", "verse__number")
    )
    actual = matches.count()
    verses = list(
        dict.fromkeys(m.verse.key for m in matches[:50])
    )  # de-dup, cap at 50
    return {
        "word": word,
        "claimed": expected_count,
        "actual": actual,
        "verified": actual == expected_count,
        "verses": verses,
    }
