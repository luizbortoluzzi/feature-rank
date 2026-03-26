"""
Services for the feature_requests app.

Responsibilities (application layer):
- Feature request creation workflow: validate, derive author from session, persist
- Feature request update workflow: ownership check, apply changes
- Feature request deletion workflow: ownership check, delete
- Vote creation (cast_vote): existence check + insert, handle concurrent
  duplicate gracefully (idempotent)
- Vote removal (remove_vote): ownership check, delete if exists (idempotent)
- Status transition workflow: permission check, transition legality check,
  apply change transactionally

Vote uniqueness design:
- Service layer checks for existing vote before attempting insert (fast path)
- Database unique constraint on (user_id, feature_request_id) acts as the
  concurrency safety net
- An IntegrityError from a concurrent duplicate insert is caught and treated
  as an idempotent success (200 OK), never a 500

Transaction boundaries:
- Vote create/remove: wrap in transaction if audit records or counters are added
- Status transition: always transactional if side effects (audit, notifications)
  are present
- Multi-step mutations that must succeed or fail together use atomic blocks

Protected field rules:
- author_id is derived from the authenticated request.user; never from client input
- vote_count is never accepted from client; it is computed at query time
- status_id is not client-controlled in non-admin create/update flows

See docs/architecture/backend-architecture.md — Services, Transaction Boundaries.
See docs/domain/voting-rules.md for authoritative vote behavior.
"""
