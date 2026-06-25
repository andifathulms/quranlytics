from django.contrib import admin

from .models import Discovery, DiscoveryVote


@admin.register(Discovery)
class DiscoveryAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "vote_score", "is_public", "created_at")
    list_filter = ("category", "is_public")
    search_fields = ("title", "body", "author__username")
    raw_id_fields = ("author",)


@admin.register(DiscoveryVote)
class DiscoveryVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "discovery", "value", "created_at")
    raw_id_fields = ("user", "discovery")
