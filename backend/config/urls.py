from django.contrib import admin
from django.urls import include, path

from config.auth_views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
)
from config.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="health_check"),
    # JWT authentication
    path(
        "api/v1/auth/token/",
        CookieTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "api/v1/auth/token/refresh/",
        CookieTokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/v1/auth/logout/", LogoutView.as_view(), name="logout"),
    # Application API routes
    path("api/v1/", include("apps.users.urls")),
    path("api/v1/", include("apps.feature_requests.urls")),
    path("api/v1/", include("apps.categories.urls")),
    path("api/v1/", include("apps.statuses.urls")),
]
