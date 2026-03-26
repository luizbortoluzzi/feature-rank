"""
Views for the feature_requests app (transport layer).

Responsibilities:
- Feature request CRUD endpoints (list, retrieve, create, partial_update, destroy)
- Vote/unvote custom actions: POST/DELETE /api/features/{id}/vote/

What views own:
- Authentication entry point per request
- Permission enforcement
- Serializer invocation for input validation
- Delegation to services (writes) and selectors (reads)
- Query param validation (sort, filter params)
- Status code selection and response formatting

What views must NOT do:
- Implement ranking logic (belongs in selectors.py)
- Implement vote uniqueness logic (belongs in services.py + DB constraint)
- Embed repeated ORM queries (belongs in selectors.py)
- Assign author from client input

See docs/architecture/backend-architecture.md for layer responsibilities.
See docs/engineering/backend/api-conventions.md for response format standards.
"""

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema, extend_schema_view, inline_serializer
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.feature_requests.permissions import IsAuthorOrAdmin
from apps.feature_requests.selectors import VALID_SORT_VALUES, get_feature_request_detail, get_feature_requests_list
from apps.feature_requests.serializers import FeatureRequestListSerializer, FeatureRequestWriteSerializer
from apps.feature_requests.services import (
    create_feature_request,
    delete_feature_request,
    unvote_feature_request,
    update_feature_request,
    vote_feature_request,
)
from config.pagination import StandardResultsPagination


def _get_feature_request_or_404(pk, user=None):
    """Retrieve a feature request by pk with annotations, raising 404 if not found."""
    try:
        return get_feature_request_detail(pk=pk, user=user)
    except Exception:
        raise NotFound()


def _validate_sort_param(sort_value):
    """
    Validate the sort query parameter.
    - rate is never a permitted sort field.
    - Unknown sort values are rejected with 400.
    Returns None (no error) on valid sort, raises ValidationError otherwise.
    """
    if sort_value is None:
        return
    if sort_value in ("rate", "-rate"):
        raise ValidationError(
            {"sort": ["'rate' is not a permitted sort field. rate does not affect ranking."]}
        )
    if sort_value not in VALID_SORT_VALUES:
        raise ValidationError(
            {"sort": [f"'{sort_value}' is not a valid sort value. Permitted: {sorted(VALID_SORT_VALUES)}."]}
        )


def _parse_int_param(name: str, value: str):
    """
    Parse a query param that must be an integer. Returns int or None.
    Raises ValidationError with 400 if value is non-integer.
    """
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        raise ValidationError({name: [f"'{value}' is not a valid integer."]})


