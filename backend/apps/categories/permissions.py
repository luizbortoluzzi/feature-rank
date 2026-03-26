"""
Permission classes for the categories app.

Responsibilities:
- Explicit access control for category reference data endpoints

Design rules:
- Mutation of category data is admin-only.
- Read access may be available to authenticated users or public clients
  depending on the product requirement.
- Permission logic must be explicit, named, and testable.

See docs/engineering/backend/security.md for security posture.
"""
