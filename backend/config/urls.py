"""Root URL configuration for Quranlytics."""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"data": {"status": "ok"}, "meta": {}, "errors": []})


api_v1 = [
    path("", include("apps.quran.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("semantic/", include("apps.semantic.urls")),
    path("", include("apps.users.urls")),
    path("", include("apps.community.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health, name="health"),
    path("api/v1/", include((api_v1, "api"), namespace="v1")),
]
