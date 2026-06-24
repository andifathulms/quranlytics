"""DRF serializers for Quran reader resources."""
from __future__ import annotations

from rest_framework import serializers

from .models import Surah, Translation, Verse, Word, WordRoot


class SurahSerializer(serializers.ModelSerializer):
    class Meta:
        model = Surah
        fields = (
            "id",
            "number",
            "name_arabic",
            "name_transliteration",
            "name_en",
            "name_id",
            "revelation_type",
            "verse_count",
            "revelation_order",
        )


class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Translation
        fields = ("language", "translator", "text")


class WordRootSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordRoot
        fields = (
            "root_arabic",
            "root_transliteration",
            "meaning_en",
            "meaning_id",
        )


class WordSerializer(serializers.ModelSerializer):
    root = WordRootSerializer(read_only=True)

    class Meta:
        model = Word
        fields = (
            "id",
            "position",
            "arabic",
            "transliteration",
            "translation_en",
            "lemma",
            "root",
            "morphology_tag",
            "is_stopword",
        )


class VerseSerializer(serializers.ModelSerializer):
    surah_number = serializers.IntegerField(source="surah.number", read_only=True)
    verse_key = serializers.CharField(source="key", read_only=True)
    translations = TranslationSerializer(many=True, read_only=True)

    class Meta:
        model = Verse
        fields = (
            "id",
            "surah_number",
            "number",
            "verse_key",
            "text_uthmani",
            "juz_number",
            "page_number",
            "revelation_order",
            "translations",
        )


class VerseDetailSerializer(VerseSerializer):
    words = WordSerializer(many=True, read_only=True)

    class Meta(VerseSerializer.Meta):
        fields = VerseSerializer.Meta.fields + ("words",)


class SurahDetailSerializer(SurahSerializer):
    """Surah with its precomputed stats if available."""

    stats = serializers.SerializerMethodField()

    class Meta(SurahSerializer.Meta):
        fields = SurahSerializer.Meta.fields + ("stats",)

    def get_stats(self, obj: Surah) -> dict | None:
        stats = getattr(obj, "stats", None)
        if stats is None:
            return None
        return {
            "verse_count": stats.verse_count,
            "word_count": stats.word_count,
            "letter_count": stats.letter_count,
            "unique_word_count": stats.unique_word_count,
            "unique_root_count": stats.unique_root_count,
        }
