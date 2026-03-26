"""
Selector tests for the users app.

Tests verify:
- get_current_user returns the correct user
"""

from django.test import TestCase

from apps.users.models import User
from apps.users.selectors import get_current_user


class GetCurrentUserSelectorTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="selectoruser",
            email="selector@example.com",
            name="Selector User",
            password="pass123",
        )

    def test_returns_correct_user_by_pk(self):
        """get_current_user returns the user matching the given pk."""
        result = get_current_user(user=self.user)
        self.assertEqual(result.pk, self.user.pk)

    def test_returns_user_with_all_expected_fields_populated(self):
        """Returned user has email, name, username, and pk populated."""
        result = get_current_user(user=self.user)
        self.assertEqual(result.email, "selector@example.com")
        self.assertEqual(result.name, "Selector User")
        self.assertEqual(result.username, "selectoruser")
