"""
API view tests for the categories app.

Tests all 5 endpoints with authentication, authorization, and response shape verification.
All URLs use /api/v1/ prefix.
"""

from django.test import TestCase
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest
from apps.statuses.models import Status
from apps.users.models import User


def create_admin():
    return User.objects.create_user(
        username="catadmin",
        email="catadmin@example.com",
        name="Admin",
        password="pass",
        is_admin=True,
    )


def create_user():
    return User.objects.create_user(
        username="catuser",
        email="catuser@example.com",
        name="User",
        password="pass",
        is_admin=False,
    )


class CategoryListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        Category.objects.create(name="UITest", icon="palette", color="#3B82F6")

    def test_get_returns_200_no_auth_required(self):
        """GET /api/v1/categories/ returns 200 without authentication."""
        response = self.client.get("/api/v1/categories/")
        self.assertEqual(response.status_code, 200)

    def test_response_shape_has_data_and_meta(self):
        """List response contains data array and meta pagination fields."""
        response = self.client.get("/api/v1/categories/")
        body = response.json()
        self.assertIn("data", body)
        self.assertIn("meta", body)
        self.assertIsInstance(body["data"], list)

    def test_empty_list_returns_data_array_not_blank(self):
        """When no categories exist, response data is [] not blank."""
        Category.objects.all().delete()
        response = self.client.get("/api/v1/categories/")
        body = response.json()
        self.assertEqual(body["data"], [])

    def test_meta_contains_pagination_fields(self):
        """Pagination meta contains page, limit, total, total_pages."""
        response = self.client.get("/api/v1/categories/")
        meta = response.json()["meta"]
        for field in ["page", "limit", "total", "total_pages"]:
            self.assertIn(field, meta)


class CategoryRetrieveViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Retrieve", icon="icon", color="#000000")

    def test_get_existing_returns_200_no_auth(self):
        """GET /api/v1/categories/{id}/ returns 200 without authentication."""
        response = self.client.get(f"/api/v1/categories/{self.category.pk}/")
        self.assertEqual(response.status_code, 200)

    def test_unknown_id_returns_404_with_error_envelope(self):
        """GET for a non-existent category returns 404 with error envelope."""
        response = self.client.get("/api/v1/categories/999999/")
        self.assertEqual(response.status_code, 404)
        body = response.json()
        self.assertIn("error", body)
        self.assertEqual(body["error"]["code"], "not_found")


class CategoryCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.user = create_user()

    def test_unauthenticated_returns_401(self):
        """POST /api/v1/categories/ without auth returns 401."""
        response = self.client.post("/api/v1/categories/", {"name": "New Cat"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_non_admin_returns_403(self):
        """POST /api/v1/categories/ by non-admin returns 403."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/v1/categories/", {"name": "New Cat"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_admin_with_valid_data_returns_201(self):
        """POST /api/v1/categories/ by admin with valid data returns 201."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/v1/categories/",
            {"name": "New Category", "icon": "code", "color": "#000"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_admin_with_missing_name_returns_400(self):
        """POST /api/v1/categories/ without name returns 400 with validation_error code."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/v1/categories/", {"icon": "code"}, format="json")
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["error"]["code"], "validation_error")

    def test_admin_duplicate_name_returns_400(self):
        """POST /api/v1/categories/ with duplicate name returns 400."""
        Category.objects.create(name="DuplicateName", icon="", color="")
        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/v1/categories/", {"name": "DuplicateName"}, format="json")
        self.assertEqual(response.status_code, 400)


class CategoryUpdateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.user = create_user()
        self.category = Category.objects.create(name="Updatable", icon="old", color="#000000")

    def test_unauthenticated_returns_401(self):
        """PATCH /api/v1/categories/{id}/ without auth returns 401."""
        response = self.client.patch(
            f"/api/v1/categories/{self.category.pk}/", {"name": "X"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_non_admin_returns_403(self):
        """PATCH /api/v1/categories/{id}/ by non-admin returns 403."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/v1/categories/{self.category.pk}/", {"name": "X"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_patch_returns_200_and_only_updates_given_fields(self):
        """PATCH by admin returns 200 and only the supplied field changes."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/v1/categories/{self.category.pk}/", {"name": "Updated Name"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, "Updated Name")
        # icon should remain unchanged
        self.assertEqual(self.category.icon, "old")

    def test_unknown_id_returns_404(self):
        """PATCH for a non-existent category returns 404."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch("/api/v1/categories/999999/", {"name": "X"}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_put_method_returns_405(self):
        """PUT is not supported — must return 405."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f"/api/v1/categories/{self.category.pk}/", {"name": "X"}, format="json"
        )
        self.assertEqual(response.status_code, 405)


class CategoryDeleteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = create_admin()
        self.user = create_user()
        self.status = Status.objects.create(
            name="open_catdelview", color="#000", is_terminal=False, sort_order=300
        )
        self.fr_user = User.objects.create_user(
            username="catfruser", email="catfruser@example.com", name="FR", password="pass"
        )

    def test_unauthenticated_returns_401(self):
        """DELETE /api/v1/categories/{id}/ without auth returns 401."""
        cat = Category.objects.create(name="ToDelete401", icon="", color="")
        response = self.client.delete(f"/api/v1/categories/{cat.pk}/")
        self.assertEqual(response.status_code, 401)

    def test_non_admin_returns_403(self):
        """DELETE /api/v1/categories/{id}/ by non-admin returns 403."""
        cat = Category.objects.create(name="ToDelete403", icon="", color="")
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/v1/categories/{cat.pk}/")
        self.assertEqual(response.status_code, 403)

    def test_admin_delete_unused_category_returns_204(self):
        """DELETE by admin on unused category returns 204 and removes the record."""
        cat = Category.objects.create(name="Unused", icon="", color="")
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/v1/categories/{cat.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Category.objects.filter(pk=cat.pk).exists())

    def test_admin_delete_in_use_category_returns_400(self):
        """DELETE by admin on a category referenced by a FeatureRequest returns 400."""
        cat = Category.objects.create(name="InUseView", icon="", color="")
        FeatureRequest.objects.create(
            title="Ref",
            description="desc",
            rate=3,
            author=self.fr_user,
            category=cat,
            status=self.status,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/v1/categories/{cat.pk}/")
        self.assertEqual(response.status_code, 400)

    def test_unknown_id_returns_404(self):
        """DELETE for a non-existent category returns 404."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete("/api/v1/categories/999999/")
        self.assertEqual(response.status_code, 404)
