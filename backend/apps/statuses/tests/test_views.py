"""
API view tests for the statuses app.

Tests all 5 endpoints with authentication, authorization, and response shape verification.
All URLs use /api/v1/ prefix.
"""

from django.test import TestCase
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest
from apps.statuses.models import Status
from apps.users.models import User

_sort_counter = [500]


def _next_sort():
    _sort_counter[0] += 1
    return _sort_counter[0]


def create_admin():
    return User.objects.create_user(
        username="statviewadmin",
        email="statviewadmin@example.com",
        name="Admin",
        password="pass",
        is_admin=True,
    )


def create_user():
    return User.objects.create_user(
        username="statviewuser",
        email="statviewuser@example.com",
        name="User",
        password="pass",
        is_admin=False,
    )


class StatusListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        Status.objects.create(
            name="open_viewlist", color="#6B7280", is_terminal=False, sort_order=_next_sort()
        )

    def test_get_returns_200_no_auth_required(self):
        """GET /api/v1/statuses/ returns 200 without authentication."""
        response = self.client.get("/api/v1/statuses/")
        self.assertEqual(response.status_code, 200)

    def test_response_is_paginated(self):
        """List response includes pagination meta with page, limit, total, total_pages."""
        response = self.client.get("/api/v1/statuses/")
        body = response.json()
        self.assertIn("data", body)
        self.assertIn("meta", body)
        meta = body["meta"]
        for field in ["page", "limit", "total", "total_pages"]:
            self.assertIn(field, meta)

    def test_list_response_includes_new_fields(self):
        """List response data items include description, is_active, and usage_count."""
        response = self.client.get("/api/v1/statuses/")
        body = response.json()
        item = body["data"][0]
        for field in ["description", "is_active", "usage_count"]:
            self.assertIn(field, item)

    def test_usage_count_is_integer(self):
        """usage_count in list response is a non-negative integer."""
        response = self.client.get("/api/v1/statuses/")
        body = response.json()
        item = body["data"][0]
        self.assertIsInstance(item["usage_count"], int)
        self.assertGreaterEqual(item["usage_count"], 0)


class StatusRetrieveViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.status = Status.objects.create(
            name="retrievable", color="#000", is_terminal=False, sort_order=_next_sort()
        )

    def test_get_existing_returns_200_no_auth(self):
        """GET /api/v1/statuses/{id}/ returns 200 without authentication."""
        response = self.client.get(f"/api/v1/statuses/{self.status.pk}/")
        self.assertEqual(response.status_code, 200)

    def test_unknown_id_returns_404(self):
        """GET for a non-existent status returns 404 with error envelope."""
        response = self.client.get("/api/v1/statuses/999999/")
        self.assertEqual(response.status_code, 404)
        body = response.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "not_found")


class StatusCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.user = create_user()

    def test_unauthenticated_returns_401(self):
        """POST /api/v1/statuses/ without auth returns 401."""
        response = self.client.post(
            "/api/v1/statuses/",
            {"name": "new_status", "color": "#000", "sort_order": _next_sort()},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_non_admin_returns_403(self):
        """POST /api/v1/statuses/ by non-admin returns 403."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/statuses/",
            {"name": "new_status", "color": "#000", "sort_order": _next_sort()},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_with_valid_data_returns_201(self):
        """POST /api/v1/statuses/ by admin with valid data returns 201."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/statuses/",
            {"name": "new_valid_status", "color": "#000", "sort_order": _next_sort()},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_admin_create_with_description_and_is_active(self):
        """POST with description and is_active persists those fields in the response."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/statuses/",
            {
                "name": "desc_active_status",
                "color": "#000",
                "sort_order": _next_sort(),
                "description": "A detailed description",
                "is_active": False,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["data"]["description"], "A detailed description")
        self.assertFalse(body["data"]["is_active"])

    def test_usage_count_not_accepted_from_client(self):
        """POST with usage_count in body does not set it — it is read-only."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/statuses/",
            {"name": "uc_reject", "color": "#000", "sort_order": _next_sort(), "usage_count": 999},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["data"]["usage_count"], 0)

    def test_admin_missing_name_returns_400(self):
        """POST /api/v1/statuses/ without name returns 400."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/statuses/", {"color": "#000", "sort_order": _next_sort()}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["error"]["code"], "validation_error")


class StatusUpdateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.user = create_user()
        self.status = Status.objects.create(
            name="patchable", color="#000000", is_terminal=False, sort_order=_next_sort()
        )

    def test_unauthenticated_returns_401(self):
        """PATCH /api/v1/statuses/{id}/ without auth returns 401."""
        response = self.client.patch(
            f"/api/v1/statuses/{self.status.pk}/", {"name": "X"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_non_admin_returns_403(self):
        """PATCH /api/v1/statuses/{id}/ by non-admin returns 403."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/v1/statuses/{self.status.pk}/", {"name": "X"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_patch_returns_200(self):
        """PATCH /api/v1/statuses/{id}/ by admin returns 200."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/v1/statuses/{self.status.pk}/", {"name": "patched_name"}, format="json"
        )
        self.assertEqual(response.status_code, 200)

    def test_unknown_id_returns_404(self):
        """PATCH for a non-existent status returns 404."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch("/api/v1/statuses/999999/", {"name": "X"}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_put_method_returns_405(self):
        """PUT is not supported — must return 405."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f"/api/v1/statuses/{self.status.pk}/", {"name": "X"}, format="json"
        )
        self.assertEqual(response.status_code, 405)


class StatusDeleteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.user = create_user()
        self.category = Category.objects.create(name="statdel_viewcat", icon="", color="")
        self.fr_user = User.objects.create_user(
            username="statdelfruser", email="statdelfruser@example.com", name="FR", password="pass"
        )

    def test_unauthenticated_returns_401(self):
        """DELETE /api/v1/statuses/{id}/ without auth returns 401."""
        s = Status.objects.create(
            name="del401_stat", color="#000", is_terminal=False, sort_order=_next_sort()
        )
        response = self.client.delete(f"/api/v1/statuses/{s.pk}/")
        self.assertEqual(response.status_code, 401)

    def test_non_admin_returns_403(self):
        """DELETE /api/v1/statuses/{id}/ by non-admin returns 403."""
        s = Status.objects.create(
            name="del403_stat", color="#000", is_terminal=False, sort_order=_next_sort()
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/v1/statuses/{s.pk}/")
        self.assertEqual(response.status_code, 403)

    def test_admin_delete_unused_status_returns_204(self):
        """DELETE by admin on unused status returns 204."""
        s = Status.objects.create(
            name="unused_stat", color="#000", is_terminal=False, sort_order=_next_sort()
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/v1/statuses/{s.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Status.objects.filter(pk=s.pk).exists())

    def test_admin_delete_in_use_status_returns_400(self):
        """DELETE by admin on a status referenced by a FeatureRequest returns 400."""
        s = Status.objects.create(
            name="inuse_stat", color="#000", is_terminal=False, sort_order=_next_sort()
        )
        FeatureRequest.objects.create(
            title="Ref",
            description="desc",
            rate=3,
            author=self.fr_user,
            category=self.category,
            status=s,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/v1/statuses/{s.pk}/")
        self.assertEqual(response.status_code, 400)

    def test_unknown_id_returns_404(self):
        """DELETE for a non-existent status returns 404."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete("/api/v1/statuses/999999/")
        self.assertEqual(response.status_code, 404)
