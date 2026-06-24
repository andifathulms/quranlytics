"""Quran reader API views: surahs, verses, words, search."""
from __future__ import annotations

from django.db.models import Prefetch, Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.generics import ListAPIView, RetrieveAPIView

from apps.common.arabic import normalize_search
from apps.common.envelope import envelope
from apps.common.pagination import (
    EnvelopePageNumberPagination,
    VerseCursorPagination,
)

from .models import Surah, Translation, Verse, Word
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
    """GET /surahs/{number}/verses/ — verses with translations (paginated)."""

    serializer_class = VerseSerializer
    pagination_class = VerseCursorPagination

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


class VerseWordsView(ListAPIView):
    """GET /verses/{id}/words/ — word-level morphology breakdown."""

    serializer_class = WordSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Word.objects.filter(verse_id=self.kwargs["pk"])
            .select_related("root")
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
            "translations", "words__root"
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
