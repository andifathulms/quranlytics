"""Community routes (mounted under /api/v1/)."""
from django.urls import path

from . import views

urlpatterns = [
    path("discoveries/", views.DiscoveryListCreateView.as_view(), name="discovery-list"),
    path("discoveries/mine/", views.my_discoveries_view, name="discovery-mine"),
    path(
        "discoveries/<int:pk>/",
        views.DiscoveryDetailView.as_view(),
        name="discovery-detail",
    ),
    path("discoveries/<int:pk>/vote/", views.vote_view, name="discovery-vote"),
    path("profiles/<str:username>/", views.profile_view, name="profile"),
]
