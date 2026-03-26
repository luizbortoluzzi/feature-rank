"""
API view tests for the users app.

Tests verify:
- POST /api/users/register/ with valid data returns 201
- POST /api/users/register/ with duplicate email returns 400
- GET /api/users/me/ without auth returns 401
- GET /api/users/me/ with valid auth returns 200 with user data
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class UserRegistrationViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_with_valid_data_returns_201(self):
        """POST /api/users/register/ with valid data creates a user and returns 201."""
        response = self.client.post(
            "/api/users/register/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "name": "New User",
                "password": "strongpassword123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(data["data"]["email"], "newuser@example.com")
        self.assertNotIn("password", data["data"])

    def test_register_with_duplicate_email_returns_400(self):
        """POST /api/users/register/ with an already-registered email returns 400."""
        User.objects.create_user(
            username="existing", email="existing@example.com", password="pass", name="Existing"
        )
        response = self.client.post(
            "/api/users/register/",
            {
                "username": "newuser2",
                "email": "existing@example.com",  # duplicate
                "name": "New User 2",
                "password": "strongpassword123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_register_normalizes_email_to_lowercase(self):
        """Email is normalized to lowercase on registration."""
        response = self.client.post(
            "/api/users/register/",
            {
                "username": "caseuser",
                "email": "CaseUser@EXAMPLE.COM",
                "name": "Case User",
                "password": "strongpassword123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["data"]["email"], "caseuser@example.com")

    def test_register_missing_required_fields_returns_400(self):
        """POST /api/users/register/ with missing required fields returns 400."""
        response = self.client.post(
            "/api/users/register/",
            {"email": "incomplete@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class UserMeViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="meuser", email="me@example.com", password="pass", name="Me User"
        )

    def test_me_without_auth_returns_401(self):
        """GET /api/users/me/ without authentication returns 401."""
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_with_valid_auth_returns_200_with_user_data(self):
        """GET /api/users/me/ with valid authentication returns 200 with user data."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertEqual(data["data"]["email"], "me@example.com")
        self.assertEqual(data["data"]["name"], "Me User")
        # password must never be in the response
        self.assertNotIn("password", data["data"])

    def test_me_response_shape(self):
        """GET /api/users/me/ response data contains expected fields."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/users/me/")
        data = response.json()["data"]
        for field in ["id", "username", "name", "email", "is_admin", "date_joined"]:
            self.assertIn(field, data)
