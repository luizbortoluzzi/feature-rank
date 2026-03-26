"""
Views for the statuses app (transport layer).

Responsibilities:
- Status reference data endpoints: list, detail, create, update, delete
- Read endpoints are public (AllowAny); write endpoints are admin-only.

Design rules:
- Views must remain thin. Permission checks, serializer invocation, and
  service/selector delegation only. No business logic.
- Status transition logic for feature requests belongs in
  apps.feature_requests.services, not here.
- All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.statuses.permissions import IsAdminOrReadOnly
from apps.statuses.selectors import get_status, get_statuses_list
from apps.statuses.serializers import StatusSerializer
from apps.statuses.services import create_status, delete_status, update_status
from config.pagination import StandardResultsPagination


@extend_schema_view(
    list=extend_schema(
        tags=["Statuses"],
        summary="List all statuses",
        description="Returns a paginated list of all feature request lifecycle statuses. Public endpoint.",
        responses={200: StatusSerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Statuses"],
        summary="Retrieve a status",
        description="Returns a single status by ID. Public endpoint.",
        responses={
            200: StatusSerializer,
            404: OpenApiResponse(description="Status not found."),
        },
    ),
    create=extend_schema(
        tags=["Statuses"],
        summary="Create a status",
        description="Creates a new lifecycle status. Admin only.",
        request=StatusSerializer,
        responses={
            201: StatusSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin privileges required."),
        },
    ),
    partial_update=extend_schema(
        tags=["Statuses"],
        summary="Update a status",
        description="Partially updates a status. Admin only.",
        request=StatusSerializer,
        responses={
            200: StatusSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Status not found."),
        },
    ),
    destroy=extend_schema(
        tags=["Statuses"],
        summary="Delete a status",
        description="Deletes a status. Admin only. Returns 400 if the status is referenced by any feature request.",
        responses={
            204: OpenApiResponse(description="Status deleted."),
            400: OpenApiResponse(description="Status is in use and cannot be deleted."),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Status not found."),
        },
    ),
)
class StatusViewSet(ViewSet):
    """
    ViewSet for Status reference data.

    list, retrieve: public (AllowAny)
    create, partial_update, destroy: admin-only (IsAdminOrReadOnly)

    PUT is not supported — only PATCH for partial updates.
    """

    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        return [AllowAny(), IsAdminOrReadOnly()]

    def list(self, request):
        qs = get_statuses_list()
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = StatusSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            status_obj = get_status(pk=pk)
        except Exception:
            raise NotFound()
        serializer = StatusSerializer(status_obj)
        return Response(serializer.data)

    def create(self, request):
        serializer = StatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status_obj = create_status(
            name=serializer.validated_data["name"],
            color=serializer.validated_data.get("color", ""),
            is_terminal=serializer.validated_data.get("is_terminal", False),
            sort_order=serializer.validated_data.get("sort_order", 0),
        )
        response_serializer = StatusSerializer(status_obj)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        try:
            status_obj = get_status(pk=pk)
        except Exception:
            raise NotFound()
        serializer = StatusSerializer(status_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = update_status(
            status=status_obj,
            name=serializer.validated_data.get("name"),
            color=serializer.validated_data.get("color"),
            is_terminal=serializer.validated_data.get("is_terminal"),
            sort_order=serializer.validated_data.get("sort_order"),
        )
        response_serializer = StatusSerializer(updated)
        return Response(response_serializer.data)

    def destroy(self, request, pk=None):
        try:
            status_obj = get_status(pk=pk)
        except Exception:
            raise NotFound()
        try:
            delete_status(status=status_obj)
        except ValidationError:
            raise
        return Response(status=status.HTTP_204_NO_CONTENT)
