"""
Serializers for the categories app.

Responsibilities:
- Input validation for admin-writable category fields
- Output representation for API responses

CategorySerializer is used for both read and admin write operations.
The category summary (id, name, icon, color) is used as a nested representation
inside feature request responses. It must remain a minimal, stable shape.
"""

from rest_framework import serializers

from apps.categories.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """
    Used for both read (list/retrieve) and admin write (create/update) operations.
    """

    class Meta:
        model = Category
        fields = ["id", "name", "icon", "color", "created_at"]
        read_only_fields = ["id", "created_at"]
