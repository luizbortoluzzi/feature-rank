"""
Serializer tests for the categories app.
"""

from django.test import TestCase

from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer


class CategorySerializerTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="UI", icon="palette", color="#3B82F6")

    def test_valid_data_serializes_correctly(self):
        """CategorySerializer includes id, name, icon, color, created_at in output."""
        data = CategorySerializer(self.category).data
        for field in ["id", "name", "icon", "color", "created_at"]:
            self.assertIn(field, data)

    def test_name_is_required_on_create(self):
        """Missing name field produces a validation error."""
        s = CategorySerializer(data={"icon": "code", "color": "#000"})
        self.assertFalse(s.is_valid())
        self.assertIn("name", s.errors)

    def test_icon_and_color_accept_non_empty_values(self):
        """Serializer is valid when icon and color are provided with non-empty values."""
        s = CategorySerializer(data={"name": "Minimal", "icon": "code", "color": "#FFFFFF"})
        self.assertTrue(s.is_valid(), s.errors)

    def test_read_serialization_returns_all_expected_fields(self):
        """Reading an existing category returns all documented fields."""
        data = CategorySerializer(self.category).data
        self.assertEqual(data["name"], "UI")
        self.assertEqual(data["icon"], "palette")
        self.assertEqual(data["color"], "#3B82F6")
        self.assertEqual(data["id"], self.category.pk)
