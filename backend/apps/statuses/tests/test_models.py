"""
Model tests for the statuses app.
"""

from django.db import IntegrityError
from django.test import TestCase

from apps.statuses.models import Status


class StatusModelTest(TestCase):
    def _next_sort_order(self, base=1000):
        """Return a unique sort_order value for each test."""
        return Status.objects.count() + base

    def test_name_field_is_unique(self):
        """Creating two statuses with the same name raises IntegrityError."""
        Status.objects.create(name="open_unique", color="#000", is_terminal=False, sort_order=1)
        with self.assertRaises(IntegrityError):
            Status.objects.create(name="open_unique", color="#111", is_terminal=False, sort_order=2)

    def test_str_returns_name(self):
        """__str__ returns the status name."""
        s = Status.objects.create(name="str_test", color="#000", is_terminal=False, sort_order=10)
        self.assertEqual(str(s), "str_test")

    def test_is_terminal_defaults_to_false(self):
        """is_terminal defaults to False when not specified."""
        s = Status.objects.create(name="default_terminal", color="#000", sort_order=20)
        self.assertFalse(s.is_terminal)

    def test_created_at_is_set_automatically(self):
        """created_at is set automatically on creation."""
        s = Status.objects.create(
            name="timestamped_status", color="#000", is_terminal=False, sort_order=30
        )
        self.assertIsNotNone(s.created_at)
