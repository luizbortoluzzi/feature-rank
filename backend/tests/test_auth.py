"""
JWT authentication endpoint tests.

Tests verify:
- POST /api/v1/auth/token/ with valid credentials returns 200 with access + refresh
- POST /api/v1/auth/token/ with wrong password returns 401
- POST /api/v1/auth/token/ with unknown username returns 401
- POST /api/v1/auth/token/ with missing fields returns 400
- POST /api/v1/auth/token/refresh/ with valid refresh token returns 200
- POST /api/v1/auth/token/refresh/ with invalid token returns 401
"""

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


class JWTTokenObtainTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="jwtuser",
            email="jwtuser@example.com",
            name="JWT User",
            password="strongpass123",
        )

    def test_valid_credentials_returns_200_with_tokens(self):
        """POST /api/v1/auth/token/ with correct credentials returns access and refresh tokens."""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"username": "jwtuser", "password": "strongpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        # JWT token responses are wrapped in the standard envelope
        payload = body.get("data", body)
        self.assertIn("access", payload)
        self.assertIn("refresh", payload)

    def test_wrong_password_returns_401(self):
        """POST /api/v1/auth/token/ with wrong password returns 401."""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"username": "jwtuser", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_unknown_username_returns_401(self):
        """POST /api/v1/auth/token/ with unknown username returns 401."""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"username": "doesnotexist", "password": "somepassword"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_missing_fields_returns_400(self):
        """POST /api/v1/auth/token/ with missing username returns 400."""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"password": "strongpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class JWTTokenRefreshTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="jwtrefreshuser",
            email="jwtrefresh@example.com",
            name="JWT Refresh",
            password="refreshpass123",
        )

    def _obtain_refresh_token(self):
        """Helper to obtain a valid refresh token."""
        response = self.client.post(
            "/api/v1/auth/token/",
            {"username": "jwtrefreshuser", "password": "refreshpass123"},
            format="json",
        )
        body = response.json()
        # Response is wrapped in the envelope: {"data": {"access": ..., "refresh": ...}, "meta": null}
        payload = body.get("data", body)
        return payload["refresh"]

    def test_valid_refresh_token_returns_200_with_new_access(self):
        """POST /api/v1/auth/token/refresh/ with valid refresh token returns new access token."""
        refresh_token = self._obtain_refresh_token()
        response = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        # Response is wrapped in the envelope
        payload = body.get("data", body)
        self.assertIn("access", payload)

    def test_invalid_refresh_token_returns_401(self):
        """POST /api/v1/auth/token/refresh/ with an invalid token returns 401."""
        response = self.client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh": "this.is.not.valid"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)