@extend_schema_view(
    list=extend_schema(
        tags=["Features"],
        summary="List feature requests",
        description=(
            "Returns a paginated list of feature requests ordered by vote_count desc, created_at desc, id desc. "
            "Supports filtering by category_id, status_id, author_id and sorting via the sort parameter. "
            "has_voted is always false for unauthenticated requests. "
            "sort=rate and sort=-rate are explicitly rejected with 400."
        ),
        parameters=[
            OpenApiParameter("sort", str, description="Sort order. Allowed: -vote_count, vote_count, -created_at, created_at. Default: -vote_count."),
            OpenApiParameter("category_id", int, description="Filter by category ID."),
            OpenApiParameter("status_id", int, description="Filter by status ID."),
            OpenApiParameter("author_id", int, description="Filter by author user ID."),
            OpenApiParameter("page", int, description="Page number (1-indexed). Default: 1."),
            OpenApiParameter("limit", int, description="Items per page. Max 100. Default: 20."),
        ],
        responses={
            200: FeatureRequestListSerializer(many=True),
            400: OpenApiResponse(description="Invalid sort value or non-integer filter parameter."),
        },
    ),
    retrieve=extend_schema(
        tags=["Features"],
        summary="Retrieve a feature request",
        description="Returns a single feature request with vote_count and has_voted annotations. Public endpoint.",
        responses={
            200: FeatureRequestListSerializer,
            404: OpenApiResponse(description="Feature request not found."),
        },
    ),
    create=extend_schema(
        tags=["Features"],
        summary="Submit a feature request",
        description=(
            "Creates a new feature request. Requires authentication. "
            "Author is derived from the authenticated session — author_id in the request body is silently ignored. "
            "Status defaults to 'open'. Submitting status_id as a non-admin returns 403."
        ),
        request=FeatureRequestWriteSerializer,
        responses={
            201: FeatureRequestListSerializer,
            400: OpenApiResponse(description="Validation error — missing fields or invalid rate/category."),
            401: OpenApiResponse(description="Authentication required."),
            403: OpenApiResponse(description="Non-admin submitted status_id."),
        },
    ),
    partial_update=extend_schema(
        tags=["Features"],
        summary="Update a feature request",
        description=(
            "Partially updates a feature request. Requires authentication. "
            "Only the author or an admin may update. "
            "status_id may only be changed by an admin. "
            "author_id is silently ignored if present."
        ),
        request=FeatureRequestWriteSerializer,
        responses={
            200: FeatureRequestListSerializer,
            400: OpenApiResponse(description="Validation error."),
            401: OpenApiResponse(description="Authentication required."),
            403: OpenApiResponse(description="Not the author or not admin."),
            404: OpenApiResponse(description="Feature request not found."),
        },
    ),
    destroy=extend_schema(
        tags=["Features"],
        summary="Delete a feature request",
        description=(
            "Deletes a feature request and all its associated votes (cascade). "
            "Only the author or an admin may delete."
        ),
        responses={
            204: OpenApiResponse(description="Deleted."),
            401: OpenApiResponse(description="Authentication required."),
            403: OpenApiResponse(description="Not the author or not admin."),
            404: OpenApiResponse(description="Feature request not found."),
        },
    ),
)
class FeatureRequestViewSet(ViewSet):
    """
    ViewSet for FeatureRequest resources.

    Endpoints:
    GET    /api/features/              list (public)
    POST   /api/features/              create (authenticated)
    GET    /api/features/{id}/         retrieve (public)
    PATCH  /api/features/{id}/         partial_update (authenticated, author or admin)
    DELETE /api/features/{id}/         destroy (authenticated, author or admin) → 204
    POST   /api/features/{id}/vote/    vote (authenticated) → 200
    DELETE /api/features/{id}/vote/    unvote (authenticated) → 200

    PUT is not supported.
    """

    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        if self.action in ("partial_update", "destroy"):
            return [IsAuthenticated(), IsAuthorOrAdmin()]
        if self.action in ("vote",):
            return [IsAuthenticated()]
        # create and any other action: require auth
        return [IsAuthenticated()]

    def list(self, request):
        sort = request.query_params.get("sort")
        _validate_sort_param(sort)

        category_id = _parse_int_param("category_id", request.query_params.get("category_id"))
        status_id = _parse_int_param("status_id", request.query_params.get("status_id"))
        author_id = _parse_int_param("author_id", request.query_params.get("author_id"))

        qs = get_feature_requests_list(
            user=request.user,
            category_id=category_id,
            status_id=status_id,
            author_id=author_id,
            sort=sort,
        )
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = FeatureRequestListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        feature_request = _get_feature_request_or_404(pk, user=request.user)
        serializer = FeatureRequestListSerializer(feature_request)
        return Response(serializer.data)

    def create(self, request):
        # Reject non-admin submitting status_id.
        if "status_id" in request.data and not (request.user.is_authenticated and request.user.is_admin):
            raise PermissionDenied("Only administrators may set status_id.")

        # author_id in request body is silently ignored per API contract.
        data = {k: v for k, v in request.data.items() if k != "author_id"}

        serializer = FeatureRequestWriteSerializer(data=data)
        # On create, title, description, rate, category_id are required.
        # Validate manually for required fields since the serializer has required=False.
        errors = {}
        for field in ("title", "description", "rate", "category_id"):
            if field not in data or data[field] in (None, ""):
                errors[field] = ["This field is required."]
        if errors:
            raise ValidationError(errors)

        serializer.is_valid(raise_exception=True)
        feature_request = create_feature_request(
            user=request.user,
            title=serializer.validated_data["title"],
            description=serializer.validated_data["description"],
            rate=serializer.validated_data["rate"],
            category_id=serializer.validated_data["category_id"],
        )
        # Fetch annotated version for consistent response shape.
        annotated = get_feature_request_detail(pk=feature_request.pk, user=request.user)
        response_serializer = FeatureRequestListSerializer(annotated)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        feature_request = _get_feature_request_or_404(pk, user=request.user)
        # Object-level permission check (IsAuthorOrAdmin).
        self.check_object_permissions(request, feature_request)

        # author_id is silently popped per API contract.
        data = {k: v for k, v in request.data.items() if k != "author_id"}

        # Reject non-admin submitting status_id.
        if "status_id" in data and not (request.user.is_authenticated and request.user.is_admin):
            raise PermissionDenied("Only administrators may set status_id.")

        serializer = FeatureRequestWriteSerializer(data=data, partial=True)
        serializer.is_valid(raise_exception=True)

        updated = update_feature_request(
            feature_request=feature_request,
            user=request.user,
            data={**serializer.validated_data},
        )
        annotated = get_feature_request_detail(pk=updated.pk, user=request.user)
        response_serializer = FeatureRequestListSerializer(annotated)
        return Response(response_serializer.data)

    def destroy(self, request, pk=None):
        feature_request = _get_feature_request_or_404(pk, user=request.user)
        self.check_object_permissions(request, feature_request)
        delete_feature_request(feature_request=feature_request)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        methods=["post"],
        tags=["Voting"],
        summary="Vote on a feature request",
        description=(
            "Casts a vote for the feature request. Idempotent — voting on an already-voted feature returns 200 with no error. "
            "Concurrent duplicate votes are handled safely via a database unique constraint. "
            "Returns the updated has_voted state and vote_count."
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                description="Vote recorded (or already existed).",
                response=inline_serializer("VoteResponse", fields={
                    "feature_request_id": serializers.IntegerField(),
                    "has_voted": serializers.BooleanField(),
                    "vote_count": serializers.IntegerField(),
                }),
            ),
            401: OpenApiResponse(description="Authentication required."),
            404: OpenApiResponse(description="Feature request not found."),
        },
    )
    @extend_schema(
        methods=["delete"],
        tags=["Voting"],
        summary="Remove vote from a feature request",
        description=(
            "Removes the authenticated user's vote from the feature request. "
            "Idempotent — unvoting a feature with no existing vote returns 200 with no error. "
            "Returns 200 OK with a body (not 204) per the API contract."
        ),
        request=None,
        responses={
            200: OpenApiResponse(
                description="Vote removed (or no vote existed).",
                response=inline_serializer("UnvoteResponse", fields={
                    "feature_request_id": serializers.IntegerField(),
                    "has_voted": serializers.BooleanField(),
                    "vote_count": serializers.IntegerField(),
                }),
            ),
            401: OpenApiResponse(description="Authentication required."),
            404: OpenApiResponse(description="Feature request not found."),
        },
    )
    @action(detail=True, methods=["post", "delete"], url_path="vote", permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        """
        POST   /api/features/{id}/vote/  — cast vote (idempotent, always 200)
        DELETE /api/features/{id}/vote/  — remove vote (idempotent, always 200)

        Both return: {"data": {"feature_request_id": int, "has_voted": bool, "vote_count": int}, "meta": null}
        """
        # get_object_or_404-equivalent using the selector (already annotated).
        try:
            from apps.feature_requests.models import FeatureRequest as FR
            feature_request = FR.objects.get(pk=pk)
        except Exception:
            raise NotFound()

        if request.method == "POST":
            result = vote_feature_request(feature_request=feature_request, user=request.user)
        else:  # DELETE
            result = unvote_feature_request(feature_request=feature_request, user=request.user)

        return Response({"data": result, "meta": None}, status=status.HTTP_200_OK)
