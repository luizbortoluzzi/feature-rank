# Backend Security

Defines the mandatory security standards for the Django backend in this repository.

This document is not a generic security checklist. It defines the security posture expected for THIS system.

---

## Objectives

The backend must protect:

- authentication and identity
- authorization boundaries
- feature request integrity
- voting integrity
- administrative operations
- system availability
- sensitive user data
- auditability of important actions

Security decisions must prioritize correctness, explicitness, and backend enforcement.

---

## Security Principles

1. Never trust client input.
2. Never trust frontend authorization logic.
3. Every sensitive action must be validated on the backend.
4. Every important state transition must be explicit.
5. Deny by default when access is unclear.
6. Prefer database constraints for critical invariants.
7. Prefer explicit permissions over implicit behavior.
8. Do not expose internal implementation details in responses.
9. Log security-relevant actions safely.
10. Design for abuse resistance, not only happy paths.

---

## Authentication Strategy

The system must have one clearly documented authentication strategy.

Recommended options:

- session authentication for web-first internal/admin flows
- JWT authentication for API-first or multi-client flows
- short-lived access token + refresh token if JWT is used

The repository must choose one primary strategy and apply it consistently.

### Recommended Default

For a web + mobile capable product, prefer:

- short-lived access token
- refresh token rotation if supported
- secure storage rules documented per client
- backend-side verification on every protected endpoint

### Authentication Rules

- do not implement custom crypto for passwords or tokens
- use Django's authentication primitives or well-established libraries
- passwords must be hashed with Django-supported secure hashers
- tokens must never be logged
- refresh flows must be documented and tested
- inactive users must not authenticate
- deleted or suspended users must not authenticate

### Session / Token Expiration

Authentication must define:

- access lifetime
- refresh lifetime
- logout/invalidation behavior
- behavior for disabled users

Do not leave token lifetime undefined.

---

## Authorization Model

Authorization must be enforced entirely in the backend.

The system uses at least:

- `User`
- `Role`
- `is_admin`

These fields must have clearly separated meaning:

- `role_id`: product/business role classification
- `is_admin`: elevated administrative privilege

If both exist, precedence must be documented and enforced consistently.

### Deny-by-Default Rule

If a permission rule is not explicitly granted, it is denied.

### Minimum Authorization Expectations

#### Public / Unauthenticated
Depending on product choice, public users may be allowed to:

- list feature requests
- view feature request details
- list categories
- list statuses

If public write actions are not allowed, they must be rejected with authentication errors.

#### Authenticated Users
Authenticated users may typically:

- create feature requests
- vote on feature requests
- remove their own vote if supported
- edit their own feature requests if product policy allows

#### Admin Users
Admins may typically:

- change feature status
- edit controlled reference data
- moderate content
- reassign authorship if explicitly supported
- archive or remove inappropriate content

### Object-Level Authorization

Object-level checks are mandatory for operations such as:

- editing a feature request
- deleting a feature request
- changing status
- removing content
- accessing admin-only records

Examples:

- a normal user can edit only their own feature request, if editing is allowed
- a normal user cannot change status unless explicitly granted
- only admins can manage categories or statuses unless a moderator role is defined
- a user can only remove their own vote

Do not rely on endpoint-level auth only when object ownership matters.

---

## Endpoint Security Matrix

The backend should define explicit permissions per endpoint.

Recommended initial matrix:

### Roles
- `GET /roles/`
  - admin only, unless product explicitly exposes roles publicly

### Users
- `GET /users/me/`
  - authenticated user
- `GET /users/{id}/`
  - admin only, unless profile exposure is explicitly allowed

### Categories
- `GET /categories/`
  - public or authenticated
- create/update/delete categories
  - admin only

### Statuses
- `GET /statuses/`
  - public or authenticated
- create/update/delete statuses
  - admin only

### Feature Requests
- `GET /feature-requests/`
  - public or authenticated depending on product policy
- `GET /feature-requests/{id}/`
  - same as list policy
- `POST /feature-requests/`
  - authenticated
- `PATCH /feature-requests/{id}/`
  - author or admin, if editing is enabled
- `DELETE /feature-requests/{id}/`
  - admin only or author+admin depending on policy
- status update action
  - admin only unless a special moderator role exists

### Votes
- `POST /feature-requests/{id}/vote/`
  - authenticated
- `DELETE /feature-requests/{id}/vote/`
  - authenticated, and only affects caller's own vote

---

## Input Validation

All write endpoints must validate input through serializers, validators, and model/database constraints where appropriate.

Validation must cover:

- required fields
- type correctness
- enum-like references
- integer bounds
- string length bounds
- uniqueness rules
- ownership rules
- state transition legality

### Validation Rules by Entity

#### User
- email must be unique
- email must be normalized
- name must not be empty
- role must exist
- inactive/deleted user behavior must be explicit

