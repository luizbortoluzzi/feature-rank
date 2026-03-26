"""
Selectors for the categories app (query layer — read-only).

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""

from apps.categories.models import Category


def get_categories_list():
    """Return all categories ordered by name."""
    return Category.objects.all().order_by("name")


def get_category(*, pk) -> Category:
    """
    Return a single Category by pk.
    Raises Category.DoesNotExist if not found.
    """
    return Category.objects.get(pk=pk)
