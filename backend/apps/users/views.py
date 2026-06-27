"""Auth + bookmark/note views."""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.envelope import envelope
from apps.common.throttles import RegisterRateThrottle

from .models import Bookmark, Note, ReadingState
from .serializers import (
    BookmarkSerializer,
    NoteSerializer,
    ReadingStateSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

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


class ReadingProgressView(APIView):
    """GET the user's reading state; POST {surah, verse} to record a position.

    POST updates the resume point, the per-surah furthest verse, and the daily
    reading streak (consecutive calendar days with any reading activity).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        state, _ = ReadingState.objects.get_or_create(user=request.user)
        return envelope(ReadingStateSerializer(state).data)

    def post(self, request):
        try:
            surah = int(request.data["surah"])
            verse = int(request.data["verse"])
        except (KeyError, TypeError, ValueError):
            return envelope(
                errors=[{"message": "Provide integer 'surah' and 'verse'."}],
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not (1 <= surah <= 114) or verse < 1:
            return envelope(
                errors=[{"message": "surah must be 1–114 and verse >= 1."}],
                status=status.HTTP_400_BAD_REQUEST,
            )

        state, _ = ReadingState.objects.get_or_create(user=request.user)
        state.last_surah = surah
        state.last_verse = verse

        progress = state.progress or {}
        key = str(surah)
        progress[key] = max(int(progress.get(key, 0)), verse)
        state.progress = progress

        today = timezone.localdate()
        if state.last_read_date == today:
            pass  # already counted today
        elif state.last_read_date == today - timedelta(days=1):
            state.streak_count += 1
        else:
            state.streak_count = 1
        state.longest_streak = max(state.longest_streak, state.streak_count)
        state.last_read_date = today
        state.save()
        return envelope(ReadingStateSerializer(state).data)


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
