"""
Permission classes for the roles app.

Responsibilities:
- Explicit access control for role reference data endpoints

Design rules:
- Mutation of role data is admin-only. Read access may be available to
  authenticated users depending on the product requirement.
- Permission logic must be explicit, named, and testable.

See docs/engineering/backend/security.md for security posture.
"""
