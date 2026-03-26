"""
Views for the users app (transport layer).

Responsibilities:
- POST /api/users/register/ — user registration
- GET  /api/users/me/       — current authenticated user profile

Design rules:
- Views must remain thin. Permission checks, serializer invocation, and
  service/selector delegation only. No business logic.
- All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
See docs/engineering/backend/api-conventions.md for response format standards.
"""

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.serializers import UserMeSerializer, UserRegistrationSerializer


class RegisterView(APIView):
    """
    POST /api/users/register/

    Open endpoint — no authentication required.
    On success returns 201 Created with the created user's profile.
    """

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Users"],
        summary="Register a new user",
        description="Creates a new user account. Email is normalized to lowercase. Username must be unique.",
        request=UserRegistrationSerializer,
        responses={
            201: UserMeSerializer,
            400: OpenApiResponse(description="Validation error — duplicate email or missing fields."),
        },
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response_serializer = UserMeSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """
    GET /api/users/me/

    Returns the current authenticated user's profile.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Users"],
        summary="Get current authenticated user",
        description="Returns the profile of the currently authenticated user. Requires a valid Bearer token.",
        responses={
            200: UserMeSerializer,
            401: OpenApiResponse(description="Authentication credentials were not provided or are invalid."),
        },
    )
    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)
