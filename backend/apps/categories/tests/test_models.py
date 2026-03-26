"""
Model tests for the categories app.

Tests verify:
- name uniqueness constraint
- __str__ returns name
- blank icon and color are valid
- created_at auto-populated
"""

from django.db import IntegrityError
from django.test import TestCase

from apps.categories.models import Category


class CategoryModelTest(TestCase):
    def test_name_field_is_unique(self):
        """Creating two categories with the same name raises IntegrityError."""
        Category.objects.create(name="Unique Name", icon="icon", color="#000000")
        with self.assertRaises(IntegrityError):
            Category.objects.create(name="Unique Name", icon="other", color="#111111")

    def test_str_returns_name(self):
        """__str__ returns the category name."""
        cat = Category.objects.create(name="My Category", icon="", color="")
        self.assertEqual(str(cat), "My Category")

    def test_blank_icon_and_color_are_valid(self):
        """Icon and color can be blank strings without raising an error."""
        cat = Category.objects.create(name="Blank Fields", icon="", color="")
        self.assertEqual(cat.icon, "")
        self.assertEqual(cat.color, "")

    def test_created_at_is_set_automatically(self):
        """created_at is set automatically on creation and is not None."""
        cat = Category.objects.create(name="Timestamped", icon="", color="")
        self.assertIsNotNone(cat.created_at)
