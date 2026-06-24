from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        TrigramExtension(),
        migrations.CreateModel(
            name="Surah",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.IntegerField(unique=True)),
                ("name_arabic", models.CharField(max_length=50)),
                ("name_transliteration", models.CharField(max_length=100)),
                ("name_en", models.CharField(max_length=100)),
                ("name_id", models.CharField(max_length=100)),
                ("revelation_type", models.CharField(choices=[("Meccan", "Meccan"), ("Medinan", "Medinan")], max_length=10)),
                ("verse_count", models.IntegerField()),
                ("revelation_order", models.IntegerField()),
            ],
            options={"ordering": ["number"]},
        ),
        migrations.CreateModel(
            name="WordRoot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("root_arabic", models.CharField(max_length=20, unique=True)),
                ("root_transliteration", models.CharField(max_length=50)),
                ("meaning_en", models.CharField(blank=True, max_length=200)),
                ("meaning_id", models.CharField(blank=True, max_length=200)),
            ],
            options={"ordering": ["root_arabic"]},
        ),
        migrations.CreateModel(
            name="Verse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.IntegerField()),
                ("text_uthmani", models.TextField()),
                ("text_clean", models.TextField()),
                ("juz_number", models.IntegerField()),
                ("page_number", models.IntegerField()),
                ("revelation_order", models.IntegerField()),
                ("surah", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="verses", to="quran.surah")),
            ],
            options={"ordering": ["surah__number", "number"]},
        ),
        migrations.AddIndex(
            model_name="verse",
            index=models.Index(fields=["juz_number"], name="quran_verse_juz_num_idx"),
        ),
        migrations.AddIndex(
            model_name="verse",
            index=models.Index(fields=["revelation_order"], name="quran_verse_rev_ord_idx"),
        ),
        migrations.AddConstraint(
            model_name="verse",
            constraint=models.UniqueConstraint(fields=("surah", "number"), name="quran_verse_surah_number_uniq"),
        ),
        migrations.CreateModel(
            name="Translation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("language", models.CharField(choices=[("en", "English"), ("id", "Indonesian")], max_length=5)),
                ("translator", models.CharField(max_length=100)),
                ("text", models.TextField()),
                ("verse", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="translations", to="quran.verse")),
            ],
        ),
        migrations.AddIndex(
            model_name="translation",
            index=models.Index(fields=["language"], name="quran_trans_lang_idx"),
        ),
        migrations.AddConstraint(
            model_name="translation",
            constraint=models.UniqueConstraint(fields=("verse", "language", "translator"), name="quran_trans_verse_lang_translator_uniq"),
        ),
        migrations.CreateModel(
            name="Word",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("position", models.IntegerField()),
                ("arabic", models.CharField(max_length=100)),
                ("transliteration", models.CharField(blank=True, max_length=200)),
                ("translation_en", models.CharField(blank=True, max_length=200)),
                ("lemma", models.CharField(blank=True, max_length=100)),
                ("morphology_tag", models.CharField(blank=True, max_length=200)),
                ("is_stopword", models.BooleanField(default=False)),
                ("verse", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="words", to="quran.verse")),
                ("root", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="words", to="quran.wordroot")),
            ],
            options={"ordering": ["verse", "position"]},
        ),
        migrations.AddIndex(
            model_name="word",
            index=models.Index(fields=["lemma"], name="quran_word_lemma_idx"),
        ),
        migrations.AddIndex(
            model_name="word",
            index=models.Index(fields=["arabic"], name="quran_word_arabic_idx"),
        ),
        migrations.AddIndex(
            model_name="word",
            index=GinIndex(name="word_arabic_trgm_idx", fields=["arabic"], opclasses=["gin_trgm_ops"]),
        ),
        migrations.AddConstraint(
            model_name="word",
            constraint=models.UniqueConstraint(fields=("verse", "position"), name="quran_word_verse_position_uniq"),
        ),
        migrations.CreateModel(
            name="SurahStats",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("verse_count", models.IntegerField()),
                ("word_count", models.IntegerField()),
                ("letter_count", models.IntegerField()),
                ("unique_word_count", models.IntegerField()),
                ("unique_root_count", models.IntegerField()),
                ("computed_at", models.DateTimeField()),
                ("surah", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="stats", to="quran.surah")),
            ],
            options={"verbose_name_plural": "Surah stats"},
        ),
        migrations.CreateModel(
            name="WordFrequency",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("lemma", models.CharField(blank=True, db_index=True, max_length=100)),
                ("total_count", models.IntegerField()),
                ("surah_distribution", models.JSONField(default=dict)),
                ("computed_at", models.DateTimeField()),
                ("root", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="frequencies", to="quran.wordroot")),
            ],
            options={"verbose_name_plural": "Word frequencies"},
        ),
        migrations.AddIndex(
            model_name="wordfrequency",
            index=GinIndex(fields=["surah_distribution"], name="wordfreq_dist_gin"),
        ),
        migrations.AddIndex(
            model_name="wordfrequency",
            index=models.Index(fields=["total_count"], name="quran_wordfreq_total_idx"),
        ),
        migrations.AddConstraint(
            model_name="wordfrequency",
            constraint=models.UniqueConstraint(condition=models.Q(("root__isnull", True)), fields=("lemma",), name="uniq_frequency_per_lemma"),
        ),
        migrations.AddConstraint(
            model_name="wordfrequency",
            constraint=models.UniqueConstraint(condition=models.Q(("root__isnull", False)), fields=("root",), name="uniq_frequency_per_root"),
        ),
    ]
