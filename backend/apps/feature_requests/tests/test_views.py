"""
API view tests for feature_requests app.

Tests verify:
- List endpoint accessible without auth, has_voted=false for unauthenticated
- Create endpoint requires auth
- Non-admin submitting status_id on create returns 403
- author_id in body is ignored on create — author is the authenticated user
- PATCH by non-author/non-admin returns 403
- DELETE by non-author/non-admin returns 403
- sort=rate returns 400
- sort=invalid returns 400
- category_id=abc returns 400
- POST vote → 200 (first time)
- POST vote → 200 (second time, idempotent)
- DELETE vote → 200 when no vote exists
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest
from apps.statuses.models import Status

User = get_user_model()


def create_user(username, email, password="testpass123", is_admin=False, name="Test"):
    return User.objects.create_user(
        username=username, email=email, password=password, is_admin=is_admin, name=name
    )


def create_category():
    return Category.objects.create(name="UI Test", icon="palette", color="#3B82F6")


def create_status(name="open", sort_order=0, is_terminal=False):
    return Status.objects.create(
        name=name, color="#6B7280", is_terminal=is_terminal, sort_order=sort_order
    )


def create_feature(user, category, status, title="Test Feature", rate=3):
    return FeatureRequest.objects.create(
        title=title,
        description="A test description",
        rate=rate,
        author=user,
        category=category,
        status=status,
    )


class FeatureRequestListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_user("listuser", "listuser@example.com")
        self.category = create_category()
        self.status = create_status()
        self.feature = create_feature(self.user, self.category, self.status)

    def test_unauthenticated_can_list_features(self):
        """GET /api/v1/features/ without auth returns 200."""
        response = self.client.get("/api/v1/features/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)

    def test_unauthenticated_list_has_voted_false_on_all_items(self):
        """
        For unauthenticated requests, has_voted must be False on all items.
        """
        response = self.client.get("/api/v1/features/")
        self.assertEqual(response.status_code, 200)
        for item in response.json()["data"]:
            self.assertFalse(item["has_voted"])

    def test_sort_by_rate_returns_400(self):
        """sort=rate must return 400. rate is never a permitted sort field."""
        response = self.client.get("/api/v1/features/?sort=rate")
        self.assertEqual(response.status_code, 400)

    def test_sort_by_negative_rate_returns_400(self):
        """sort=-rate must return 400."""
        response = self.client.get("/api/v1/features/?sort=-rate")
        self.assertEqual(response.status_code, 400)

    def test_invalid_sort_value_returns_400(self):
        """An unknown sort value returns 400."""
        response = self.client.get("/api/v1/features/?sort=invalid_sort")
        self.assertEqual(response.status_code, 400)

    def test_category_id_non_integer_returns_400(self):
        """category_id=abc (non-integer) must return 400."""
        response = self.client.get("/api/v1/features/?category_id=abc")
        self.assertEqual(response.status_code, 400)

    def test_list_is_paginated(self):
        """List response includes pagination meta."""
        response = self.client.get("/api/v1/features/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("meta", data)
        self.assertIn("total", data["meta"])
        self.assertIn("page", data["meta"])


class FeatureRequestCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_user("createuser", "create@example.com")
        self.other_user = create_user("other", "other@example.com")
        self.admin_user = create_user("admin", "admin@example.com", is_admin=True)
        self.category = create_category()
        self.status = create_status()

    def test_unauthenticated_create_returns_401(self):
        """POST /api/v1/features/ without auth returns 401."""
        response = self.client.post(
            "/api/v1/features/",
            {"title": "Test", "description": "Desc", "rate": 3, "category_id": self.category.pk},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_authenticated_create_succeeds(self):
        """Authenticated user can create a feature request. Returns 201."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/features/",
            {
                "title": "Test Feature",
                "description": "A description",
                "rate": 3,
                "category_id": self.category.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_non_admin_submitting_status_id_returns_403(self):
        """
        Non-admin submitting status_id in create request must receive 403.
        status_id is admin-only.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/features/",
            {
                "title": "Test",
                "description": "Desc",
                "rate": 3,
                "category_id": self.category.pk,
                "status_id": self.status.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_author_id_in_body_is_ignored_author_is_authenticated_user(self):
        """
        If author_id is provided in the request body, it must be silently ignored.
        The author of the created feature must be the authenticated user.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/v1/features/",
            {
                "title": "Auth Test",
                "description": "A description",
                "rate": 3,
                "category_id": self.category.pk,
                "author_id": self.other_user.pk,  # Should be silently ignored
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        fr = FeatureRequest.objects.get(title="Auth Test")
        self.assertEqual(fr.author, self.user)
        self.assertNotEqual(fr.author, self.other_user)


class FeatureRequestUpdateDeleteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.author = create_user("author", "author@example.com")
        self.non_author = create_user("nonauth", "nonauth@example.com")
        self.admin = create_user("adminedit", "adminedit@example.com", is_admin=True)
        self.category = create_category()
        self.status = create_status()
        self.feature = create_feature(self.author, self.category, self.status)

    def test_patch_by_non_author_non_admin_returns_403(self):
        """PATCH by a user who is neither the author nor an admin must return 403."""
        self.client.force_authenticate(user=self.non_author)
        response = self.client.patch(
            f"/api/v1/features/{self.feature.pk}/",
            {"title": "Hacked"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_patch_by_author_succeeds(self):
        """PATCH by the feature request author returns 200."""
        self.client.force_authenticate(user=self.author)
        response = self.client.patch(
            f"/api/v1/features/{self.feature.pk}/",
            {"title": "Updated Title"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_patch_by_admin_succeeds(self):
        """PATCH by an admin user returns 200."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/v1/features/{self.feature.pk}/",
            {"title": "Admin Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_delete_by_non_author_non_admin_returns_403(self):
        """DELETE by a user who is neither the author nor an admin must return 403."""
        self.client.force_authenticate(user=self.non_author)
        response = self.client.delete(f"/api/v1/features/{self.feature.pk}/")
        self.assertEqual(response.status_code, 403)

    def test_delete_by_author_returns_204(self):
        """DELETE by the feature request author returns 204."""
        self.client.force_authenticate(user=self.author)
        response = self.client.delete(f"/api/v1/features/{self.feature.pk}/")
        self.assertEqual(response.status_code, 204)


class VoteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_user("voteuser", "vote@example.com")
        self.category = create_category()
        self.status = create_status()
        self.feature = create_feature(self.user, self.category, self.status)

    def test_vote_first_time_returns_200(self):
        """POST /api/v1/features/{id}/vote/ returns 200 on first vote."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/v1/features/{self.feature.pk}/vote/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["data"]["has_voted"])
        self.assertEqual(data["data"]["vote_count"], 1)

    def test_vote_second_time_is_idempotent_returns_200(self):
        """
        POST /api/v1/features/{id}/vote/ a second time returns 200 with current state.
        No duplicate vote is created.
        """
        self.client.force_authenticate(user=self.user)
        self.client.post(f"/api/v1/features/{self.feature.pk}/vote/")
        response = self.client.post(f"/api/v1/features/{self.feature.pk}/vote/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["data"]["has_voted"])
        self.assertEqual(data["data"]["vote_count"], 1)

    def test_unvote_when_no_vote_exists_returns_200(self):
        """
        DELETE /api/v1/features/{id}/vote/ when no vote exists returns 200.
        Missing vote is not an error.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/v1/features/{self.feature.pk}/vote/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["data"]["has_voted"])

    def test_vote_response_shape(self):
        """Vote response must have data with feature_request_id, has_voted, vote_count."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/v1/features/{self.feature.pk}/vote/")
        data = response.json()
        self.assertIn("data", data)
        self.assertIn("meta", data)
        self.assertIsNone(data["meta"])
        self.assertIn("feature_request_id", data["data"])
        self.assertIn("has_voted", data["data"])
        self.assertIn("vote_count", data["data"])

    def test_unauthenticated_vote_returns_401(self):
        """Unauthenticated vote attempt must return 401."""
        response = self.client.post(f"/api/v1/features/{self.feature.pk}/vote/")
        self.assertEqual(response.status_code, 401)
