"""Semantic search (Phase 4).

Endpoint is wired now so the frontend contract is stable. The embedding-based
implementation lands in Phase 4; until then it returns a keyword fallback over
translations so the route is usable.
"""
from __future__ import annotations

from rest_framework.decorators import api_view

from apps.common.envelope import envelope
from apps.quran.models import Verse
from apps.quran.serializers import VerseSerializer


@api_view(["POST"])
def semantic_search_view(request):
    query = (request.data.get("query") or "").strip()
    if not query:
        return envelope(errors=[{"message": "'query' is required."}], status=400)

    # Phase 1 fallback: keyword match over EN/ID translations. Phase 4 replaces
    # this with embedding similarity ranking.
    verses = (
        Verse.objects.filter(translations__text__icontains=query)
        .select_related("surah")
        .prefetch_related("translations")
        .distinct()
        .order_by("surah__number", "number")[:50]
    )
    data = VerseSerializer(verses, many=True).data
    return envelope(
        {"query": query, "verses": data},
        meta={"mode": "keyword-fallback", "phase4": "embedding-pending"},
    )
