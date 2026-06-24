"""Consistent API response envelope: ``{ data, meta, errors }``.

Every API response — success or error — uses this shape so the frontend can
handle them uniformly. Stack traces are never exposed.
"""
from __future__ import annotations

from typing import Any

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def envelope(
    data: Any = None,
    *,
    meta: dict[str, Any] | None = None,
    errors: list[Any] | None = None,
    status: int = 200,
    headers: dict[str, str] | None = None,
) -> Response:
    """Wrap a payload in the standard envelope and return a DRF Response."""
    return Response(
        {"data": data, "meta": meta or {}, "errors": errors or []},
        status=status,
        headers=headers or {},
    )


def envelope_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """DRF exception handler that wraps errors in the envelope shape."""
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data
    if isinstance(detail, dict) and "detail" in detail:
        errors = [{"message": str(detail["detail"]), "code": getattr(exc, "default_code", "error")}]
    elif isinstance(detail, dict):
        errors = [{"field": k, "message": str(v)} for k, v in detail.items()]
    else:
        errors = [{"message": str(detail)}]

    response.data = {"data": None, "meta": {}, "errors": errors}
    return response
