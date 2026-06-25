"""Community layer — shareable discoveries and voting (Phase 5).

A Discovery is a user-submitted finding (a numeric claim, a linguistic pattern,
a structural observation…) with an optional structured ``payload`` referencing
the underlying data. Other users vote it up or down; ``vote_score`` is a
denormalized sum kept in sync on every vote.
"""
from __future__ import annotations

from django.conf import settings
from django.db import models


class Discovery(models.Model):
    CATEGORY_CHOICES = [
        ("Numerical", "Numerical"),
        ("Linguistic", "Linguistic"),
        ("Structural", "Structural"),
        ("Thematic", "Thematic"),
        ("Other", "Other"),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="discoveries",
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="Other"
    )
    # Optional structured reference, e.g. {"word": "يوم", "count": 365} or
    # {"verse_keys": ["2:255", "..."]}. Lets the share card render live data.
    payload = models.JSONField(default=dict, blank=True)
    is_public = models.BooleanField(default=True)
    vote_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_public", "-vote_score"]),
            models.Index(fields=["is_public", "-created_at"]),
            models.Index(fields=["category"]),
        ]

    def recompute_score(self) -> int:
        self.vote_score = self.votes.aggregate(
            total=models.Sum("value")
        )["total"] or 0
        self.save(update_fields=["vote_score"])
        return self.vote_score

    def __str__(self) -> str:
        return f"{self.title} by {self.author}"


class DiscoveryVote(models.Model):
    UP, DOWN = 1, -1

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="discovery_votes",
    )
    discovery = models.ForeignKey(
        Discovery, on_delete=models.CASCADE, related_name="votes"
    )
    value = models.SmallIntegerField(choices=[(UP, "Up"), (DOWN, "Down")])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "discovery")

    def __str__(self) -> str:
        return f"{self.user} {self.value:+d} {self.discovery_id}"
