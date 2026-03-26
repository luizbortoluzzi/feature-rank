"""
Standard pagination class for all list endpoints.

Follows the API contract defined in docs/engineering/backend/api-conventions.md.
All list responses are paginated — no unbounded responses are permitted.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    page_query_param = "page"
    page_size_query_param = "limit"
    page_size = 20
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "data": data,
                "meta": {
                    "page": self.page.number,
                    "limit": self.get_page_size(self.request),
                    "total": self.page.paginator.count,
                    "total_pages": self.page.paginator.num_pages,
                },
            }
        )
