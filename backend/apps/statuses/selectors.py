"""
Selectors for the statuses app (query layer — read-only).

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""

from django.db.models import Count

from apps.statuses.models import Status


def get_statuses_list():
    """Return all statuses ordered by sort_order, annotated with usage_count."""
    return Status.objects.annotate(usage_count=Count("feature_requests")).order_by("sort_order")


def get_status(*, pk) -> Status:
    """
    Return a single Status by pk, annotated with usage_count.
    Raises Status.DoesNotExist if not found.
    """
    return Status.objects.annotate(usage_count=Count("feature_requests")).get(pk=pk)
