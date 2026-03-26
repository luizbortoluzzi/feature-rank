"""
Permission classes for the categories app.

Responsibilities:
- Explicit access control for category reference data endpoints

Design rules:
- Mutation of category data is admin-only.
- Read access is public (SAFE_METHODS).
- Permission logic must be explicit, named, and testable.

See docs/engineering/backend/security.md for security posture.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    """
    Allows read-only access to any client (including unauthenticated).
    Write operations (POST, PATCH, DELETE) require is_admin=True.

    Note: checks the domain is_admin field, not Django's is_staff flag.
    """

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)
