"""
Domain models for the categories app.

Category is a controlled reference entity. It must not be treated as a free-form
string. Category names must be unique. Deletion is restrictive when records are
referenced by feature requests.

Seeding strategy: categories are seeded via the seed_reference_data management
command which is idempotent and deterministic.

See docs/architecture/backend-architecture.md — Reference Data Strategy.
"""

from django.db import models


class Category(models.Model):
    """
    Controlled reference entity classifying a feature request by domain area.

    icon and color are UI metadata only — they must not drive business rules.
    Category deletion is restricted when any FeatureRequest references it
    (enforced via on_delete=PROTECT on the FK in FeatureRequest).
    """

    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=100)
    color = models.CharField(max_length=7)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
