"""
Domain models for the feature_requests app.

This app owns:
- FeatureRequest model
- Vote model
- All relationships between them, and to User, Category, Status

Key domain invariants enforced at the model/database layer:

FeatureRequest:
- author is always the authenticated user at creation time; never client-supplied
- rate must be in range 1..5 (enforced via serializer validation + model validator)
- category and status are foreign keys to controlled reference entities
- vote_count is NOT stored on FeatureRequest; it is annotated at query time
  (see selectors.py). Storing it would require a documented denormalization decision.
- No default Meta ordering — the selector always applies explicit ordering.

Vote:
- A user can cast at most one vote per feature request.
- Uniqueness enforced at TWO layers:
    1. Service layer: existence check before insert (get_or_create)
    2. Database layer: unique_together on (user, feature_request)
  Both are required. The database constraint is the concurrency safety net.
- Votes carry equal weight regardless of user attributes.
- Voting is permitted on feature requests in any status, including terminal ones.

See docs/domain/voting-rules.md for authoritative voting behavior.
See docs/architecture/backend-architecture.md — Constraint Strategy.
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class FeatureRequest(models.Model):
    """
    The central entity. Represents a product improvement idea.

    vote_count is never stored here — it is always computed via COUNT annotation
    in the selector. rate is author self-assessment only and must NEVER appear
    in any sort expression.
    """

    title = models.CharField(max_length=255)
    description = models.TextField()
    rate = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="feature_requests",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.PROTECT,
        related_name="feature_requests",
    )
    status = models.ForeignKey(
        "statuses.Status",
        on_delete=models.PROTECT,
        related_name="feature_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "feature_requests"
        # No default ordering — the selector always applies explicit ordering:
        # vote_count desc -> created_at desc -> id desc

    def __str__(self) -> str:
        return self.title


class Vote(models.Model):
    """
    Represents a user's upvote on a feature request.

    The unique_together constraint on (user, feature_request) is MANDATORY.
    It prevents duplicate votes under concurrent requests even when the
    service-layer existence check is bypassed. Do not remove this constraint.

    Vote is immutable — no update operations exist on this entity.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    feature_request = models.ForeignKey(
        FeatureRequest,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votes"
        unique_together = [("user", "feature_request")]

    def __str__(self) -> str:
        return f"{self.user_id} → {self.feature_request_id}"
