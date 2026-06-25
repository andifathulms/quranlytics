"""Quran reader URL routes (mounted under /api/v1/)."""
from django.urls import path

from . import views

urlpatterns = [
    path("surahs/", views.SurahListView.as_view(), name="surah-list"),
    path(
        "surahs/<int:number>/",
        views.SurahDetailView.as_view(),
        name="surah-detail",
    ),
    path(
        "surahs/<int:number>/verses/",
        views.SurahVersesView.as_view(),
        name="surah-verses",
    ),
    path("verses/<int:pk>/", views.VerseDetailView.as_view(), name="verse-detail"),
    path(
        "verses/<int:pk>/words/",
        views.VerseWordsView.as_view(),
        name="verse-words",
    ),
    path("search/", views.search_view, name="search"),
    path("tafsir/", views.tafsir_view, name="tafsir"),
]
