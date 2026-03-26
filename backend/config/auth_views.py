"""
Custom JWT auth views.

Implements a secure cookie-based token flow:
  - Access token returned in response body (short-lived, in-memory on frontend)
  - Refresh token stored in HttpOnly cookie (never exposed to JavaScript)

CSRF note: Access token is sent as Authorization Bearer header (not in a cookie),
so standard API endpoints are not CSRF-vulnerable. The refresh endpoint uses
SameSite=Lax on the cookie, which prevents cross-site POST attacks. No additional
CSRF enforcement is needed for this flow.
"""

import contextlib

from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth/"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=not settings.DEBUG,  # True in production, False in local dev
        samesite="Lax",
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path=REFRESH_COOKIE_PATH)


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/v1/auth/token/
    Authenticates with username + password.
    Returns access token in body; sets refresh token in HttpOnly cookie.
    """

    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0]) from e

        data = serializer.validated_data
        response = Response({"access": data["access"]})
        _set_refresh_cookie(response, data["refresh"])
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/token/refresh/
    Reads refresh token from HttpOnly cookie.
    Returns new access token in body; rotates refresh cookie if ROTATE_REFRESH_TOKENS=True.
    """

    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response(
                {
                    "error": {
                        "code": "token_not_found",
                        "message": "Refresh token cookie is missing.",
                        "details": None,
                    }
                },
                status=401,
            )

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0]) from e

        data = serializer.validated_data
        response = Response({"access": data["access"]})

        # Replace cookie when rotation is active
        if "refresh" in data:
            _set_refresh_cookie(response, data["refresh"])

        return response


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the refresh token and clears the cookie.
    AllowAny so that partially-authenticated clients can always log out.
    """

    permission_classes = [AllowAny]
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if refresh_token:
            with contextlib.suppress(TokenError):
                RefreshToken(refresh_token).blacklist()

        response = Response({"detail": "Logged out."})
        _clear_refresh_cookie(response)
        return response
