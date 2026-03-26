"""
Project-level utility views.

Health check endpoint: GET /api/health/
- No authentication required.
- Returns a minimal status payload.
- Used by load balancers, container orchestrators, and CI smoke tests to
  verify the application process is running and can handle requests.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@extend_schema(
    tags=["Health"],
    summary="Health check",
    description="Returns 200 OK if the service is running. No authentication required.",
    responses={200: OpenApiResponse(description='{"data": {"status": "ok"}, "meta": null}')},
)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Lightweight liveness probe. Returns HTTP 200 with a stable payload.
    Does not check database connectivity — that would make this a readiness
    probe, which is a separate concern.
    """
    return Response({"status": "ok"})
