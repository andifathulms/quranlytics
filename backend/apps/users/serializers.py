"""Serializers for auth, bookmarks, and notes."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Bookmark, Note

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
