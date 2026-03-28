"""
Serializers for the feature_requests app.

Responsibilities:
- Input validation and payload shaping for feature request create/update
- Output representation for API responses (list, detail)
- Protected field policy: author_id, vote_count, status_id must not be
  client-controllable in non-admin flows

Read serializers:
- FeatureRequestListSerializer: used in list and detail responses

Write serializers:
- FeatureRequestWriteSerializer: writable fields for creation and PATCH updates
  Writable: title, description, rate, category_id
  Never writable: author_id, status_id (on create), vote_count

Nested representations:
- AuthorSerializer: { id, name } — no email, no sensitive fields
- CategoryNestedSerializer: { id, name, icon, color }
- StatusNestedSerializer: { id, name, color, is_terminal }

See docs/engineering/backend/api-conventions.md for response field standards.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.categories.models import Category
from apps.feature_requests.models import FeatureRequest

User = get_user_model()


class AuthorSerializer(serializers.ModelSerializer):
    """Minimal nested author representation: id, name, and avatar_url. Never exposes email."""

    class Meta:
        model = User
        fields = ["id", "name", "avatar_url"]


class CategoryNestedSerializer(serializers.ModelSerializer):
    """Minimal nested category representation for feature request responses."""

    class Meta:
        model = Category
        fields = ["id", "name", "icon", "color"]


class StatusNestedSerializer(serializers.Serializer):
    """Minimal nested status representation for feature request responses."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    color = serializers.CharField()
    is_terminal = serializers.BooleanField()


class FeatureRequestListSerializer(serializers.ModelSerializer):
    """
    Read-only serializer used for list and detail responses.

    vote_count and has_voted are SerializerMethodFields that read from
    pre-annotated queryset attributes. No DB queries are made inside these
    methods — the queryset is always pre-annotated by the selector.
    """

    author = AuthorSerializer(read_only=True)
    category = CategoryNestedSerializer(read_only=True)
    status = StatusNestedSerializer(read_only=True)
    vote_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = FeatureRequest
        fields = [
            "id",
            "title",
            "description",
            "rate",
            "vote_count",
            "has_voted",
            "author",
            "category",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_vote_count(self, obj) -> int:
        # Reads the pre-annotated attribute — never triggers a DB query.
        return getattr(obj, "vote_count", 0)

    def get_has_voted(self, obj) -> bool:
        # Reads the pre-annotated attribute — never triggers a DB query.
        return bool(getattr(obj, "has_voted", False))


class FeatureRequestWriteSerializer(serializers.Serializer):
    """
    Write serializer for creating and PATCH-updating feature requests.

    Intentionally excludes author_id, status_id, and vote_count — these are
    never accepted from the client. category_id is validated against existing
    Category records.
    """

    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False)
    rate = serializers.IntegerField(required=False)
    category_id = serializers.IntegerField(required=False)

    def validate_rate(self, value: int) -> int:
        if value < 1 or value > 5:
            raise serializers.ValidationError("Must be an integer between 1 and 5.")
        return value

    def validate_category_id(self, value: int) -> int:
        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError(f"Category with id={value} does not exist.")
        return value
