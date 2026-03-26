from django.contrib import admin
from django.urls import include, path
from drf_spectacular.utils import OpenApiResponse, extend_schema
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config.views import health_check


class DocumentedTokenObtainPairView(TokenObtainPairView):
    pass


class DocumentedTokenRefreshView(TokenRefreshView):
    pass


extend_schema(
    tags=["Auth"],
    summary="Obtain JWT token pair",
    description=(
        "Exchange username and password for an access token and a refresh token. "
        "Access token lifetime: 15 minutes. Refresh token lifetime: 7 days."
    ),
    responses={
        200: OpenApiResponse(description='{"access": "...", "refresh": "..."}'),
        401: OpenApiResponse(description="Invalid credentials."),
    },
)(DocumentedTokenObtainPairView)

extend_schema(
    tags=["Auth"],
    summary="Refresh JWT access token",
    description=(
        "Exchange a valid refresh token for a new access token. "
        "If ROTATE_REFRESH_TOKENS is enabled, a new refresh token is also returned."
    ),
    responses={
        200: OpenApiResponse(description='{"access": "..."}'),
        401: OpenApiResponse(description="Refresh token is invalid or expired."),
    },
)(DocumentedTokenRefreshView)

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),
    # Health check — no auth required, used by load balancers and CI
    path("api/v1/health/", health_check, name="health_check"),
    # JWT authentication
    path("api/v1/auth/token/", DocumentedTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", DocumentedTokenRefreshView.as_view(), name="token_refresh"),
    # Application API routes
    path("api/v1/", include("apps.users.urls")),
    path("api/v1/", include("apps.feature_requests.urls")),
    path("api/v1/", include("apps.categories.urls")),
    path("api/v1/", include("apps.statuses.urls")),
    # OpenAPI schema + UI
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
