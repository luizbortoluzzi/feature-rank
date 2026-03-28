# ADR-006: JWT Authentication with Rotating Refresh Tokens

## Status

Accepted

## Context

Feature Rank requires authenticated users to vote, submit feature requests, and perform account-specific operations. The authentication mechanism needed to:

- support a stateless React SPA that communicates with a REST API
- keep users logged in across browser sessions without requiring frequent re-authentication
- limit the blast radius if an access or refresh token is stolen
- integrate cleanly with Django REST Framework without a custom session-based implementation

The choice was primarily between server-side sessions (cookie-based, session store required) and token-based authentication (JWT, stateless server).

## Decision

Authentication uses JWT (JSON Web Tokens) via `djangorestframework-simplejwt` with the following configuration:

**Token lifetimes:**
- Access tokens: 15 minutes
- Refresh tokens: 7 days

**Refresh token rotation:** Enabled (`ROTATE_REFRESH_TOKENS = True`). Every time a client calls `POST /api/v1/auth/token/refresh/`, the server issues a new refresh token and invalidates the previous one. The client must store and use the latest refresh token.

**Token blacklist:** Enabled (`BLACKLIST_AFTER_ROTATION = True`). Rotated-out refresh tokens are stored in the `token_blacklist` table and rejected if presented again. This means a stolen refresh token can only be used until the legitimate client next refreshes — after which the stolen token is blacklisted and the attacker's session is invalidated.

**Auth header:** `Authorization: Bearer <access_token>`.

**Logout:** `POST /api/v1/auth/logout/` blacklists the current refresh token explicitly, ending the session server-side even though JWTs are otherwise stateless.

**Token claims:** `user_id` (the user's database primary key) is the only identity claim encoded in the access token.

## Consequences

**Benefits:**
- Short-lived access tokens (15 minutes) limit the window during which a stolen access token can be used — no revocation mechanism is needed for access tokens.
- Refresh token rotation means that using a refresh token consumes it. An attacker who steals a refresh token and uses it will invalidate the legitimate session; the legitimate client's next refresh attempt will fail, alerting the user to log in again.
- The blacklist table provides an explicit revocation mechanism for logout without requiring server-side session state for normal requests.
- JWTs are stateless for access token validation — the backend does not query the database on every API request, only on token refresh and logout.
- `djangorestframework-simplejwt` integrates natively with DRF's authentication framework; no custom authentication class is needed.

**Trade-offs:**
- Refresh token rotation requires the client to reliably store and update the refresh token. A client that loses the refresh token (e.g., clears local storage) must re-authenticate from scratch.
- The `token_blacklist` table grows indefinitely unless periodically flushed. Django's `flushexpiredtokens` management command handles this but must be scheduled.
- A 15-minute access token window means API calls within a session are never truly "logged out" immediately after the user clicks logout — the access token remains valid until it expires. Logout only blacklists the refresh token.
- Adding a `token_blacklist` app introduces a small database write on every token refresh and logout, making these operations non-purely-stateless.

## Alternatives Considered

**Session-based authentication (Django sessions):** Server stores session state, client stores a session cookie. Simpler revocation (delete the session row). However, requires a session store (database or Redis) to be consulted on every request, which complicates horizontal scaling. Cookie-based auth also requires careful CSRF handling in an SPA context.

**Long-lived access tokens (no refresh rotation):** Simpler client implementation. A single long-lived token (e.g., 24 hours) would not require a refresh flow. However, a stolen token would be valid for the full 24 hours with no revocation mechanism. Rejected on security grounds.

**OAuth2 / OIDC with an external provider:** Appropriate for multi-service architectures or when delegating identity to a third party. Adds significant integration complexity for a self-contained system. Not warranted here.

**Non-rotating refresh tokens:** Simpler — the client stores one refresh token that never changes. But a stolen refresh token remains valid indefinitely (for 7 days) with no way to detect or invalidate concurrent use. Rotation provides a meaningful security improvement at low implementation cost.

## Evidence

- `backend/config/settings/base.py` — `SIMPLE_JWT` configuration block: `ACCESS_TOKEN_LIFETIME: timedelta(minutes=15)`, `REFRESH_TOKEN_LIFETIME: timedelta(days=7)`, `ROTATE_REFRESH_TOKENS: True`, `BLACKLIST_AFTER_ROTATION: True`, `AUTH_HEADER_TYPES: ("Bearer",)`
- `backend/config/settings/base.py` — `rest_framework_simplejwt.token_blacklist` in `THIRD_PARTY_APPS`
- `backend/config/settings/base.py` — `REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"]` set to `JWTAuthentication`
- `backend/config/urls.py` — `POST /api/v1/auth/token/`, `POST /api/v1/auth/token/refresh/`, `POST /api/v1/auth/logout/`
- `backend/config/settings/base.py` — inline comment: *"Rotation is enabled so each refresh produces a new refresh token, improving security by reducing the window for replay attacks"*
