"""Tests for community discoveries: CRUD, voting, profiles, ownership."""
from __future__ import annotations

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def _auth(api, username="reader"):
    api.post(
        "/api/v1/auth/register/",
        {"username": username, "email": f"{username}@x.io", "password": "Str0ng!pass9"},
        format="json",
    )
    token = api.post(
        "/api/v1/auth/token/",
        {"username": username, "password": "Str0ng!pass9"},
        format="json",
    ).json()["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api


def _create(api, title="Finding", **extra):
    payload = {"title": title, "body": "details", "category": "Numerical", **extra}
    return api.post("/api/v1/discoveries/", payload, format="json")


class TestDiscoveryCRUD:
    def test_create_requires_auth(self, api):
        assert _create(api).status_code == 401

    def test_create_and_feed(self, api):
        _auth(api)
        res = _create(api, title="365 days")
        assert res.status_code == 201
        assert res.json()["data"]["author_username"] == "reader"

        feed = api.get("/api/v1/discoveries/")
        assert feed.json()["meta"]["count"] == 1
        assert feed.json()["data"][0]["title"] == "365 days"

    def test_private_hidden_from_feed(self, api):
        _auth(api)
        _create(api, is_public=False)
        assert api.get("/api/v1/discoveries/").json()["meta"]["count"] == 0

    def test_only_author_can_edit(self, api):
        _auth(api, "owner")
        did = _create(api).json()["data"]["id"]

        other = _auth(APIClient(), "intruder")
        res = other.patch(
            f"/api/v1/discoveries/{did}/", {"title": "hijacked"}, format="json"
        )
        assert res.status_code in (403, 404)


class TestVoting:
    def test_vote_updates_score(self, api):
        _auth(api, "author")
        did = _create(api).json()["data"]["id"]

        voter = _auth(APIClient(), "voter")
        res = voter.post(
            f"/api/v1/discoveries/{did}/vote/", {"value": 1}, format="json"
        )
        assert res.status_code == 200
        assert res.json()["data"]["vote_score"] == 1

        # Changing the vote to a downvote moves the score to -1, not -2.
        res = voter.post(
            f"/api/v1/discoveries/{did}/vote/", {"value": -1}, format="json"
        )
        assert res.json()["data"]["vote_score"] == -1

        # value 0 removes the vote.
        res = voter.post(
            f"/api/v1/discoveries/{did}/vote/", {"value": 0}, format="json"
        )
        assert res.json()["data"]["vote_score"] == 0

    def test_my_vote_reflected_in_feed(self, api):
        _auth(api, "author")
        did = _create(api).json()["data"]["id"]
        voter = _auth(APIClient(), "voter")
        voter.post(f"/api/v1/discoveries/{did}/vote/", {"value": 1}, format="json")

        feed = voter.get("/api/v1/discoveries/")
        assert feed.json()["data"][0]["my_vote"] == 1


class TestProfile:
    def test_public_profile(self, api):
        _auth(api, "scholar")
        _create(api, title="A")
        _create(api, title="B", is_public=False)

        res = api.get("/api/v1/profiles/scholar/")
        assert res.status_code == 200
        # Only the public discovery is listed.
        assert res.json()["data"]["discovery_count"] == 1

    def test_unknown_user(self, api):
        assert api.get("/api/v1/profiles/ghost/").status_code == 404
