"""Auth + bookmark/note views."""
from __future__ import annotations

from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.common.envelope import envelope

from .models import Bookmark, Note
from .serializers import (
    BookmarkSerializer,
    NoteSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return envelope(
            UserSerializer(user).data, status=status.HTTP_201_CREATED
        )


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        return envelope(UserSerializer(request.user).data)


class _OwnedListCreateView(generics.ListCreateAPIView):
    """Base list/create scoped to the requesting user."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.model.objects.filter(
            user=self.request.user
        ).select_related("verse__surah")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        return envelope(data, meta={"count": len(data)})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return envelope(serializer.data, status=status.HTTP_201_CREATED)


class BookmarkListCreateView(_OwnedListCreateView):
    model = Bookmark
    serializer_class = BookmarkSerializer


class BookmarkDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BookmarkSerializer

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        self.perform_destroy(self.get_object())
        return envelope({"deleted": True}, status=status.HTTP_200_OK)


class NoteListCreateView(_OwnedListCreateView):
    model = Note
    serializer_class = NoteSerializer


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NoteSerializer

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        return envelope(self.get_serializer(self.get_object()).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(
            self.get_object(), data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return envelope(serializer.data)

    def destroy(self, request, *args, **kwargs):
        self.perform_destroy(self.get_object())
        return envelope({"deleted": True})
