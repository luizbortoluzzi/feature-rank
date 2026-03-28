# Security Notes

## Network security

### OCI Security List / NSG rules (minimum required)

Configure the OCI Security List or Network Security Group for the VM to allow
only the following inbound traffic:

| Protocol | Port | Source    | Purpose                              |
|----------|------|-----------|--------------------------------------|
| TCP      | 22   | Your IP   | SSH management (restrict to your IP) |
| TCP      | 80   | 0.0.0.0/0 | HTTP — required for ACME challenge   |
| TCP      | 443  | 0.0.0.0/0 | HTTPS — application traffic          |

**All other inbound ports must be blocked.** In particular:
- Port 3306 (MySQL) — never exposed
- Port 8000 (Django) — never exposed
- Port 8080 (Traefik API) — never exposed directly

### Docker network isolation

| Component | Exposed to internet | Exposed to Traefik | Notes |
|-----------|--------------------|--------------------|-------|
| Traefik   | Yes (80, 443)      | n/a                | Terminates TLS |
| nginx     | No (Traefik only)  | Yes                | Internal port 80 |
| Django    | No                 | No                 | Internal port 8000 |
| MySQL     | No                 | No                 | Internal port 3306 |

The `feature_rank_internal` network uses Docker's `internal: true` flag, which
prevents containers on that network from initiating outbound internet connections.
This limits the blast radius of a compromised backend or database container.

## Container security

- All containers run with `security_opt: no-new-privileges:true`
- The Django backend runs as a non-root user (`appuser`, UID 1000)
- nginx master process runs as root (required to bind port 80) but workers run
  as the `nginx` user
- MySQL runs as the `mysql` user inside the container

## TLS configuration

- TLS 1.2 minimum (`tls.options.default.minVersion: VersionTLS12` in dynamic.yml)
- Strong cipher suites only (ECDHE + AES-GCM / ChaCha20-Poly1305)
- HSTS enforced by Django (`SECURE_HSTS_SECONDS = 31536000`)
- Certificates managed automatically by Traefik + Let's Encrypt (HTTP-01 challenge)

## Secret management

### What is never committed to git

- `.env.prod` (production secrets)
- `acme.json` (TLS certificate private keys)
- `.env` (development secrets, though they contain weak passwords intentionally)

### How secrets are stored

Secrets are stored in `.env.prod` on the VM, readable only by the deploy user.
Set appropriate file permissions after creating it:

```bash
chmod 600 /opt/demo-apps/feature-rank/.env.prod
```

Docker Compose reads `.env.prod` via `--env-file .env.prod` and injects values
as container environment variables. They are not stored in the image layers.

### Traefik dashboard

The dashboard is protected with HTTP basic auth (`TRAEFIK_DASHBOARD_USERS`).
It is accessible only at `https://traefik.{DOMAIN}` — not via a raw IP or port.

Generate credentials:

```bash
docker run --rm httpd:alpine htpasswd -nbB admin 'your-strong-password' \
  | sed 's/\$\$/\$/g'
```

Copy the output into `.env.prod` as the value of `TRAEFIK_DASHBOARD_USERS`.

## Application security

- JWT tokens use HTTP-only cookies (not localStorage) — not accessible to JavaScript
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days
- Refresh token rotation is enabled (each refresh yields a new token; old ones
  are blacklisted)
- Django `SECRET_KEY` is unique per deployment (generated via `openssl rand -hex 25`)
- `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True` in production
- `SECURE_BROWSER_XSS_FILTER` and `SECURE_CONTENT_TYPE_NOSNIFF` are enabled
- `X_FRAME_OPTIONS = "DENY"` prevents clickjacking
- Django does not serve static files directly in production (WhiteNoise handles it)

## Demo-specific security considerations

This application is a portfolio demo with intentional trade-offs:

| Trade-off | Reason | Mitigation |
|-----------|--------|-----------|
| Demo passwords are weak and publicly documented | Visitors need to log in | Database resets daily; no real data at risk |
| Demo users can modify any feature request (per permissions model) | Demonstrates full app functionality | Daily reset restores state |
| No rate limiting at the nginx level | Simplicity | Django has rate limiting on auth endpoints |
| Single VM, no HA | Cost (Always Free) | Acceptable for demo; documented limitation |

## Known base image CVEs

The Docker images referenced in this repository (`node:22-alpine`, `nginx:1.27-alpine`)
may contain known CVEs in their base OS packages. These are upstream vulnerabilities
in Alpine Linux packages and are not introduced by this project.

**Mitigation:**
- Pin images to a specific digest (e.g. `nginx:1.27-alpine@sha256:...`) and update
  on a regular schedule
- Add a Trivy or Grype scan step to the CI pipeline
- Enable Docker Scout or Snyk integration for ongoing monitoring

## SSH hardening recommendations

For the OCI VM:

```bash
# /etc/ssh/sshd_config recommendations
PasswordAuthentication no        # Key-based auth only
PermitRootLogin no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxAuthTries 3
```

Restrict SSH access in the OCI Security List to your known IP address only.
