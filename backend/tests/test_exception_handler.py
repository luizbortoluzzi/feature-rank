"""
Exception handler tests.

Tests verify that the custom exception handler formats error responses
according to the documented error envelope:
    {"error": {"code": str, "message": str, "details": obj | null}}
"""

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User


def create_user():
    return User.objects.create_user(
        username="excuser", email="excuser@example.com", name="Exc", password="pass", is_admin=False
    )


def create_admin():
    return User.objects.create_user(
        username="excadmin",
        email="excadmin@example.com",
        name="Admin",
        password="pass",
        is_admin=True,
    )


class ExceptionHandlerTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_404_has_not_found_error_shape(self):
        """Requesting a non-existent resource returns the not_found error envelope."""
        response = self.client.get("/api/v1/categories/999999/")
        self.assertEqual(response.status_code, 404)
        body = response.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "not_found")
        self.assertIn("message", body["error"])
        self.assertIn("details", body["error"])

    def test_401_has_unauthorized_error_shape(self):
        """Accessing a protected endpoint without auth returns the unauthorized error envelope."""
        response = self.client.get("/api/v1/users/me/")
        self.assertEqual(response.status_code, 401)
        body = response.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "unauthorized")
        self.assertIn("message", body["error"])

    def test_403_has_forbidden_error_shape(self):
        """Non-admin trying to create a category returns the forbidden error envelope."""
        user = create_user()
        self.client.force_authenticate(user=user)
        response = self.client.post("/api/v1/categories/", {"name": "Test"}, format="json")
        self.assertEqual(response.status_code, 403)
        body = response.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "forbidden")

    def test_400_validation_error_has_validation_error_shape(self):
        """A validation error (400) returns the validation_error envelope with details."""
        admin = create_admin()
        self.client.force_authenticate(user=admin)
        # Missing name field triggers validation error
        response = self.client.post("/api/v1/categories/", {"icon": "code"}, format="json")
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "validation_error")
        self.assertIn("details", body["error"])
        self.assertIsNotNone(body["error"]["details"])

    def test_400_details_contains_field_level_errors(self):
        """The details field in a 400 response contains field-specific error information."""
        admin = create_admin()
        self.client.force_authenticate(user=admin)
        response = self.client.post("/api/v1/categories/", {"icon": "code"}, format="json")
        body = response.json()
        # details should contain field-level error for 'name'
        details = body["error"]["details"]
        self.assertIn("name", details)

    def test_no_stack_trace_in_error_responses(self):
        """Error responses must not expose stack traces or internal implementation details."""
        response = self.client.get("/api/v1/categories/999999/")
        body = response.json()
        # Ensure no Python traceback indicators are in the response
        body_str = str(body)
        self.assertNotIn("Traceback", body_str)
        self.assertNotIn('File "', body_str)
