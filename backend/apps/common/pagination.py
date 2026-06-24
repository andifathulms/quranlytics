"""Pagination classes that emit the standard envelope."""
from __future__ import annotations

from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response


class EnvelopePageNumberPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data) -> Response:
        return Response(
            {
                "data": data,
                "meta": {
                    "count": self.page.paginator.count,
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
                "errors": [],
            }
        )


class VerseCursorPagination(CursorPagination):
    """Cursor pagination for verse lists, ordered by revelation order."""

    page_size = 50
    ordering = "revelation_order"

    def get_paginated_response(self, data) -> Response:
        return Response(
            {
                "data": data,
                "meta": {
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
                "errors": [],
            }
        )
