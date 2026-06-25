"""Cluster verse embeddings into themes and label them with keywords.

KMeans over the stored embeddings assigns each verse a theme cluster; per
cluster, TF-IDF over the English translations yields the top keywords used as
a human-readable label.
"""
from __future__ import annotations

from collections import defaultdict

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.semantic.models import Theme, VerseEmbedding


class Command(BaseCommand):
    help = "Cluster verse embeddings into labelled themes (KMeans + TF-IDF)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--clusters", type=int, default=settings.THEME_CLUSTER_COUNT
        )

    def handle(self, *args, **options) -> None:
        import numpy as np
        from sklearn.cluster import KMeans
        from sklearn.feature_extraction.text import TfidfVectorizer

        rows = list(
            VerseEmbedding.objects.select_related("verse")
            .prefetch_related("verse__translations")
            .all()
        )
        if not rows:
            self.stderr.write(self.style.ERROR("No embeddings. Run ingest_embeddings."))
            return

        n_clusters = options["clusters"]
        self.stdout.write(
            f"Clustering {len(rows)} verses into {n_clusters} themes..."
        )
        matrix = np.array([r.embedding for r in rows], dtype="float32")
        labels = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit_predict(
            matrix
        )

        # Gather English text per cluster for keyword labelling.
        texts_by_cluster: dict[int, list[str]] = defaultdict(list)
        for row, label in zip(rows, labels):
            row.theme_cluster = int(label)
            en = next(
                (t.text for t in row.verse.translations.all() if t.language == "en"),
                "",
            )
            texts_by_cluster[int(label)].append(en)

        keywords = self._cluster_keywords(texts_by_cluster, TfidfVectorizer)
        self._persist(rows, labels, keywords)

        self.stdout.write(
            self.style.SUCCESS(
                f"Themes built: {Theme.objects.count()} clusters labelled."
            )
        )

    def _cluster_keywords(self, texts_by_cluster, TfidfVectorizer) -> dict[int, list[str]]:
        docs = {cid: " ".join(texts) for cid, texts in texts_by_cluster.items()}
        cluster_ids = list(docs)
        vectorizer = TfidfVectorizer(
            stop_words="english", max_features=4000, ngram_range=(1, 2)
        )
        tfidf = vectorizer.fit_transform([docs[c] for c in cluster_ids])
        vocab = vectorizer.get_feature_names_out()
        keywords: dict[int, list[str]] = {}
        for i, cid in enumerate(cluster_ids):
            row = tfidf[i].toarray()[0]
            top = row.argsort()[::-1][:5]
            keywords[cid] = [vocab[j] for j in top if row[j] > 0]
        return keywords

    @transaction.atomic
    def _persist(self, rows, labels, keywords) -> None:
        now = timezone.now()
        VerseEmbedding.objects.bulk_update(rows, ["theme_cluster"], batch_size=500)

        sizes: dict[int, int] = defaultdict(int)
        for label in labels:
            sizes[int(label)] += 1

        Theme.objects.all().delete()
        Theme.objects.bulk_create(
            [
                Theme(
                    cluster_id=cid,
                    label=", ".join(kw[:3]) or f"Theme {cid}",
                    keywords=kw,
                    size=sizes[cid],
                    computed_at=now,
                )
                for cid, kw in keywords.items()
            ]
        )
