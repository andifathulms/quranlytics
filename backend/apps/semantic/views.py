"""Semantic search, cross-reference, and theme-browsing views (Phase 4)."""
from __future__ import annotations

from rest_framework.decorators import api_view

from apps.common.envelope import envelope
from apps.common.pagination import EnvelopePageNumberPagination
from apps.quran.serializers import VerseSerializer

from . import services


@api_view(["POST"])
def semantic_search_view(request):
    query = (request.data.get("query") or "").strip()
    if not query:
        return envelope(errors=[{"message": "'query' is required."}], status=400)
    try:
        limit = min(int(request.data.get("limit", 20)), 50)
    except (TypeError, ValueError):
        limit = 20
    return envelope(services.semantic_search(query, limit=limit))


@api_view(["GET"])
def cross_references_view(request, verse_id: int):
    try:
        limit = min(int(request.query_params.get("limit", 10)), 30)
    except ValueError:
        limit = 10
    return envelope(services.cross_references(verse_id, limit=limit))


@api_view(["GET"])
def themes_view(request):
    return envelope({"themes": services.list_themes()})


@api_view(["GET"])
def theme_verses_view(request, cluster_id: int):
    qs = services.theme_verses(cluster_id)
    paginator = EnvelopePageNumberPagination()
    page = paginator.paginate_queryset(qs, request)
    data = VerseSerializer(page, many=True).data
    return paginator.get_paginated_response(data)
