"""
Permission tests for the feature_requests app.

Tests verify:
- IsAuthorOrAdmin object-level permission
"""

from unittest.mock import MagicMock

from django.test import TestCase

from apps.feature_requests.permissions import IsAuthorOrAdmin
from apps.users.models import User


def _make_request(user):
    request = MagicMock()
    request.user = user
    return request


class IsAuthorOrAdminPermissionTest(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            username="permauthor", email="permauthor@example.com", name="Author", password="pass", is_admin=False
        )
        self.admin = User.objects.create_user(
            username="permadmin", email="permadmin@example.com", name="Admin", password="pass", is_admin=True
        )
        self.other = User.objects.create_user(
            username="permother", email="permother@example.com", name="Other", password="pass", is_admin=False
        )

    def _make_obj(self, author):
        obj = MagicMock()
        obj.author = author
        return obj

    def test_author_has_object_permission(self):
        """The feature request's author passes has_object_permission."""
        request = _make_request(self.author)
        obj = self._make_obj(self.author)
        perm = IsAuthorOrAdmin()
        self.assertTrue(perm.has_object_permission(request, None, obj))

    def test_admin_has_object_permission(self):
        """An admin user passes has_object_permission regardless of authorship."""
        request = _make_request(self.admin)
        obj = self._make_obj(self.author)  # admin is not the author
        perm = IsAuthorOrAdmin()
        self.assertTrue(perm.has_object_permission(request, None, obj))

    def test_unrelated_user_lacks_object_permission(self):
        """A user who is neither the author nor an admin fails has_object_permission."""
        request = _make_request(self.other)
        obj = self._make_obj(self.author)
        perm = IsAuthorOrAdmin()
        self.assertFalse(perm.has_object_permission(request, None, obj))
