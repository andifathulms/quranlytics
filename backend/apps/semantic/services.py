"""Semantic services — vector search, cross-references, theme browsing."""
from __future__ import annotations

from typing import Any

from pgvector.django import CosineDistance

from apps.quran.models import Verse
from apps.quran.serializers import VerseSerializer

from .embeddings import embed_query
from .models import Theme, VerseEmbedding


def _verses_payload(rows: list[VerseEmbedding]) -> list[dict[str, Any]]:
    """Serialize embedding rows' verses, attaching a similarity score."""
    verses = [r.verse for r in rows]
    serialized = VerseSerializer(verses, many=True).data
    by_id = {v["id"]: v for v in serialized}
    out = []
    for r in rows:
        item = dict(by_id[r.verse_id])
        item["similarity"] = round(1.0 - float(r.distance), 4)
        out.append(item)
    return out


def _base_qs():
    return VerseEmbedding.objects.select_related("verse__surah").prefetch_related(
        "verse__translations"
    )


def semantic_search(query: str, limit: int = 20) -> dict[str, Any]:
    """Embed the query and return the nearest verses by cosine similarity."""
    qvec = embed_query(query)
    rows = list(
        _base_qs()
        .annotate(distance=CosineDistance("embedding", qvec))
        .order_by("distance")[:limit]
    )
    return {"query": query, "count": len(rows), "verses": _verses_payload(rows)}


def cross_references(verse_id: int, limit: int = 10) -> dict[str, Any]:
    """Verses most semantically similar to a given verse (excluding itself)."""
    anchor = VerseEmbedding.objects.filter(verse_id=verse_id).first()
    if anchor is None:
        return {"verse_id": verse_id, "available": False, "verses": []}
    rows = list(
        _base_qs()
        .exclude(verse_id=verse_id)
        .annotate(distance=CosineDistance("embedding", anchor.embedding))
        .order_by("distance")[:limit]
    )
    return {
        "verse_id": verse_id,
        "available": True,
        "count": len(rows),
        "verses": _verses_payload(rows),
    }


def list_themes() -> list[dict[str, Any]]:
    """All discovered theme clusters with a few sample verses each."""
    themes = list(Theme.objects.all())
    result = []
    for t in themes:
        samples = list(
            VerseEmbedding.objects.filter(theme_cluster=t.cluster_id)
            .select_related("verse__surah")
            .order_by("verse__surah__number", "verse__number")[:3]
        )
        result.append(
            {
                "cluster_id": t.cluster_id,
                "label": t.label,
                "keywords": t.keywords,
                "size": t.size,
                "sample_verses": [
                    {"verse_key": s.verse.key} for s in samples
                ],
            }
        )
    return result


def theme_verses(cluster_id: int):
    """Queryset of verses in a theme cluster (for pagination in the view)."""
    return (
        Verse.objects.filter(embedding__theme_cluster=cluster_id)
        .select_related("surah")
        .prefetch_related("translations")
        .order_by("surah__number", "number")
    )
