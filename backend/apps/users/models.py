"""User-owned reader data: bookmarks, notes, reading history.

Uses Django's built-in User. JWT auth is handled by simplejwt.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.quran.models import Verse


class Bookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
    )
    verse = models.ForeignKey(
        Verse, on_delete=models.CASCADE, related_name="bookmarks"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "verse")
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Bookmark {self.verse} by {self.user}"


class Note(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    verse = models.ForeignKey(
        Verse, on_delete=models.CASCADE, related_name="notes"
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Note on {self.verse} by {self.user}"


class ReadingHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="history",
    )
    verse = models.ForeignKey(
        Verse, on_delete=models.CASCADE, related_name="+"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-read_at"]
        verbose_name_plural = "Reading history"