#### Category
- name required
- name unique
- color format validated
- icon format validated if a defined icon vocabulary exists

#### Status
- name required
- name unique
- color format validated
- `sort_order` integer validation
- transition policy enforced in service layer if transitions exist

#### FeatureRequest
- title required
- description required
- rate required
- rate must be integer between 1 and 5
- category must exist
- status must exist
- author comes from authenticated identity unless admin override is explicitly allowed

#### Vote
- feature request must exist
- caller must be authenticated
- only one vote per user per feature request
- duplicate voting must not create inconsistent state

### Reject Unexpected Behavior

The backend should not silently accept malformed or unauthorized input.

Examples:

- client attempts to submit `author_id` directly -> reject or ignore explicitly based on contract
- client attempts to set `vote_count` directly -> reject
- client attempts to set admin-only status -> reject
- client submits unknown fields -> either reject or strip consistently according to serializer policy

Preferred behavior: reject unexpected writable fields clearly.

---

## Database-Level Security and Integrity

Critical invariants must be enforced at the database layer wherever possible.

### Required Database Protections

- unique constraint on user email
- unique constraint on role name
- unique constraint on category name
- unique constraint on status name
- unique composite constraint on vote `(user_id, feature_request_id)`
- non-null foreign keys on required references
- rate check constraint if supported by the database

### Why This Matters

Application-only checks are insufficient under:

- concurrent requests
- retry storms
- multi-client behavior
- deployment race conditions
- future code regressions

The database is the final integrity boundary.

---

## Voting Security

Voting is a core high-risk interaction because it directly affects ranking and can be spammed or corrupted.

### Mandatory Rules

- vote creation must be authenticated
- one user can vote only once per feature request
- backend must enforce uniqueness
- frontend state must not be treated as proof of vote state
- duplicate vote requests must not increase count
- removal must only remove the caller's own vote

### Concurrency Protection

Voting code must be safe under:

- repeated taps
- rapid retries
- simultaneous tabs
- mobile reconnects
- request replay

Use:

- unique database constraint
- transaction handling where needed
- idempotent or conflict-safe API behavior

Do not implement vote creation as:

1. check if vote exists
2. create vote

without also protecting against concurrent inserts.

### Recommended Patterns

Acceptable patterns include:

- create and catch integrity error
- transactional get-or-create with constraint-backed safety
- explicit conflict response with stable semantics

---

## Feature Request Ownership Security

Ownership rules must be explicit.

### Creation

- author must come from authenticated user context
- do not trust client-supplied author identifiers in normal flows

### Editing

If editing is enabled:

- author may edit own feature request
- admin may edit any feature request
- status change should usually remain admin/moderator-only
- fields editable by author vs admin must be defined explicitly

### Deletion / Archival

The system must choose one policy and document it:

- hard delete by admin only
- soft archive by admin
- author can delete own draft/open request only
- completed/rejected items may be immutable except for admin

Do not leave deletion semantics ambiguous.

---

## State Transition Security

If `Status` drives lifecycle, status transitions must not be unrestricted.

### Recommended Rule

Only admin or moderator roles may change status.

### Why

Status changes can imply roadmap commitments, completion, rejection, or product decisions. These are governance actions, not normal user actions.

### Transition Policy

The backend should explicitly define whether transitions such as these are allowed:

- open -> planned
- planned -> in_progress
- in_progress -> completed
- open -> rejected

If transitions are restricted, the service layer must enforce them.

Do not let arbitrary clients patch status IDs freely.

---

## Sensitive Data Exposure

The API must expose only the fields necessary for the client.

### Do Not Expose By Default

- password hashes
- auth tokens
- refresh tokens
- internal permission internals
- admin-only audit data
- soft-delete flags unless needed
- internal moderation notes unless authorized

### Use Minimal User Representations

For public-facing feature request responses, user payload should usually be minimal, for example:

- id
- name
- avatar_url (optional)

Do not expose email publicly unless there is an explicit product requirement.

---

## Error Handling and Information Disclosure

Error responses must be safe and structured.

### Rules

- do not expose stack traces
- do not expose raw database errors
- do not leak internal model names or SQL details
- do not reveal whether protected resources exist when that creates an authorization problem, if concealment is preferred by policy

### Standard Error Format

