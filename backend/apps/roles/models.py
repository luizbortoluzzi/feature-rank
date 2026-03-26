"""
Domain models for the roles app.

Role is a controlled reference entity. It must not be treated as a free-form
string. Role names must be unique. Deletion is restrictive when records are
referenced.

Seeding strategy: roles are seeded via the seed_reference_data management command
which is idempotent and deterministic.

See docs/architecture/backend-architecture.md — Reference Data Strategy.
"""

from django.db import models


class Role(models.Model):
    """
    Controlled reference entity for user permission groupings.

    Roles are pre-defined and seeded at deployment. There are no API endpoints
    for role management — use Django admin or the seed_reference_data command.
    """

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "roles"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
