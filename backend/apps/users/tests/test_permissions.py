"""
Permission tests for the users app.

Tests verify:
- IsAdminUser permission class behavior for admin, non-admin, and anonymous users.
"""

from unittest.mock import MagicMock

from django.test import TestCase

from apps.users.models import User
from apps.users.permissions import IsAdminUser


def _make_request(user):
    request = MagicMock()
    request.user = user
    return request


class IsAppAdminUserPermissionTest(TestCase):
    def setUp(self):
        self.regular_user = User.objects.create_user(
            username="regperm",
            email="regperm@example.com",
            name="Regular",
            password="pass",
            is_admin=False,
        )
        self.admin_user = User.objects.create_user(
            username="adminperm",
            email="adminperm@example.com",
            name="Admin",
            password="pass",
            is_admin=True,
        )

    def test_authenticated_non_admin_returns_false(self):
        """Non-admin authenticated user does not have permission."""
        request = _make_request(self.regular_user)
        perm = IsAdminUser()
        self.assertFalse(perm.has_permission(request, None))

    def test_authenticated_admin_returns_true(self):
        """User with is_admin=True has permission."""
        request = _make_request(self.admin_user)
        perm = IsAdminUser()
        self.assertTrue(perm.has_permission(request, None))

    def test_unauthenticated_returns_false(self):
        """Anonymous/unauthenticated user does not have permission."""
        anon = MagicMock()
        anon.is_authenticated = False
        request = _make_request(anon)
        perm = IsAdminUser()
        self.assertFalse(perm.has_permission(request, None))
