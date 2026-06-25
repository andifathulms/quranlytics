"""Analytics URL routes (mounted under /api/v1/analytics/)."""
from django.urls import path

from . import views

urlpatterns = [
    path("word-frequency/", views.word_frequency_view, name="word-frequency"),
    path("root-tree/", views.root_tree_view, name="root-tree"),
    path("co-occurrence/", views.cooccurrence_view, name="co-occurrence"),
    path("surah-stats/", views.surah_stats_list_view, name="surah-stats-all"),
    path(
        "surah-stats/<int:surah_id>/",
        views.surah_stats_view,
        name="surah-stats",
    ),
    path("rare-words/", views.rare_words_view, name="rare-words"),
    path("verify-claim/", views.verify_claim_view, name="verify-claim"),
    # Phase 3 structural tools
    path(
        "verse-lengths/<int:surah_id>/",
        views.verse_lengths_view,
        name="verse-lengths",
    ),
    path("surah-pair/", views.surah_pair_view, name="surah-pair"),
    path("chiastic/", views.chiastic_view, name="chiastic"),
]
