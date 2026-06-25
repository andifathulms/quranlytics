#!/usr/bin/env python
"""End-to-end smoke test against a running Quranlytics API.

Exercises the full request path — reader, search, analytics, auth, and the
community flow (register -> create discovery -> vote -> profile) — over real
HTTP. Run after `seed_demo`. Exits non-zero on the first failed check.

Usage:
    SMOKE_BASE=http://127.0.0.1:8000/api/v1 python scripts/smoke.py
"""
from __future__ import annotations

import os
import sys
import uuid

import requests

BASE = os.environ.get("SMOKE_BASE", "http://127.0.0.1:8000/api/v1")
ROOT = BASE.rsplit("/api/", 1)[0]
checks = 0
failures = 0


def check(name: str, condition: bool, detail: str = "") -> None:
    global checks, failures
    checks += 1
    if condition:
        print(f"  ✓ {name}")
    else:
        failures += 1
        print(f"  ✗ {name} {detail}")


def main() -> int:
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"

    # ── Reader ──────────────────────────────────────────
    r = s.get(f"{ROOT}/health/", timeout=20)
    check("health", r.status_code == 200 and r.json()["data"]["status"] == "ok")

    r = s.get(f"{BASE}/surahs/", timeout=20)
    surahs = r.json()["data"]
    check("list surahs", r.status_code == 200 and len(surahs) >= 2, f"got {len(surahs)}")

    r = s.get(f"{BASE}/surahs/1/verses/", timeout=20)
    verses = r.json()["data"]
    check(
        "surah verses + translations",
        r.status_code == 200
        and len(verses) >= 1
        and any(t["language"] == "en" for t in verses[0]["translations"]),
    )

    # ── Search + analytics ──────────────────────────────
    r = s.get(f"{BASE}/search/", params={"q": "الحمد", "lang": "ar"}, timeout=20)
    check("arabic search", r.status_code == 200 and r.json()["meta"]["count"] >= 1)

    r = s.get(f"{BASE}/analytics/word-frequency/", params={"word": "الله"}, timeout=20)
    check(
        "word frequency", r.status_code == 200 and r.json()["data"]["total"] >= 1,
        str(r.json().get("data")),
    )

    r = s.get(f"{BASE}/analytics/surah-stats/", timeout=20)
    check("surah stats list", r.status_code == 200 and len(r.json()["data"]["surahs"]) >= 2)

    # ── Auth + community ────────────────────────────────
    uname = f"smoke_{uuid.uuid4().hex[:10]}"
    r = s.post(
        f"{BASE}/auth/register/",
        json={"username": uname, "password": "Sm0ke!pass99"},
        timeout=20,
    )
    check("register", r.status_code == 201)

    r = s.post(
        f"{BASE}/auth/token/",
        json={"username": uname, "password": "Sm0ke!pass99"},
        timeout=20,
    )
    token = r.json().get("access")
    check("token", r.status_code == 200 and bool(token))
    s.headers["Authorization"] = f"Bearer {token}"

    r = s.post(
        f"{BASE}/discoveries/",
        json={"title": "Smoke finding", "body": "via smoke test", "category": "Other"},
        timeout=20,
    )
    did = r.json()["data"]["id"]
    check("create discovery", r.status_code == 201)

    r = s.post(f"{BASE}/discoveries/{did}/vote/", json={"value": 1}, timeout=20)
    check("vote", r.status_code == 200 and r.json()["data"]["vote_score"] == 1)

    r = s.get(f"{BASE}/discoveries/", timeout=20)
    check("discovery feed", r.status_code == 200 and r.json()["meta"]["count"] >= 1)

    r = s.get(f"{BASE}/profiles/{uname}/", timeout=20)
    check(
        "public profile",
        r.status_code == 200 and r.json()["data"]["discovery_count"] >= 1,
    )

    print(f"\n{checks - failures}/{checks} checks passed.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
