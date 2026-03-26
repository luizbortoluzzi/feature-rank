"""
Services for the feature_requests app (application layer).

Responsibilities:
- Feature request creation: validate, derive author from session, persist
- Feature request update: PATCH semantics, ownership check, protected field guards
- Feature request deletion
- Vote creation (idempotent): existence check + get_or_create + IntegrityError catch
- Vote removal (idempotent): delete queryset (safe even if no row exists)
- Status transition: admin check + transition validity + transactional apply

Vote uniqueness design:
- Service uses get_or_create (existence check + insert as single atomic operation)
- Database unique constraint on (user_id, feature_request_id) is the concurrency
  safety net; IntegrityError from concurrent duplicate is caught and treated as
  idempotent success (200 OK, never 500)

Protected field rules:
- author_id is derived from the authenticated user argument; never from client data
- vote_count is never accepted from the client; it is computed at query time
- status_id from non-admin user raises PermissionDenied, not a silent ignore

See docs/architecture/backend-architecture.md — Services, Transaction Boundaries.
See docs/domain/voting-rules.md for authoritative vote behavior.
See docs/domain/feature-voting.md for valid status transitions.
"""

from django.db import IntegrityError
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.feature_requests.models import FeatureRequest, Vote
from apps.statuses.models import Status

# Valid status transitions: maps source status name to set of permitted target names.
# Defined here as a centralized policy. Only the exact names below are permitted.
# See docs/domain/feature-voting.md — Feature Lifecycle.
VALID_TRANSITIONS: dict[str, set[str]] = {
    "open": {"planned", "rejected"},
    "planned": {"in progress", "rejected"},
    "in progress": {"completed", "rejected"},
    # Terminal statuses have no outbound transitions.
    "completed": set(),
    "rejected": set(),
}


def create_feature_request(
    *, user, title: str, description: str, rate: int, category_id: int
) -> FeatureRequest:
    """
    Create a new FeatureRequest.

    - author is always set from the user argument; never from client data.
    - status is always defaulted to the 'open' status; never from client data.
    - Raises ValidationError if the 'open' status does not exist.
    """
    try:
        open_status = Status.objects.get(name__iexact="open")
    except Status.DoesNotExist:
        raise ValidationError(
            {"detail": ["System error: 'open' status not found. Run seed_reference_data."]}
        )

    return FeatureRequest.objects.create(
        title=title,
        description=description,
        rate=rate,
        author=user,
        category_id=category_id,
        status=open_status,
    )


def update_feature_request(*, feature_request: FeatureRequest, user, data: dict) -> FeatureRequest:
    """
    Apply a partial update (PATCH semantics) to a FeatureRequest.

    - author_id in data is silently popped; never applied.
    - vote_count in data is silently popped; never applied.
    - status_id in data raises PermissionDenied for non-admin users.
    - Only fields present in data are updated; omitted fields are unchanged.
    """
    # Silently strip protected fields that must never be client-applied.
    data.pop("author_id", None)
    data.pop("vote_count", None)

    # status_id is admin-only. Non-admin access raises 403.
    if "status_id" in data:
        if not (user.is_authenticated and user.is_admin):
            raise PermissionDenied("Only administrators may change feature request status.")
        feature_request.status_id = data.pop("status_id")

    # Apply remaining fields.
    if "title" in data:
        feature_request.title = data["title"]
    if "description" in data:
        feature_request.description = data["description"]
    if "rate" in data:
        feature_request.rate = data["rate"]
    if "category_id" in data:
        feature_request.category_id = data["category_id"]

    feature_request.save()
    return feature_request


def delete_feature_request(*, feature_request: FeatureRequest) -> None:
    """
    Delete a FeatureRequest. Vote cascade is handled by on_delete=CASCADE on the Vote FK.
    """
    feature_request.delete()


def vote_feature_request(*, feature_request: FeatureRequest, user) -> dict:
    """
    Cast a vote for a feature request. Idempotent.

    Uses get_or_create as a single atomic operation to avoid the TOCTOU race.
    An IntegrityError from a concurrent duplicate insert is caught and treated
    as an idempotent success — returns 200 with current state, never 500.

    Returns: {"feature_request_id": int, "has_voted": True, "vote_count": int}
    """
    try:
        Vote.objects.get_or_create(user=user, feature_request=feature_request)
    except IntegrityError:
        # Concurrent duplicate insert hit the DB constraint — treat as success.
        pass
    vote_count = Vote.objects.filter(feature_request=feature_request).count()
    return {
        "feature_request_id": feature_request.pk,
        "has_voted": True,
        "vote_count": vote_count,
    }


def unvote_feature_request(*, feature_request: FeatureRequest, user) -> dict:
    """
    Remove a vote for a feature request. Idempotent.

    Deleting a queryset that matches 0 rows is safe and does not raise an error.
    Returns: {"feature_request_id": int, "has_voted": False, "vote_count": int}
    """
    Vote.objects.filter(user=user, feature_request=feature_request).delete()
    vote_count = Vote.objects.filter(feature_request=feature_request).count()
    return {
        "feature_request_id": feature_request.pk,
        "has_voted": False,
        "vote_count": vote_count,
    }


def change_feature_request_status(
    *, feature_request: FeatureRequest, user, new_status_id: int
) -> FeatureRequest:
    """
    Change the status of a feature request. Admin-only.

    Validates that:
    - The caller is an admin.
    - The target status exists.
    - The transition from the current status to the target is permitted per VALID_TRANSITIONS.

    Raises PermissionDenied for non-admin callers.
    Raises ValidationError for invalid transitions or non-existent target status.
    """
    if not (user.is_authenticated and user.is_admin):
        raise PermissionDenied("Only administrators may change feature request status.")

    try:
        new_status = Status.objects.get(pk=new_status_id)
    except Status.DoesNotExist:
        raise ValidationError({"status_id": [f"Status with id={new_status_id} does not exist."]})

    current_name = feature_request.status.name.lower()
    target_name = new_status.name.lower()

    allowed = VALID_TRANSITIONS.get(current_name, set())
    if target_name not in allowed:
        raise ValidationError(
            {
                "status_id": [
                    f"Transition from '{feature_request.status.name}' to '{new_status.name}' is not permitted."
                ]
            }
        )

    feature_request.status = new_status
    feature_request.save()
    return feature_request
