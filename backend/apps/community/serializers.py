"""Serializers for community discoveries and votes."""
from __future__ import annotations

from rest_framework import serializers

from .models import Discovery


class DiscoverySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    my_vote = serializers.SerializerMethodField()

    class Meta:
        model = Discovery
        fields = (
            "id",
            "author_username",
            "title",
            "body",
            "category",
            "payload",
            "is_public",
            "vote_score",
            "my_vote",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("vote_score", "created_at", "updated_at")

    def get_my_vote(self, obj: Discovery) -> int:
        """The requesting user's vote value on this discovery (0 if none)."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        # Uses the prefetched `_my_votes` map when available to avoid N+1.
        cache = getattr(obj, "_my_vote", None)
        if cache is not None:
            return cache
        vote = obj.votes.filter(user=request.user).first()
        return vote.value if vote else 0


class DiscoveryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discovery
        fields = ("title", "body", "category", "payload", "is_public")


class VoteSerializer(serializers.Serializer):
    value = serializers.IntegerField(min_value=-1, max_value=1)