Use a predictable structure such as:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "validation_error",
    "details": {}
  }
}
```

### Logging vs Response

Internal detail belongs in logs, not in public API responses.

---

## CORS and CSRF

The chosen auth strategy must match CORS and CSRF configuration.

### If Using Session Authentication

- enable CSRF protection
- document trusted origins
- do not disable CSRF globally for convenience

### If Using Token Authentication

- configure CORS explicitly
- allow only trusted frontend origins
- do not use wildcard origins in production unless there is a very specific reason and no credentials are involved

### Rules

- production CORS must be restrictive
- environment-specific origin lists must be configurable
- local development exceptions must not leak into production defaults

---

## Rate Limiting and Abuse Protection

The system must protect high-value mutation endpoints.

### Minimum Protected Endpoints

- login
- token refresh
- feature creation
- voting
- comment creation if comments exist
- password reset flows if implemented

### Goals

- prevent brute force
- prevent spam
- reduce abuse cost
- protect availability

### Recommended Approach

- per-user limit for authenticated actions
- per-IP limit for public actions
- stricter limits on auth endpoints
- observability on throttled behavior

Do not assume low traffic means no abuse risk.

---

## Replay, Retry, and Idempotency

Clients may retry requests for legitimate reasons.

The backend must behave safely under repeated requests.

### Voting
Repeated vote attempts must not duplicate votes.

### Vote Removal
Repeated removal attempts must not break state.

### Feature Creation
If true idempotency is not implemented for create actions, document that behavior clearly. Consider future idempotency keys for mobile/offline-friendly clients.

---

## Transactions and Atomicity

Use transactions for operations that must succeed or fail as a unit.

Common cases:

- create vote + update cached counter if cached counters exist
- moderation actions touching multiple records
- status transitions that generate audit events
- admin reassignment flows

Do not leave partially applied state across multi-step operations.

---

## File Upload Security

If the product later supports attachments:

- validate file type
- validate file size
- store outside executable paths
- generate safe file names
- scan or restrict dangerous content types
- never trust client-provided MIME type alone

Even if uploads are not in scope now, do not design APIs that assume uploads are harmless.

---

## Secret Management

Secrets must never be committed to the repository.

Use environment variables or secure secret managers for:

- Django secret key
- database credentials
- JWT signing keys
- third-party API keys
- email provider credentials
- cloud storage credentials

### Rules

- no secrets in source code
- no secrets in test fixtures unless explicitly fake
- no secrets in logs
- rotation strategy should be possible

---

## Logging and Auditability

Security-relevant events should be logged with care.

### Log These Safely

- authentication failures
- permission denials
- status changes
- admin actions
- suspicious vote abuse patterns
- throttling events
- moderation actions

### Do Not Log

- passwords
- raw tokens
- session secrets
- full sensitive payloads unnecessarily

### Audit Trail Recommendation

For production-ready evolution, consider an audit mechanism for:

- who changed status
- who moderated a feature request
- who changed role assignments
- when key state transitions happened

---

## Deployment and Environment Security

Production configuration must differ from development safely.

### Production Expectations

- `DEBUG = False`
- restrictive allowed hosts
- secure cookies if sessions are used
- HTTPS only in production
- strict CORS configuration
- secure proxy/SSL settings if behind load balancers
- production logging and error reporting configured

### Environment Separation

- development defaults must not weaken production configuration
- environment-specific values must be explicit
- test and staging should not reuse production secrets

---

## Dependency and Supply Chain Security

- keep dependencies minimal
- prefer mature, maintained libraries
- pin versions appropriately according to team policy
- review auth/security-related packages carefully
- remove unused dependencies
- monitor dependency vulnerabilities in CI when possible

Do not add packages casually for security-critical behavior without review.

---

## Security Testing Expectations

The backend must test critical security behavior.

### Required Test Areas

- authentication required where expected
- unauthorized access is denied
- object ownership is enforced
- duplicate voting is blocked
- admin-only operations are protected
- invalid rate values are rejected
- protected fields cannot be client-controlled
- status transitions are restricted as designed

### Recommended Additional Tests

- concurrency test around duplicate votes
- throttling behavior tests
- serializer rejection of unauthorized fields
- soft-deleted/inactive user auth behavior

---

## Security Decision Checklist

Before merging a backend change, verify:

1. Does this endpoint require authentication?
2. Does it require object-level authorization?
3. Can the client set a protected field?
4. Is there a missing database constraint?
5. Can retries or concurrency corrupt state?
6. Could this leak sensitive information?
7. Should this action be rate-limited?
8. Should this action be logged?
9. Does this change need new security tests?
10. Does documentation need updating?

---

## Minimum Non-Negotiables

The backend is not considered production-ready unless all of these are true:

- authentication strategy is defined
- authorization rules are explicit
- vote uniqueness is enforced in the database
- sensitive fields are not exposed
- admin operations are protected
- write endpoints validate input strictly
- production config disables debug and restricts origins/hosts
- errors do not leak internals
- security-critical behaviors have tests

---

## Summary

This backend must be secure by design, not secure by hope.

That means:

- authentication is consistent
- authorization is explicit
- voting is integrity-protected
- status changes are controlled
- inputs are validated
- concurrency does not corrupt state
- logs are useful but safe
- production settings are hardened
