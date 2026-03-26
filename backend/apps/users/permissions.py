"""
Permission classes for the users app.

Responsibilities:
- Explicit, named, testable access control at API boundaries
- Object-level ownership checks where required

Permission classes to be implemented here:
- IsAdminUser: allows access only to users with is_admin=True
- IsSelfOrAdmin: allows a user to access their own resource or an admin to
  access any user resource

Design rules:
- Permission logic must be explicit and locatable. Implicit authorization
  hidden inside models or serializers is prohibited.
- Object-level ownership checks are required for editing or deleting user
  resources.
- Every protected endpoint must declare its permission requirements explicitly.

See docs/architecture/backend-architecture.md — Permissions.
See docs/engineering/backend/security.md for security posture.
"""

from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    Allows access only to users with is_admin=True on the custom User model.

    Note: this checks the domain is_admin field, not Django's is_staff flag.
    """

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)
