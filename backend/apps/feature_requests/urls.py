from rest_framework.routers import DefaultRouter

from apps.feature_requests.views import FeatureRequestViewSet

router = DefaultRouter()
router.register("features", FeatureRequestViewSet, basename="feature")
urlpatterns = router.urls
