"""Tests for auth + bookmarks/notes ownership scoping."""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.django_db


def _register_and_auth(api, username="reader"):
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


class TestAuth:
    def test_register_and_token(self, api):
        res = api.post(
            "/api/v1/auth/register/",
            {"username": "amir", "email": "a@x.io", "password": "Str0ng!pass9"},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["data"]["username"] == "amir"

    def test_me_requires_auth(self, api):
        assert api.get("/api/v1/auth/me/").status_code == 401


class TestBookmarks:
    def test_create_and_list_scoped_to_user(self, api, verse):
        _register_and_auth(api)
        created = api.post(
            "/api/v1/bookmarks/", {"verse": verse.id}, format="json"
        )
        assert created.status_code == 201
        listed = api.get("/api/v1/bookmarks/")
        assert listed.json()["meta"]["count"] == 1
        assert listed.json()["data"][0]["verse_key"] == "1:2"

    def test_other_user_cannot_see_bookmarks(self, api, verse):
        _register_and_auth(api, "owner")
        api.post("/api/v1/bookmarks/", {"verse": verse.id}, format="json")

        from rest_framework.test import APIClient

        other = _register_and_auth(APIClient(), "intruder")
        assert other.get("/api/v1/bookmarks/").json()["meta"]["count"] == 0
