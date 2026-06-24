"""Analytics API views with Redis caching (24h TTL — Quran data is static)."""
from __future__ import annotations

import hashlib
from typing import Any, Callable

from django.conf import settings
from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view

from apps.common.envelope import envelope

from . import services


def _cache_key(name: str, **params: Any) -> str:
    raw = name + "|" + "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    return "analytics:" + hashlib.sha1(raw.encode()).hexdigest()


def _cached(name: str, params: dict[str, Any], compute: Callable[[], Any]):
    """Return a cached response, computing + storing on miss with X-Cache header."""
    key = _cache_key(name, **params)
    hit = cache.get(key)
    if hit is not None:
        return envelope(hit, meta={"cache": "HIT"}, headers={"X-Cache": "HIT"})
    data = compute()
    cache.set(key, data, settings.ANALYTICS_CACHE_TTL)
    return envelope(data, meta={"cache": "MISS"}, headers={"X-Cache": "MISS"})


@api_view(["GET"])
def word_frequency_view(request):
    word = request.query_params.get("word")
    root = request.query_params.get("root")
    if not word and not root:
        return envelope(
            errors=[{"message": "Provide 'word' or 'root'."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    return _cached(
        "word-frequency",
        {"word": word or "", "root": root or ""},
        lambda: services.get_word_frequency(word=word, root=root),
    )


@api_view(["GET"])
def root_tree_view(request):
    root = request.query_params.get("root")
    if not root:
        return envelope(
            errors=[{"message": "Query parameter 'root' is required."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    return _cached(
        "root-tree", {"root": root}, lambda: services.get_root_tree(root)
    )


@api_view(["GET"])
def cooccurrence_view(request):
    w1 = request.query_params.get("word1")
    w2 = request.query_params.get("word2")
    if not w1 or not w2:
        return envelope(
            errors=[{"message": "Both 'word1' and 'word2' are required."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    return _cached(
        "cooccurrence",
        {"word1": w1, "word2": w2},
        lambda: services.get_cooccurrence(w1, w2),
    )


@api_view(["GET"])
def surah_stats_view(request, surah_id: int):
    return _cached(
        "surah-stats",
        {"surah_id": surah_id},
        lambda: services.get_surah_stats(surah_id),
    )


@api_view(["GET"])
def rare_words_view(request):
    try:
        threshold = int(request.query_params.get("threshold", 1))
    except ValueError:
        return envelope(
            errors=[{"message": "'threshold' must be an integer."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    return _cached(
        "rare-words",
        {"threshold": threshold},
        lambda: {"words": services.find_rare_words(max_count=threshold)},
    )


@api_view(["GET"])
def verify_claim_view(request):
    word = request.query_params.get("word")
    expected = request.query_params.get("expected")
    if not word or expected is None:
        return envelope(
            errors=[{"message": "'word' and 'expected' are required."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        expected_count = int(expected)
    except ValueError:
        return envelope(
            errors=[{"message": "'expected' must be an integer."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    return _cached(
        "verify-claim",
        {"word": word, "expected": expected_count},
        lambda: services.verify_numeric_claim(word, expected_count),
    )
