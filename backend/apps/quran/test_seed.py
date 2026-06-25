"""Test the network-free seed_demo command used by the CI smoke job."""
from __future__ import annotations

import pytest
from django.core.management import call_command

pytestmark = pytest.mark.django_db


def test_seed_demo_populates_minimal_dataset():
    call_command("seed_demo")

    from apps.quran.models import Surah, Translation, Verse, Word, WordFrequency
    from apps.quran.models import SurahStats

    assert Surah.objects.count() == 2
    assert Verse.objects.count() == 5
    assert Word.objects.exists()
    # EN + ID translations for every verse.
    assert Translation.objects.filter(language="en").count() == 5
    assert Translation.objects.filter(language="id").count() == 5
    # Materialised tables built.
    assert SurahStats.objects.count() == 2
    assert WordFrequency.objects.exists()


def test_seed_demo_is_idempotent():
    call_command("seed_demo")
    call_command("seed_demo")
    from apps.quran.models import Surah, Verse

    assert Surah.objects.count() == 2
    assert Verse.objects.count() == 5
