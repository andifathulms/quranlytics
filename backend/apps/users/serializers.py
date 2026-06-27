"""Serializers for auth, bookmarks, and notes."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.quran.models import Surah

from .models import Bookmark, Note, ReadingState

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, validators=[validate_password]
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data: dict) -> "User":
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class BookmarkSerializer(serializers.ModelSerializer):
    verse_key = serializers.CharField(source="verse.key", read_only=True)

    class Meta:
        model = Bookmark
        fields = ("id", "verse", "verse_key", "created_at")
        read_only_fields = ("created_at",)


class NoteSerializer(serializers.ModelSerializer):
    verse_key = serializers.CharField(source="verse.key", read_only=True)

    class Meta:
        model = Note
        fields = ("id", "verse", "verse_key", "body", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")


class ReadingStateSerializer(serializers.ModelSerializer):
    last_verse_key = serializers.SerializerMethodField()
    started_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()

    class Meta:
        model = ReadingState
        fields = (
            "last_surah",
            "last_verse",
            "last_verse_key",
            "progress",
            "streak_count",
            "longest_streak",
            "last_read_date",
            "started_count",
            "completed_count",
            "updated_at",
        )

    def get_last_verse_key(self, obj: ReadingState) -> str | None:
        if obj.last_surah and obj.last_verse:
            return f"{obj.last_surah}:{obj.last_verse}"
        return None

    def get_started_count(self, obj: ReadingState) -> int:
        return len(obj.progress or {})

    def get_completed_count(self, obj: ReadingState) -> int:
        # A surah counts as completed once the furthest verse reaches its length.
        counts = dict(Surah.objects.values_list("number", "verse_count"))
        return sum(
            1
            for num, furthest in (obj.progress or {}).items()
            if furthest >= counts.get(int(num), 10**9)
        )
