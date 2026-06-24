from django.contrib import admin

from .models import (
    Surah,
    SurahStats,
    Translation,
    Verse,
    Word,
    WordFrequency,
    WordRoot,
)


@admin.register(Surah)
class SurahAdmin(admin.ModelAdmin):
    list_display = (
        "number",
        "name_transliteration",
        "name_en",
        "revelation_type",
        "verse_count",
        "revelation_order",
    )
    list_filter = ("revelation_type",)
    search_fields = ("name_transliteration", "name_en", "name_id", "name_arabic")
    ordering = ("number",)


@admin.register(Verse)
class VerseAdmin(admin.ModelAdmin):
    list_display = ("__str__", "surah", "number", "juz_number", "page_number")
    list_filter = ("juz_number", "surah__revelation_type")
    search_fields = ("text_clean",)
    raw_id_fields = ("surah",)


@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ("verse", "language", "translator")
    list_filter = ("language", "translator")
    raw_id_fields = ("verse",)


@admin.register(WordRoot)
class WordRootAdmin(admin.ModelAdmin):
    list_display = ("root_arabic", "root_transliteration", "meaning_en")
    search_fields = ("root_arabic", "root_transliteration", "meaning_en")


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    list_display = ("arabic", "verse", "position", "lemma", "root", "is_stopword")
    list_filter = ("is_stopword",)
    search_fields = ("arabic", "lemma", "transliteration")
    raw_id_fields = ("verse", "root")


@admin.register(SurahStats)
class SurahStatsAdmin(admin.ModelAdmin):
    list_display = (
        "surah",
        "word_count",
        "letter_count",
        "unique_word_count",
        "unique_root_count",
        "computed_at",
    )


@admin.register(WordFrequency)
class WordFrequencyAdmin(admin.ModelAdmin):
    list_display = ("__str__", "lemma", "root", "total_count", "computed_at")
    search_fields = ("lemma", "root__root_arabic")
    raw_id_fields = ("root",)
