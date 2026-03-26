"""
Permission classes for the statuses app.

Responsibilities:
- Explicit access control for status reference data endpoints

Design rules:
- Mutation of status data is admin-only.
- Read access may be available to authenticated users or public clients.
- Permission logic must be explicit, named, and testable.

See docs/engineering/backend/security.md for security posture.
"""
