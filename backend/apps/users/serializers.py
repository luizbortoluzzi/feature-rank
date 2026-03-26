"""
Serializers for the users app.

Responsibilities:
- Input validation for user-facing writable fields
- Output representation for API responses
- Field exposure policy (never expose password hash, tokens, or internal flags
  to clients that should not see them)

Serializer split strategy (to be implemented with domain endpoints):
- UserSummarySerializer: minimal nested representation used inside other
  resource responses (e.g., feature request author). Exposes only id and name.
- UserDetailSerializer: full profile representation for the /users/me/ endpoint.
  Exposes id, username, name, email, is_admin.
- UserCreateSerializer / UserUpdateSerializer: writable forms for account
  creation or profile editing. Never exposes or accepts is_admin from clients.

Protected fields:
- is_admin must never be client-writable in non-admin flows.
- author_id must never appear in create/update payloads received from clients.
"""
