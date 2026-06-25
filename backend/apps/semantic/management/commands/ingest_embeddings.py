"""Compute and store a multilingual embedding for every verse.

Embeds the EN + ID translations (the semantic content) with the configured
sentence-transformer and upserts into VerseEmbedding (pgvector).
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.quran.models import Verse
from apps.semantic.embeddings import embed_texts, verse_embed_text
from apps.semantic.models import VerseEmbedding


class Command(BaseCommand):
    help = "Compute and store verse embeddings for semantic search."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--batch", type=int, default=256)
        parser.add_argument(
            "--rebuild",
            action="store_true",
            help="Recompute all embeddings (default: only missing ones).",
        )

    def handle(self, *args, **options) -> None:
        batch_size = options["batch"]
        qs = Verse.objects.prefetch_related("translations").order_by("id")
        if not options["rebuild"]:
            qs = qs.filter(embedding__isnull=True)

        verses = list(qs)
        total = len(verses)
        if not total:
            self.stdout.write(self.style.SUCCESS("All verses already embedded."))
            return

        self.stdout.write(f"Embedding {total} verses with {settings.EMBEDDING_MODEL}...")
        now = timezone.now()
        done = 0
        for start in range(0, total, batch_size):
            chunk = verses[start : start + batch_size]
            texts = []
            for v in chunk:
                trans = {t.language: t.text for t in v.translations.all()}
                texts.append(
                    verse_embed_text(trans.get("en", ""), trans.get("id", ""))
                )
            vectors = embed_texts(texts)
            self._upsert(chunk, vectors, now)
            done += len(chunk)
            self.stdout.write(f"  {done}/{total}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Embeddings stored: {VerseEmbedding.objects.count()} total."
            )
        )

    @transaction.atomic
    def _upsert(self, verses, vectors, now) -> None:
        existing = dict(
            VerseEmbedding.objects.filter(verse__in=verses).values_list(
                "verse_id", "id"
            )
        )
        to_create, to_update = [], []
        for verse, vec in zip(verses, vectors):
            if verse.id in existing:
                to_update.append(
                    VerseEmbedding(
                        id=existing[verse.id],
                        verse_id=verse.id,
                        embedding=vec,
                        model_name=settings.EMBEDDING_MODEL,
                        computed_at=now,
                    )
                )
            else:
                to_create.append(
                    VerseEmbedding(
                        verse_id=verse.id,
                        embedding=vec,
                        model_name=settings.EMBEDDING_MODEL,
                        computed_at=now,
                    )
                )
        if to_create:
            VerseEmbedding.objects.bulk_create(to_create, batch_size=500)
        if to_update:
            VerseEmbedding.objects.bulk_update(
                to_update, ["embedding", "model_name", "computed_at"], batch_size=500
            )
