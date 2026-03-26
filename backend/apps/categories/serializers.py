"""
Serializers for the categories app.

Responsibilities:
- Input validation for admin-writable category fields
- Output representation for API responses

Serializer split strategy (to be implemented with domain models):
- CategorySerializer: read representation (id, name, icon, color)
- CategoryWriteSerializer: admin-only writable form for create/update

The category summary (id, name, icon, color) is used as a nested representation
inside feature request responses. It must remain a minimal, stable shape.
"""
