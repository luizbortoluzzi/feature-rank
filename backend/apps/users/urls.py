from django.urls import path

from apps.users.views import MeView, RegisterView

urlpatterns = [
    path("users/register/", RegisterView.as_view(), name="user-register"),
    path("users/me/", MeView.as_view(), name="user-me"),
]
