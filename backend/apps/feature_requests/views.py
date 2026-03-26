"""
Views for the feature_requests app.

Responsibilities (transport layer):
- Feature request endpoints: list, detail, create, update, delete
- Vote endpoints: POST /features/{id}/vote/, DELETE /features/{id}/vote/

What views own:
- Authentication entry point per request
- Permission enforcement (IsAuthenticated, IsAuthorOrAdmin, IsAdminUser)
- Serializer invocation for input validation
- Delegation to services (writes) and selectors (reads)
- Status code selection and response formatting
- Pagination application for list endpoints

What views must NOT do:
- Implement ranking logic (belongs in selectors.py)
- Implement vote uniqueness logic (belongs in services.py + DB constraint)
- Implement status transition logic (belongs in services.py)
- Embed repeated ORM queries (belongs in selectors.py)
- Assign author from client input (author always derived from request.user)

Endpoint design:
- POST   /api/features/              Create feature request
- GET    /api/features/              List with ranking (vote_count desc, created_at desc, id desc)
- GET    /api/features/{id}/         Feature request detail
- PATCH  /api/features/{id}/         Update own feature (author or admin)
- DELETE /api/features/{id}/         Delete own feature (author or admin)
- POST   /api/features/{id}/vote/    Cast vote (idempotent)
- DELETE /api/features/{id}/vote/    Remove vote (idempotent, returns 200 OK)

All responses follow the documented envelope: { data: ..., meta: ... }

See docs/architecture/backend-architecture.md for layer responsibilities.
See docs/engineering/backend/api-conventions.md for response format standards.
"""
