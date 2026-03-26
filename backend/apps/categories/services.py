"""
Services for the categories app (application layer).

Responsibilities:
- Category reference data mutation: create, update, safe deletion
- Deletion checks for references before proceeding (restrictive delete policy)

Design rules:
- Services accept explicit arguments and return predictable outcomes.
- Deletion raises ValidationError when category is in use by feature requests.

See docs/architecture/backend-architecture.md — Application Layer.
"""

from rest_framework.exceptions import ValidationError

from apps.categories.models import Category


def create_category(*, name: str, icon: str = "", color: str = "") -> Category:
    """Create and return a new Category reference record."""
    return Category.objects.create(name=name, icon=icon, color=color)


def update_category(
    *, category: Category, name: str = None, icon: str = None, color: str = None
) -> Category:
    """
    Update a Category record. Only supplied fields (non-None) are changed.
    Returns the updated instance.
    """
    if name is not None:
        category.name = name
    if icon is not None:
        category.icon = icon
    if color is not None:
        category.color = color
    category.save()
    return category


def delete_category(*, category: Category) -> None:
    """
    Delete a Category. Raises ValidationError if any FeatureRequest references it.
    The on_delete=PROTECT FK on FeatureRequest enforces this at the DB level, but
    we check application-side first to produce a clean error message.
    """
    if category.feature_requests.exists():
        raise ValidationError({"detail": ["Cannot delete a category that is in use."]})
    category.delete()
