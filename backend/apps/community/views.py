"""Community API: discovery feed, CRUD, voting, and public profiles."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView

from apps.common.envelope import envelope
from apps.common.pagination import EnvelopePageNumberPagination
from apps.common.throttles import VoteRateThrottle, WriteRateThrottle

from .models import Discovery, DiscoveryVote
from .serializers import (
    DiscoverySerializer,
    DiscoveryWriteSerializer,
    VoteSerializer,
)

User = get_user_model()


def _attach_my_votes(discoveries, user) -> None:
    """Annotate each discovery with the requesting user's vote (avoids N+1)."""
    if not user or not user.is_authenticated:
        return
    ids = [d.id for d in discoveries]
    votes = dict(
        DiscoveryVote.objects.filter(user=user, discovery_id__in=ids).values_list(
            "discovery_id", "value"
        )
    )
    for d in discoveries:
        d._my_vote = votes.get(d.id, 0)


class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.is_public or obj.author_id == getattr(request.user, "id", None)
        return obj.author_id == getattr(request.user, "id", None)


class DiscoveryListCreateView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = EnvelopePageNumberPagination

    def get_serializer_class(self):
        return (
            DiscoveryWriteSerializer
            if self.request.method == "POST"
            else DiscoverySerializer
        )

    def get_throttles(self):
        # Only throttle creation; the public feed (GET) stays unthrottled.
        return [WriteRateThrottle()] if self.request.method == "POST" else []

    def get_queryset(self):
        qs = Discovery.objects.filter(is_public=True).select_related("author")
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        author = self.request.query_params.get("author")
        if author:
            qs = qs.filter(author__username=author)
        sort = self.request.query_params.get("sort", "recent")
        return qs.order_by("-vote_score", "-created_at") if sort == "top" else qs

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        _attach_my_votes(page, request.user)
        data = DiscoverySerializer(
            page, many=True, context={"request": request}
        ).data
        return self.get_paginated_response(data)

    def create(self, request, *args, **kwargs):
        serializer = DiscoveryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        discovery = serializer.save(author=request.user)
        return envelope(
            DiscoverySerializer(discovery, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DiscoveryDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthorOrReadOnly]
    serializer_class = DiscoverySerializer

    def get_queryset(self):
        return Discovery.objects.select_related("author")

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        _attach_my_votes([obj], request.user)
        return envelope(
            DiscoverySerializer(obj, context={"request": request}).data
        )

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = DiscoveryWriteSerializer(
            obj, data=request.data, partial=kwargs.get("partial", False)
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return envelope(
            DiscoverySerializer(obj, context={"request": request}).data
        )

    def destroy(self, request, *args, **kwargs):
        self.perform_destroy(self.get_object())
        return envelope({"deleted": True})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_discoveries_view(request):
    qs = Discovery.objects.filter(author=request.user).select_related("author")
    items = list(qs)
    _attach_my_votes(items, request.user)
    data = DiscoverySerializer(items, many=True, context={"request": request}).data
    return envelope(data, meta={"count": len(data)})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([VoteRateThrottle])
def vote_view(request, pk: int):
    serializer = VoteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    value = serializer.validated_data["value"]

    discovery = Discovery.objects.filter(pk=pk).first()
    if discovery is None:
        return envelope(
            errors=[{"message": "Discovery not found."}],
            status=status.HTTP_404_NOT_FOUND,
        )

    with transaction.atomic():
        if value == 0:
            DiscoveryVote.objects.filter(
                user=request.user, discovery=discovery
            ).delete()
        else:
            DiscoveryVote.objects.update_or_create(
                user=request.user,
                discovery=discovery,
                defaults={"value": value},
            )
        score = discovery.recompute_score()

    return envelope({"id": discovery.id, "vote_score": score, "my_vote": value})


@api_view(["GET"])
def profile_view(request, username: str):
    user = User.objects.filter(username=username).first()
    if user is None:
        return envelope(
            errors=[{"message": "User not found."}],
            status=status.HTTP_404_NOT_FOUND,
        )
    discoveries = list(
        Discovery.objects.filter(author=user, is_public=True).select_related(
            "author"
        )
    )
    _attach_my_votes(discoveries, request.user)
    return envelope(
        {
            "username": user.username,
            "discovery_count": len(discoveries),
            "total_score": sum(d.vote_score for d in discoveries),
            "discoveries": DiscoverySerializer(
                discoveries, many=True, context={"request": request}
            ).data,
        }
    )
