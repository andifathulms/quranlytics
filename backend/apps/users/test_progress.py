"""Tests for reading progress (resume, streak, completion)."""
from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone

pytestmark = pytest.mark.django_db


@pytest.fixture
def auth_client():
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    user = get_user_model().objects.create_user(username="reader", password="x")
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")
    return c, user


class TestReadingProgress:
    def test_get_creates_empty_state(self, auth_client):
        c, _ = auth_client
        res = c.get("/api/v1/progress/")
        assert res.status_code == 200
        assert res.json()["data"]["streak_count"] == 0

    def test_post_records_position_and_streak(self, auth_client, surah):
        c, _ = auth_client
        res = c.post("/api/v1/progress/", {"surah": 1, "verse": 5}, format="json")
        d = res.json()["data"]
        assert d["last_verse_key"] == "1:5"
        assert d["streak_count"] == 1
        assert d["started_count"] == 1

    def test_completed_when_furthest_reaches_length(self, auth_client, surah):
        # Fixture surah 1 has verse_count 7 → reaching verse 7 completes it.
        c, _ = auth_client
        c.post("/api/v1/progress/", {"surah": 1, "verse": 7}, format="json")
        res = c.get("/api/v1/progress/")
        assert res.json()["data"]["completed_count"] == 1

    def test_streak_increments_across_consecutive_days(self, auth_client):
        from apps.users.models import ReadingState

        c, user = auth_client
        c.post("/api/v1/progress/", {"surah": 1, "verse": 1}, format="json")
        # Simulate yesterday's read, then read again today → streak 2.
        st = ReadingState.objects.get(user=user)
        st.last_read_date = timezone.localdate() - timedelta(days=1)
        st.streak_count = 1
        st.save()
        res = c.post("/api/v1/progress/", {"surah": 2, "verse": 1}, format="json")
        assert res.json()["data"]["streak_count"] == 2

    def test_post_validates_input(self, auth_client):
        c, _ = auth_client
        assert c.post("/api/v1/progress/", {"surah": 200, "verse": 1}, format="json").status_code == 400
        assert c.post("/api/v1/progress/", {"verse": 1}, format="json").status_code == 400

    def test_requires_auth(self):
        from rest_framework.test import APIClient

        assert APIClient().get("/api/v1/progress/").status_code in (401, 403)


class TestDailyGoal:
    def test_patch_sets_goal_clamped(self, auth_client):
        c, _ = auth_client
        res = c.patch("/api/v1/progress/", {"daily_goal": 10}, format="json")
        assert res.status_code == 200
        assert res.json()["data"]["daily_goal"] == 10
        assert (
            c.patch(
                "/api/v1/progress/", {"daily_goal": 99999}, format="json"
            ).json()["data"]["daily_goal"]
            == 1000
        )

    def test_today_ayahs_counts_new_ground_and_meets_goal(self, auth_client, surah):
        c, _ = auth_client
        c.patch("/api/v1/progress/", {"daily_goal": 5}, format="json")
        res = c.post("/api/v1/progress/", {"surah": 1, "verse": 5}, format="json")
        d = res.json()["data"]
        assert d["today_ayahs"] == 5
        assert d["goal_met"] is True

    def test_rereading_does_not_double_count(self, auth_client, surah):
        c, _ = auth_client
        c.post("/api/v1/progress/", {"surah": 1, "verse": 5}, format="json")
        res = c.post("/api/v1/progress/", {"surah": 1, "verse": 3}, format="json")
        assert res.json()["data"]["today_ayahs"] == 5
