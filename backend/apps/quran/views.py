"""Quran reader API views: surahs, verses, words, search, tafsir."""
from __future__ import annotations

import re

import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models import Prefetch, Q
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.generics import ListAPIView, RetrieveAPIView

from apps.common.throttles import ProxyRateThrottle

from apps.common.arabic import normalize_search
from apps.common.envelope import envelope
from apps.common.pagination import EnvelopePageNumberPagination

from .models import Surah, TafsirEntry, Translation, Verse, Word
from .serializers import (
    SurahDetailSerializer,
    SurahSerializer,
    VerseDetailSerializer,
    VerseSerializer,
    WordSerializer,
)


class SurahListView(ListAPIView):
    """GET /surahs/ — list all 114 surahs (optionally by revelation order)."""

    serializer_class = SurahSerializer
    pagination_class = None  # only 114 — return them all

    def get_queryset(self):
        qs = Surah.objects.all()
        order = self.request.query_params.get("order")
        if order == "revelation":
            return qs.order_by("revelation_order")
        return qs.order_by("number")

    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        return envelope(data, meta={"count": len(data)})


class SurahDetailView(RetrieveAPIView):
    """GET /surahs/{number}/ — a single surah with stats."""

    serializer_class = SurahDetailSerializer
    lookup_field = "number"

    def get_queryset(self):
        return Surah.objects.select_related("stats")

    def retrieve(self, request, *args, **kwargs):
        return envelope(self.get_serializer(self.get_object()).data)


class SurahVersesView(ListAPIView):
    """GET /surahs/{number}/verses/ — all verses of a surah with translations.

    A surah is bounded (the longest, Al-Baqarah, has 286 verses), so we return
    them all in one response — consistent with the juzʾ and page readers. This
    is required for continuous recitation, reading mode, ḥifẓ looping, and
    jump-to-verse, all of which need the whole surah present in the DOM.
    """

    serializer_class = VerseSerializer
    pagination_class = None

    def get_queryset(self):
        number = self.kwargs["number"]
        order = self.request.query_params.get("order")
        ordering = (
            ["revelation_order"]
            if order == "revelation"
            else ["surah__number", "number"]
        )
        return (
            Verse.objects.filter(surah__number=number)
            .select_related("surah")
            .prefetch_related(
                Prefetch("translations", queryset=Translation.objects.all())
            )
            .order_by(*ordering)
        )

    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        return envelope(data, meta={"count": len(data)})


class JuzVersesView(ListAPIView):
    """GET /juz/{n}/verses/ — all verses of a juzʾ (1–30), across surahs."""

    serializer_class = VerseSerializer
    pagination_class = None  # a juzʾ is bounded; return them all

    def get_queryset(self):
        return (
            Verse.objects.filter(juz_number=self.kwargs["number"])
            .select_related("surah")
            .prefetch_related(
                Prefetch("translations", queryset=Translation.objects.all())
            )
            .order_by("surah__number", "number")
        )

    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        return envelope(data, meta={"count": len(data)})


class PageVersesView(ListAPIView):
    """GET /page/{n}/verses/ — all verses on a mushaf page (1–604)."""

    serializer_class = VerseSerializer
    pagination_class = None  # a page holds only a handful of verses

    def get_queryset(self):
        return (
            Verse.objects.filter(page_number=self.kwargs["number"])
            .select_related("surah")
            .prefetch_related(
                Prefetch("translations", queryset=Translation.objects.all())
            )
            .order_by("surah__number", "number")
        )

    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        return envelope(data, meta={"count": len(data)})


class VerseWordsView(ListAPIView):
    """GET /verses/{id}/words/ — word-level morphology breakdown."""

    serializer_class = WordSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Word.objects.filter(verse_id=self.kwargs["pk"])
            .select_related("root")
            .prefetch_related("segments")
            .order_by("position")
        )

    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        return envelope(data, meta={"count": len(data)})


class VerseDetailView(RetrieveAPIView):
    """GET /verses/{id}/ — a verse with translations and words."""

    serializer_class = VerseDetailSerializer

    def get_queryset(self):
        return Verse.objects.select_related("surah").prefetch_related(
            "translations", "words__root", "words__segments"
        )

    def retrieve(self, request, *args, **kwargs):
        return envelope(self.get_serializer(self.get_object()).data)


