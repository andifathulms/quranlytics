from django.urls import path

from . import views

urlpatterns = [
    path("search/", views.semantic_search_view, name="semantic-search"),
    path(
        "cross-references/<int:verse_id>/",
        views.cross_references_view,
        name="cross-references",
    ),
    path("themes/", views.themes_view, name="themes"),
    path(
        "themes/<int:cluster_id>/",
        views.theme_verses_view,
        name="theme-verses",
    ),
]
