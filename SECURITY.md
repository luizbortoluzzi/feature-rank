# Security Policy

## Supported Versions

Security fixes are applied to the current main branch only. Older releases do not receive backported patches unless explicitly stated.

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |
| Others  | No        |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, please report it privately so it can be addressed before public disclosure.

### How to report

Send a report to the project maintainers via one of these methods:

- **GitHub private vulnerability reporting:** Use the "Report a vulnerability" button in the repository's Security tab (preferred).
- **Email:** Contact the maintainer at the address listed in the repository profile. Mark the subject line with `[SECURITY]`.

Include in your report:

- A clear description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any relevant code paths, endpoints, or configuration involved.
- Your assessment of severity (e.g., CVSS score if applicable).

---

## Response Expectations

| Stage | Target timeline |
|-------|----------------|
| Initial acknowledgement | Within 3 business days |
| Assessment and triage | Within 7 business days |
| Fix or mitigation | Depends on severity — critical issues are prioritized immediately |
| Public disclosure | Coordinated with the reporter; typically after a fix is available |

We will keep you informed throughout the process and credit you in the release notes unless you prefer to remain anonymous.

---

## Disclosure Policy

This project follows **coordinated disclosure**:

1. Reporter contacts maintainers privately.
2. Maintainers confirm the issue and assess severity.
3. A fix is developed and tested.
4. A patched release is published.
5. A public disclosure is made, crediting the reporter.

We ask that reporters do not publicly disclose the vulnerability until a fix has been released or a mutually agreed timeline has passed (maximum 90 days from initial report).

---

## Scope

The following are in scope for security reports:

- Authentication and authorization vulnerabilities (JWT handling, permission bypasses)
- Vote integrity violations (duplicate votes, unauthorized vote removal)
- Injection vulnerabilities (SQL injection, XSS, command injection)
- Exposure of sensitive data in API responses (passwords, tokens, internal errors)
- Insecure direct object references or missing object-level authorization
- CSRF vulnerabilities in state-changing endpoints

The following are out of scope:

- Vulnerabilities in third-party dependencies that are not yet publicly disclosed (report to those maintainers directly)
- Theoretical vulnerabilities without a proof of concept
- Social engineering
- Physical security issues
- Attacks requiring physical access to infrastructure

---

## Security Design Notes

For understanding the intended security posture of this system, refer to:

- `docs/engineering/backend/security.md` — backend authentication, permission model, and protected fields
- `docs/domain/voting-rules.md` — vote integrity constraints
- `docs/architecture/system-overview.md` — system invariants
