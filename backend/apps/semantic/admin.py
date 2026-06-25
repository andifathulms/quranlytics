from django.contrib import admin

from .models import Theme, VerseEmbedding


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ("cluster_id", "label", "size", "computed_at")
    search_fields = ("label",)


@admin.register(VerseEmbedding)
class VerseEmbeddingAdmin(admin.ModelAdmin):
    list_display = ("verse", "theme_cluster", "model_name", "computed_at")
    list_filter = ("theme_cluster", "model_name")
    raw_id_fields = ("verse",)
