from django.urls import path

from . import views

urlpatterns = [
    path("search/", views.semantic_search_view, name="semantic-search"),
]
