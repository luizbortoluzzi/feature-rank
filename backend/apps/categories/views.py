"""
Views for the categories app (transport layer).

Responsibilities:
- Category reference data endpoints: list, detail, create, update, delete
- Read endpoints are public (AllowAny); write endpoints are admin-only.

Design rules:
- Views must remain thin. Permission checks, serializer invocation, and
  service/selector delegation only. No business logic.
- All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.categories.permissions import IsAdminOrReadOnly
from apps.categories.selectors import get_categories_list, get_category
from apps.categories.serializers import CategorySerializer
from apps.categories.services import create_category, delete_category, update_category
from config.pagination import StandardResultsPagination


@extend_schema_view(
    list=extend_schema(
        tags=["Categories"],
        summary="List all categories",
        description="Returns a paginated list of all categories. Public endpoint — no authentication required.",
        responses={200: CategorySerializer(many=True)},
    ),
    retrieve=extend_schema(
        tags=["Categories"],
        summary="Retrieve a category",
        description="Returns a single category by ID. Public endpoint.",
        responses={
            200: CategorySerializer,
            404: OpenApiResponse(description="Category not found."),
        },
    ),
    create=extend_schema(
        tags=["Categories"],
        summary="Create a category",
        description="Creates a new category. Admin only.",
        request=CategorySerializer,
        responses={
            201: CategorySerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin privileges required."),
        },
    ),
    partial_update=extend_schema(
        tags=["Categories"],
        summary="Update a category",
        description="Partially updates a category. Admin only. Only provided fields are updated.",
        request=CategorySerializer,
        responses={
            200: CategorySerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Category not found."),
        },
    ),
    destroy=extend_schema(
        tags=["Categories"],
        summary="Delete a category",
        description="Deletes a category. Admin only. Returns 400 if the category is referenced by any feature request.",
        responses={
            204: OpenApiResponse(description="Category deleted."),
            400: OpenApiResponse(description="Category is in use and cannot be deleted."),
            403: OpenApiResponse(description="Admin privileges required."),
            404: OpenApiResponse(description="Category not found."),
        },
    ),
)
class CategoryViewSet(ViewSet):
    """
    ViewSet for Category reference data.

    list, retrieve: public (AllowAny)
    create, partial_update, destroy: admin-only (IsAdminOrReadOnly)

    PUT is not supported — only PATCH for partial updates.
    """

    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        return [AllowAny(), IsAdminOrReadOnly()]

    def list(self, request):
        search = request.query_params.get("search") or None
        qs = get_categories_list(search=search)
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CategorySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            category = get_category(pk=pk)
        except Exception:
            raise NotFound()
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    def create(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = create_category(
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
            icon=serializer.validated_data.get("icon", ""),
            color=serializer.validated_data.get("color", ""),
            is_active=serializer.validated_data.get("is_active", True),
        )
        annotated = get_category(pk=category.pk)
        response_serializer = CategorySerializer(annotated)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        try:
            category = get_category(pk=pk)
        except Exception:
            raise NotFound()
        serializer = CategorySerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        update_category(
            category=category,
            name=serializer.validated_data.get("name"),
            description=serializer.validated_data.get("description"),
            icon=serializer.validated_data.get("icon"),
            color=serializer.validated_data.get("color"),
            is_active=serializer.validated_data.get("is_active"),
        )
        annotated = get_category(pk=category.pk)
        response_serializer = CategorySerializer(annotated)
        return Response(response_serializer.data)

    def destroy(self, request, pk=None):
        try:
            category = get_category(pk=pk)
        except Exception:
            raise NotFound()
        try:
            delete_category(category=category)
        except ValidationError:
            raise
        return Response(status=status.HTTP_204_NO_CONTENT)
