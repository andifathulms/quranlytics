"""Semantic layer models — verse embeddings (pgvector) and theme clusters."""
from __future__ import annotations

from django.conf import settings
from django.db import models
from pgvector.django import HnswIndex, VectorField

from apps.quran.models import Verse


class VerseEmbedding(models.Model):
    """A dense multilingual embedding per verse, for semantic similarity."""

    verse = models.OneToOneField(
        Verse, on_delete=models.CASCADE, related_name="embedding"
    )
    embedding = VectorField(dimensions=settings.EMBEDDING_DIM)
    theme_cluster = models.IntegerField(null=True, blank=True)
    model_name = models.CharField(max_length=120)
    computed_at = models.DateTimeField()

    class Meta:
        indexes = [
            # Cosine-distance HNSW index for fast nearest-neighbour search.
            HnswIndex(
                name="verseemb_hnsw_cos",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            ),
            models.Index(fields=["theme_cluster"]),
        ]

    def __str__(self) -> str:
        return f"Embedding for {self.verse}"


class Theme(models.Model):
    """A discovered theme cluster over verse embeddings (KMeans)."""

    cluster_id = models.IntegerField(unique=True)
    label = models.CharField(max_length=200)
    keywords = models.JSONField(default=list)
    size = models.IntegerField(default=0)
    computed_at = models.DateTimeField()

    class Meta:
        ordering = ["-size"]

    def __str__(self) -> str:
        return f"Theme {self.cluster_id}: {self.label}"
