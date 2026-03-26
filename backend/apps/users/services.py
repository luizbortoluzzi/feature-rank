"""
Services for the users app (application layer).

Responsibilities:
- Non-trivial user mutation workflows: account creation
- Enforces protected field rules (is_admin is never client-controllable)

Design rules:
- Service functions accept explicit typed arguments and return predictable outcomes.
- They must not accept HTTP request objects where avoidable.
- They use transactions when multiple persistence steps must succeed or fail together.

See docs/architecture/backend-architecture.md — Application Layer.
"""

from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

User = get_user_model()


def register_user(*, username: str, email: str, name: str, password: str) -> User:
    """
    Create a new user account.

    Email is normalized to lowercase. Raises ValidationError if the email
    is already in use. is_admin is always False for newly registered users —
    it is never client-controllable.
    """
    email = email.lower()
    if User.objects.filter(email=email).exists():
        raise ValidationError({"email": ["A user with this email already exists."]})
    return User.objects.create_user(
        username=username,
        email=email,
        name=name,
        password=password,
    )
