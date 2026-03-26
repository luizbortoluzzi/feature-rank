"""
Permission classes for the feature_requests app.

Responsibilities:
- Explicit, named, testable access control at feature request and vote endpoints
- Object-level ownership checks for edit, delete, and vote removal

Permission classes to implement:
- IsAuthorOrAdmin: allows the feature request author or any admin to modify/delete
  a feature request. All other users receive 403.
- IsVoteOwner: allows the vote holder to remove their own vote. Never accepts
  a client-supplied user_id — derives ownership from request.user.

Design rules:
- Permission logic must be explicit, locatable, and testable.
- Object-level checks are required for edit, delete, and vote removal.
- Status change must be admin-only; this should be enforced by an explicit
  permission class, not hidden in a serializer or view conditional.
- Implicit or inline authorization logic is prohibited.

See docs/architecture/backend-architecture.md — Permissions.
See docs/engineering/backend/security.md for security posture.
"""

from rest_framework.permissions import BasePermission


class IsAuthorOrAdmin(BasePermission):
    """
    Object-level permission. Allows access if the requesting user is the author
    of the feature request or has is_admin=True.
    """

    def has_object_permission(self, request, view, obj) -> bool:
        if request.user and request.user.is_authenticated and request.user.is_admin:
            return True
        return bool(hasattr(obj, "author") and obj.author == request.user)
