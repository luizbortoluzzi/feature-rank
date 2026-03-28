"""
Services for the statuses app (application layer).

Responsibilities:
- Status reference data mutation: create, update, safe deletion
- Deletion checks for references before proceeding (restrictive delete policy)

Note: status transition logic for feature requests belongs in
apps.feature_requests.services, not here. This service owns only the lifecycle
of the Status reference entity itself.

Design rules:
- Services accept explicit arguments and return predictable outcomes.
- Deletion raises ValidationError when status is in use by feature requests.

See docs/architecture/backend-architecture.md — Application Layer.
"""

from rest_framework.exceptions import ValidationError

from apps.statuses.models import Status


def create_status(
    *,
    name: str,
    color: str = "",
    description: str = "",
    is_terminal: bool = False,
    is_active: bool = True,
    sort_order: int = 0,
) -> Status:
    """Create and return a new Status reference record."""
    return Status.objects.create(
        name=name,
        color=color,
        description=description,
        is_terminal=is_terminal,
        is_active=is_active,
        sort_order=sort_order,
    )


def update_status(
    *,
    status: Status,
    name: str = None,
    color: str = None,
    description: str = None,
    is_terminal: bool = None,
    is_active: bool = None,
    sort_order: int = None,
) -> Status:
    """
    Update a Status record. Only supplied fields (non-None) are changed.
    Returns the updated instance.
    """
    if name is not None:
        status.name = name
    if color is not None:
        status.color = color
    if description is not None:
        status.description = description
    if is_terminal is not None:
        status.is_terminal = is_terminal
    if is_active is not None:
        status.is_active = is_active
    if sort_order is not None:
        status.sort_order = sort_order
    status.save()
    return status


def delete_status(*, status: Status) -> None:
    """
    Delete a Status. Raises ValidationError if any FeatureRequest references it.
    The on_delete=PROTECT FK on FeatureRequest enforces this at the DB level, but
    we check application-side first to produce a clean error message.
    """
    if status.feature_requests.exists():
        raise ValidationError({"detail": ["Cannot delete a status that is in use."]})
    status.delete()
