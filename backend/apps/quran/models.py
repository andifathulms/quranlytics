"""Core Quran data models: surahs, verses, translations, words, roots, stats.

Arabic text integrity rule: ``Verse.text_uthmani`` and ``Word.arabic`` hold the
exact sourced text and must never be altered. ``Verse.text_clean`` is a derived
search-only field (tashkeel stripped) and is never shown to users.
"""
from __future__ import annotations

from django.contrib.postgres.indexes import GinIndex
from django.db import models


class Surah(models.Model):
    REVELATION_CHOICES = [("Meccan", "Meccan"), ("Medinan", "Medinan")]

    number = models.IntegerField(unique=True)  # 1-114
    name_arabic = models.CharField(max_length=50)
    name_transliteration = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_id = models.CharField(max_length=100)
    revelation_type = models.CharField(max_length=10, choices=REVELATION_CHOICES)
    verse_count = models.IntegerField()
    revelation_order = models.IntegerField()  # Chronological order

    class Meta:
        ordering = ["number"]

    def __str__(self) -> str:
        return f"{self.number}. {self.name_transliteration}"


class Verse(models.Model):
    surah = models.ForeignKey(
        Surah, on_delete=models.CASCADE, related_name="verses"
    )
    number = models.IntegerField()  # Verse number within surah
    text_uthmani = models.TextField()  # Arabic Uthmani script (exact, immutable)
    text_clean = models.TextField()  # Arabic without tashkeel (search only)
    juz_number = models.IntegerField()
    page_number = models.IntegerField()
    revelation_order = models.IntegerField()  # Global chronological order

    class Meta:
        unique_together = ("surah", "number")
        ordering = ["surah__number", "number"]
        indexes = [
            models.Index(fields=["juz_number"]),
            models.Index(fields=["revelation_order"]),
        ]

    @property
    def key(self) -> str:
        return f"{self.surah.number}:{self.number}"

    def __str__(self) -> str:
        return self.key


class Translation(models.Model):
    LANGUAGE_CHOICES = [("en", "English"), ("id", "Indonesian")]

    verse = models.ForeignKey(
        Verse, on_delete=models.CASCADE, related_name="translations"
    )
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES)
    translator = models.CharField(max_length=100)
    text = models.TextField()

    class Meta:
        unique_together = ("verse", "language", "translator")
        indexes = [models.Index(fields=["language"])]

    def __str__(self) -> str:
        return f"{self.verse} [{self.language}]"


class WordRoot(models.Model):
    # Normalized lookup key (hamza/alef forms unified) — what queries match on.
    root_arabic = models.CharField(max_length=20, unique=True)
    # Raw root in proper orthography (hamza preserved) — for display only.
    root_display = models.CharField(max_length=20, blank=True)
    root_transliteration = models.CharField(max_length=50)
    meaning_en = models.CharField(max_length=200, blank=True)
    meaning_id = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["root_arabic"]

    @property
    def display(self) -> str:
        return self.root_display or self.root_arabic

    def __str__(self) -> str:
        return f"{self.display} ({self.root_transliteration})"


class Word(models.Model):
    verse = models.ForeignKey(
        Verse, on_delete=models.CASCADE, related_name="words"
    )
    position = models.IntegerField()  # 1-indexed position within verse
    arabic = models.CharField(max_length=100)  # exact sourced surface form
    transliteration = models.CharField(max_length=200, blank=True)
    translation_en = models.CharField(max_length=200, blank=True)
    lemma = models.CharField(max_length=100, blank=True)  # dictionary form
    root = models.ForeignKey(
        WordRoot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="words",
    )
    morphology_tag = models.CharField(max_length=200, blank=True)  # POS + features
    is_stopword = models.BooleanField(default=False)

    class Meta:
        unique_together = ("verse", "position")
        ordering = ["verse", "position"]
        indexes = [
            models.Index(fields=["lemma"]),
            models.Index(fields=["arabic"]),
            GinIndex(
                name="word_arabic_trgm_idx",
                fields=["arabic"],
                opclasses=["gin_trgm_ops"],
            ),
        ]

    def __str__(self) -> str:
        return f"{self.arabic} @ {self.verse}:{self.position}"


class SurahStats(models.Model):
    """Materialised per-surah statistics — populated via Celery task."""

    surah = models.OneToOneField(
        Surah, on_delete=models.CASCADE, related_name="stats"
    )
    verse_count = models.IntegerField()
    word_count = models.IntegerField()
    letter_count = models.IntegerField()
    unique_word_count = models.IntegerField()
    unique_root_count = models.IntegerField()
    computed_at = models.DateTimeField()

    class Meta:
        verbose_name_plural = "Surah stats"

    def __str__(self) -> str:
        return f"Stats for {self.surah}"


class WordFrequency(models.Model):
    """Materialised word/root frequency cache.

    Built by ``build_frequency_cache`` and refreshed nightly. User-facing
    frequency APIs read from here — never COUNT the Word table live.
    """

    lemma = models.CharField(max_length=100, blank=True, db_index=True)
    root = models.ForeignKey(
        WordRoot,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="frequencies",
    )
    total_count = models.IntegerField()
    surah_distribution = models.JSONField(default=dict)  # {surah_number: count}
    computed_at = models.DateTimeField()

    class Meta:
        verbose_name_plural = "Word frequencies"
        indexes = [
            GinIndex(fields=["surah_distribution"], name="wordfreq_dist_gin"),
            models.Index(fields=["total_count"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["lemma"],
                condition=models.Q(root__isnull=True),
                name="uniq_frequency_per_lemma",
            ),
            models.UniqueConstraint(
                fields=["root"],
                condition=models.Q(root__isnull=False),
                name="uniq_frequency_per_root",
            ),
        ]

    def __str__(self) -> str:
        label = self.root.root_arabic if self.root else self.lemma
        return f"{label}: {self.total_count}"
