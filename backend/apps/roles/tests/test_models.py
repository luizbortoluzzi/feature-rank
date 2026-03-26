"""
Model tests for the roles app.
"""

from django.db import IntegrityError
from django.test import TestCase

from apps.roles.models import Role


class RoleModelTest(TestCase):
    def test_name_field_is_unique(self):
        """Creating two roles with the same name raises IntegrityError."""
        Role.objects.create(name="admin_role")
        with self.assertRaises(IntegrityError):
            Role.objects.create(name="admin_role")

    def test_str_returns_name(self):
        """__str__ returns the role name."""
        role = Role.objects.create(name="member")
        self.assertEqual(str(role), "member")

    def test_description_can_be_blank(self):
        """Role can be created with a blank description without error."""
        role = Role.objects.create(name="no_description", description="")
        self.assertEqual(role.description, "")

    def test_created_at_set_automatically(self):
        """created_at is set automatically on creation."""
        role = Role.objects.create(name="timestamped_role")
        self.assertIsNotNone(role.created_at)
