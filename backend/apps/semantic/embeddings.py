"""Sentence-transformer embedding helpers.

The model is loaded lazily and cached as a module singleton, so importing this
module is cheap and the heavy ML deps are only touched when embeddings are
actually computed.
"""
from __future__ import annotations

from functools import lru_cache

from django.conf import settings


@lru_cache(maxsize=1)
def get_model():
    # Imported here so the app boots even if torch isn't present (e.g. in a
    # web-only deploy that never embeds).
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_texts(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    """Encode texts into L2-normalized vectors (cosine-ready)."""
    model = get_model()
    vectors = model.encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    return embed_texts([text])[0]


def verse_embed_text(en: str, idn: str) -> str:
    """The text we embed per verse — EN + ID translations carry the meaning.

    The model is multilingual, so an English, Indonesian, or Arabic query all
    map into the same space as this combined translation text.
    """
    return " ".join(t for t in (en, idn) if t).strip()
