"""
Selectors for the categories app (query layer — read-only).

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""

from django.db.models import Count

from apps.categories.models import Category


def get_categories_list(*, search: str | None = None):
    """Return all categories ordered by name, annotated with feature_count."""
    qs = Category.objects.annotate(feature_count=Count("feature_requests", distinct=True)).order_by(
        "name"
    )
    if search:
        qs = qs.filter(name__icontains=search)
    return qs


def get_category(*, pk) -> Category:
    """
    Return a single Category by pk, annotated with feature_count.
    Raises Category.DoesNotExist if not found.
    """
    return Category.objects.annotate(feature_count=Count("feature_requests", distinct=True)).get(
        pk=pk
    )
