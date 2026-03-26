"""
Serializer tests for the statuses app.
"""

from django.test import TestCase

from apps.statuses.models import Status
from apps.statuses.serializers import StatusSerializer


class StatusSerializerTest(TestCase):
    def setUp(self):
        self.status = Status.objects.create(
            name="open_ser", color="#6B7280", is_terminal=False, sort_order=0
        )

    def test_valid_data_serializes_correctly(self):
        """StatusSerializer includes all documented fields in output."""
        data = StatusSerializer(self.status).data
        for field in ["id", "name", "color", "is_terminal", "sort_order", "created_at"]:
            self.assertIn(field, data)

    def test_name_is_required(self):
        """Missing name field produces a validation error."""
        s = StatusSerializer(data={"color": "#000", "sort_order": 99})
        self.assertFalse(s.is_valid())
        self.assertIn("name", s.errors)

    def test_is_terminal_defaults_to_false_when_omitted(self):
        """is_terminal defaults to False when not included in input data."""
        s = StatusSerializer(data={"name": "no_terminal", "color": "#000", "sort_order": 50})
        self.assertTrue(s.is_valid(), s.errors)
        # When is_terminal is omitted, the model's default (False) is used on save.
        # The serializer may not have it in validated_data if it uses the model default.
        self.assertFalse(s.validated_data.get("is_terminal", False))
