"""
Selectors for the statuses app (query layer — read-only).

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""

from apps.statuses.models import Status


def get_statuses_list():
    """Return all statuses ordered by sort_order."""
    return Status.objects.all().order_by("sort_order")


def get_status(*, pk) -> Status:
    """
    Return a single Status by pk.
    Raises Status.DoesNotExist if not found.
    """
    return Status.objects.get(pk=pk)
