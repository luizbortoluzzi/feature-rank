"""
Serializers for the statuses app.

Responsibilities:
- Input validation for admin-writable status fields
- Output representation for API responses

Serializer split strategy (to be implemented with domain models):
- StatusSerializer: read representation (id, name, color, is_terminal)
- StatusWriteSerializer: admin-only writable form for create/update

The status summary (id, name, color, is_terminal) is used as a nested
representation inside feature request responses. It must remain a minimal,
stable shape.

Note: is_terminal is a display hint for the frontend. It does not affect
backend vote or ranking behavior.
"""
