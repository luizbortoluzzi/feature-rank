"""
Serializers for the statuses app.

Responsibilities:
- Input validation for admin-writable status fields
- Output representation for API responses

The status summary (id, name, color, is_terminal) is used as a nested
representation inside feature request responses. It must remain a minimal,
stable shape.

Note: is_terminal is a display hint for the frontend. It does not affect
backend vote or ranking behavior.
"""

from rest_framework import serializers

from apps.statuses.models import Status


class StatusSerializer(serializers.ModelSerializer):
    """
    Used for both read (list/retrieve) and admin write (create/update) operations.
    """

    class Meta:
        model = Status
        fields = ["id", "name", "color", "is_terminal", "sort_order", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
