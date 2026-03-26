from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.feature_requests.urls")),
    path("api/", include("apps.categories.urls")),
    path("api/", include("apps.statuses.urls")),
]
