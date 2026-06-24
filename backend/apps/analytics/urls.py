"""Analytics URL routes (mounted under /api/v1/analytics/)."""
from django.urls import path

from . import views

urlpatterns = [
    path("word-frequency/", views.word_frequency_view, name="word-frequency"),
    path("root-tree/", views.root_tree_view, name="root-tree"),
    path("co-occurrence/", views.cooccurrence_view, name="co-occurrence"),
    path(
        "surah-stats/<int:surah_id>/",
        views.surah_stats_view,
        name="surah-stats",
    ),
    path("rare-words/", views.rare_words_view, name="rare-words"),
    path("verify-claim/", views.verify_claim_view, name="verify-claim"),
]
