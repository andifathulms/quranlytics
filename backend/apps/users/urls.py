"""Auth + bookmark/note routes (mounted under /api/v1/)."""
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    # Bookmarks
    path(
        "bookmarks/",
        views.BookmarkListCreateView.as_view(),
        name="bookmark-list",
    ),
    path(
        "bookmarks/<int:pk>/",
        views.BookmarkDeleteView.as_view(),
        name="bookmark-delete",
    ),
    # Notes
    path("notes/", views.NoteListCreateView.as_view(), name="note-list"),
    path("notes/<int:pk>/", views.NoteDetailView.as_view(), name="note-detail"),
    # Reading progress
    path("progress/", views.ReadingProgressView.as_view(), name="progress"),
]
