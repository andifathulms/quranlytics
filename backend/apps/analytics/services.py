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
        "root": root_obj.root_arabic,
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


def find_rare_words(max_count: int = 1) -> list[dict[str, Any]]:
    """Words (lemmas) appearing <= max_count times in the entire Quran."""
    rows = (
        WordFrequency.objects.filter(
            root__isnull=True, total_count__lte=max_count
        )
        .exclude(lemma="")
        .order_by("total_count", "lemma")
    )
    results = []
    for r in rows:
        sample = (
            Word.objects.filter(lemma=r.lemma)
            .select_related("verse__surah")
            .first()
        )
        results.append(
            {
                "lemma": r.lemma,
                "count": r.total_count,
                "verse_key": sample.verse.key if sample else None,
            }
        )
    return results


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
