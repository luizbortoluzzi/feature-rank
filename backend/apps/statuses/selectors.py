"""
Selectors for the statuses app (query layer — read-only).

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""

from django.db.models import Count

from apps.statuses.models import Status


def get_statuses_list(*, search: str | None = None):
    """Return all statuses ordered by sort_order, annotated with usage_count."""
    qs = Status.objects.annotate(usage_count=Count("feature_requests")).order_by("sort_order")
    if search:
        qs = qs.filter(name__icontains=search)
    return qs


def get_status(*, pk) -> Status:
    """
    Return a single Status by pk, annotated with usage_count.
    Raises Status.DoesNotExist if not found.
    """
    return Status.objects.annotate(usage_count=Count("feature_requests")).get(pk=pk)
