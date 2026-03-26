"""
Serializers for the roles app.

Responsibilities:
- Input validation for admin-writable role fields
- Output representation for API responses

Serializer split strategy (to be implemented with domain models):
- RoleSerializer: read representation (id, name, description)
- RoleWriteSerializer: admin-only writable form for create/update

Design rules:
- Role name uniqueness is enforced at the model/database level.
  Serializer validation provides the user-facing error message.
- Free-form strings must not bypass the controlled reference validation.
"""
