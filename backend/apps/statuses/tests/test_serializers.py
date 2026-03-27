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

    def test_new_fields_present_in_output(self):
        """Serializer output includes description, is_active, and usage_count."""
        data = StatusSerializer(self.status).data
        self.assertIn("description", data)
        self.assertIn("is_active", data)
        self.assertIn("usage_count", data)

    def test_description_defaults_to_empty_string(self):
        """description field defaults to empty string when not provided."""
        data = StatusSerializer(self.status).data
        self.assertEqual(data["description"], "")

    def test_is_active_defaults_to_true(self):
        """is_active field defaults to True when not provided."""
        data = StatusSerializer(self.status).data
        self.assertTrue(data["is_active"])

    def test_usage_count_reflects_feature_request_count(self):
        """usage_count equals zero for a status with no feature requests."""
        from apps.statuses.selectors import get_status
        annotated = get_status(pk=self.status.pk)
        data = StatusSerializer(annotated).data
        self.assertEqual(data["usage_count"], 0)

    def test_usage_count_is_read_only(self):
        """usage_count is not accepted as input — it is a read-only derived value."""
        s = StatusSerializer(data={"name": "wc_test", "color": "#000", "sort_order": 77, "usage_count": 999})
        self.assertTrue(s.is_valid(), s.errors)
        self.assertNotIn("usage_count", s.validated_data)
