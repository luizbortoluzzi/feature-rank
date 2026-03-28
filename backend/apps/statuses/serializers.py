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

    usage_count is a read-only annotation representing the number of feature
    requests currently assigned to this status. It is derived from the queryset
    annotation set in the selector and never accepted from the client.
    """

    usage_count = serializers.SerializerMethodField()

    def get_usage_count(self, obj) -> int:
        # Use the queryset annotation if available (set by the selector),
        # otherwise fall back to a direct count (e.g. after create/update).
        if hasattr(obj, "usage_count"):
            return obj.usage_count
        return obj.feature_requests.count()

    class Meta:
        model = Status
        fields = [
            "id",
            "name",
            "color",
            "description",
            "is_terminal",
            "is_active",
            "usage_count",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "usage_count", "created_at", "updated_at"]
