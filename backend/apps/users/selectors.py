"""
Selectors for the users app (query layer — read-only).

Design rules:
- Selectors are strictly read-only. They must never mutate state.

See docs/architecture/backend-architecture.md — Query Layer.
"""

from django.contrib.auth import get_user_model

User = get_user_model()


def get_current_user(*, user) -> User:
    """
    Return the current authenticated user from the database.
    Uses pk from the authenticated user object to ensure a fresh read.
    """
    return User.objects.get(pk=user.pk)
