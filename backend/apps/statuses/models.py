"""
Domain models for the statuses app.

Status is a controlled reference entity representing the lifecycle state of a
feature request. It must not be treated as a free-form string. Status names must
be unique. Deletion is restrictive when records are referenced by feature requests.

Seeding strategy: statuses are seeded via the seed_reference_data management
command which is idempotent and deterministic.

See docs/architecture/backend-architecture.md — Reference Data Strategy.
See docs/domain/voting-rules.md for voting behavior across statuses.
"""

from django.db import models


class Status(models.Model):
    """
    Controlled reference entity representing the lifecycle state of a feature request.

    is_terminal marks final states (completed, rejected). Voting is permitted
    on feature requests in any status, including terminal ones — is_terminal
    has no effect on vote eligibility.

    sort_order provides stable UI ordering. Unique per status record.

    Status deletion is restricted when any FeatureRequest references it
    (enforced via on_delete=PROTECT on the FK in FeatureRequest).
    """

    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7)
    description = models.TextField(blank=True, default="")
    is_terminal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "statuses"
        ordering = ["sort_order"]

    def __str__(self) -> str:
        return self.name