@api_view(["GET"])
def search_view(request):
    """GET /search/?q=&lang=ar|en|id — full-text search across verses.

    - lang=ar: search the tashkeel-stripped Arabic (text_clean)
    - lang=en|id: search translations in that language
    """
    query = (request.query_params.get("q") or "").strip()
    lang = request.query_params.get("lang", "ar")
    if not query:
        return envelope(
            errors=[{"message": "Query parameter 'q' is required."}],
            status=status.HTTP_400_BAD_REQUEST,
        )

    if lang == "ar":
        needle = normalize_search(query)
        verses = (
            Verse.objects.filter(text_clean__icontains=needle)
            .select_related("surah")
            .prefetch_related("translations")
            .order_by("surah__number", "number")
        )
    else:
        verses = (
            Verse.objects.filter(
                translations__language=lang,
                translations__text__icontains=query,
            )
            .select_related("surah")
            .prefetch_related("translations")
            .distinct()
            .order_by("surah__number", "number")
        )

    paginator = EnvelopePageNumberPagination()
    page = paginator.paginate_queryset(verses, request)
    data = VerseSerializer(page, many=True).data
    return paginator.get_paginated_response(data)


_VERSE_KEY_RE = re.compile(r"^\d{1,3}:\d{1,3}$")


_UNAVAILABLE = "Tafsir source is unavailable right now."


def _tafsir_en(key: str) -> dict:
    """Ibn Kathir (EN) from quran.com (per-verse). Caching is handled by view."""
    resp = requests.get(
        f"{settings.QURAN_API_BASE}/tafsirs/{settings.TAFSIR_IDS['en']}/by_ayah/{key}",
        timeout=20,
    )
    resp.raise_for_status()
    tafsir = resp.json().get("tafsir", {})
    return {
        "verse_key": key,
        "language": "en",
        "resource_name": tafsir.get("resource_name", "Ibn Kathir"),
        "text": tafsir.get("text", ""),
    }


def _tafsir_id(key: str) -> dict:
    """Kemenag (ID) from equran.id — fetched per surah, cached, then sliced."""
    surah, ayah = (int(p) for p in key.split(":"))
    surah_cache = f"tafsir:id:surah:{surah}"
    by_ayah = cache.get(surah_cache)
    if by_ayah is None:
        resp = requests.get(
            f"{settings.EQURAN_API_BASE}/tafsir/{surah}", timeout=25
        )
        resp.raise_for_status()
        entries = resp.json().get("data", {}).get("tafsir", [])
        by_ayah = {str(e["ayat"]): e["teks"] for e in entries}
        cache.set(surah_cache, by_ayah, settings.ANALYTICS_CACHE_TTL)
    return {
        "verse_key": key,
        "language": "id",
        "resource_name": "Tafsir Kemenag RI",
        "text": by_ayah.get(str(ayah), ""),
    }


@api_view(["GET"])
@throttle_classes([ProxyRateThrottle])
def tafsir_view(request):
    """GET /tafsir/?key=1:1&lang=en|id — tafsir for a verse.

    EN: Ibn Kathir via quran.com. ID: Kemenag via equran.id. Tafsir is static,
    so the first fetch is persisted in the DB (TafsirEntry) and every later
    request is served from there — the upstream API is hit at most once per
    verse+language, ever.
    """
    key = (request.query_params.get("key") or "").strip()
    lang = request.query_params.get("lang", "en")
    if not _VERSE_KEY_RE.match(key):
        return envelope(
            errors=[{"message": "Provide a valid verse 'key' like 1:1."}],
            status=status.HTTP_400_BAD_REQUEST,
        )
    fetchers = {"en": _tafsir_en, "id": _tafsir_id}
    if lang not in fetchers:
        return envelope(
            errors=[{"message": f"No tafsir available for language '{lang}'."}],
            status=status.HTTP_400_BAD_REQUEST,
        )

    stored = TafsirEntry.objects.filter(verse_key=key, language=lang).first()
    if stored is not None:
        return envelope(
            {
                "verse_key": stored.verse_key,
                "language": stored.language,
                "resource_name": stored.resource_name,
                "text": stored.text,
            },
            meta={"cache": "DB"},
            headers={"X-Cache": "HIT"},
        )
    try:
        data = fetchers[lang](key)
    except requests.RequestException:
        return envelope(
            errors=[{"message": _UNAVAILABLE}],
            status=status.HTTP_502_BAD_GATEWAY,
        )
    TafsirEntry.objects.update_or_create(
        verse_key=key,
        language=lang,
        defaults={
            "resource_name": data.get("resource_name", ""),
            "text": data.get("text", ""),
        },
    )
    return envelope(data, meta={"cache": "MISS"}, headers={"X-Cache": "MISS"})
