"""
Health check endpoint tests.

Tests verify:
- GET /api/v1/health/ returns 200
- Response body is {"data": {"status": "ok"}, "meta": null}
- No authentication required
"""

from django.test import TestCase
from rest_framework.test import APIClient


class HealthCheckTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200(self):
        """GET /api/v1/health/ returns HTTP 200."""
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)

    def test_health_check_response_body(self):
        """Response body is wrapped in the standard envelope with status=ok."""
        response = self.client.get("/api/v1/health/")
        body = response.json()
        self.assertIn("data", body)
        self.assertEqual(body["data"]["status"], "ok")
        self.assertIn("meta", body)
        self.assertIsNone(body["meta"])

    def test_health_check_no_authentication_required(self):
        """Unauthenticated request to health check returns 200."""
        unauthenticated_client = APIClient()
        response = unauthenticated_client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
