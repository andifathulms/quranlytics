"""Rate-limited client for the quran.com API v4.

Enforces 1 request/second and retries on HTTP 429 with exponential backoff,
as required by the ingestion rules in CLAUDE.md.
"""
from __future__ import annotations

import time
from typing import Any, Iterator

import requests
from django.conf import settings


class QuranAPIClient:
    def __init__(
        self,
        base: str | None = None,
        rate_limit: float | None = None,
        max_retries: int = 5,
    ) -> None:
        self.base = (base or settings.QURAN_API_BASE).rstrip("/")
        self.rate_limit = (
            rate_limit
            if rate_limit is not None
            else settings.INGEST_RATE_LIMIT_SECONDS
        )
        self.max_retries = max_retries
        self._last_request = 0.0
        self._session = requests.Session()
        if settings.QURAN_API_KEY:
            self._session.headers["x-auth-token"] = settings.QURAN_API_KEY

    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_request
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)

    def get(self, path: str, **params: Any) -> dict[str, Any]:
        url = f"{self.base}/{path.lstrip('/')}"
        backoff = 1.0
        for attempt in range(1, self.max_retries + 1):
            self._throttle()
            resp = self._session.get(url, params=params, timeout=30)
            self._last_request = time.monotonic()

            if resp.status_code == 429:
                retry_after = float(resp.headers.get("Retry-After", backoff))
                time.sleep(retry_after)
                backoff = min(backoff * 2, 30)
                continue
            resp.raise_for_status()
            return resp.json()
        raise RuntimeError(
            f"Exceeded {self.max_retries} retries for {url} (rate limited)"
        )

    def paginate(
        self, path: str, *, results_key: str, **params: Any
    ) -> Iterator[dict[str, Any]]:
        """Yield records across all pages of a paginated endpoint."""
        page = 1
        while True:
            payload = self.get(path, page=page, per_page=50, **params)
            for record in payload.get(results_key, []):
                yield record
            pagination = payload.get("pagination") or {}
            next_page = pagination.get("next_page")
            if not next_page:
                break
            page = next_page
