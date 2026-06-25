"""Scoped rate throttles for public write / expensive endpoints.

Rates live in ``REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']`` keyed by scope.
``UserRateThrottle`` keys by user id when authenticated and by client IP for
anonymous requests, so a single class covers both.
"""
from __future__ import annotations

from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegisterRateThrottle(AnonRateThrottle):
    """Limit account-creation attempts per IP."""

    scope = "register"


class WriteRateThrottle(UserRateThrottle):
    """Limit content creation (e.g. publishing discoveries)."""

    scope = "write"


class VoteRateThrottle(UserRateThrottle):
    """Limit voting throughput."""

    scope = "vote"


class SemanticRateThrottle(UserRateThrottle):
    """Limit embedding-backed semantic search (compute-heavy)."""

    scope = "semantic"


class ProxyRateThrottle(UserRateThrottle):
    """Limit endpoints that proxy third-party services (tafsir)."""

    scope = "proxy"
