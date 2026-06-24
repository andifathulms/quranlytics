from django.contrib import admin

from .models import Bookmark, Note, ReadingHistory


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("user", "verse", "created_at")
    raw_id_fields = ("user", "verse")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("user", "verse", "updated_at")
    raw_id_fields = ("user", "verse")
    search_fields = ("body",)


@admin.register(ReadingHistory)
class ReadingHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "verse", "read_at")
    raw_id_fields = ("user", "verse")
