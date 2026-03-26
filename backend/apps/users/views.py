"""
Views for the users app.

Responsibilities (transport layer):
- Authentication entry points (token obtain/refresh are handled by simplejwt views
  registered in urls.py)
- GET /api/users/me/ — returns the current authenticated user's profile

Design rules:
- Views must remain thin. They authenticate, apply permissions, invoke serializers,
  delegate to services or selectors, and return responses.
- Business logic must not appear in views. Any non-trivial user workflow belongs
  in services.py.
- All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
See docs/engineering/backend/api-conventions.md for response format standards.
"""
