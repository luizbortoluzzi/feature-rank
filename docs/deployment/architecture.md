# Runtime Architecture

## Overview

Feature Rank is deployed on a single Oracle Cloud Infrastructure (OCI) VM as a set
of Docker containers orchestrated by Docker Compose. Traefik handles TLS termination
and HTTP routing. MySQL runs as a containerised service with a persistent volume.

```
                       Internet
                          │
                     ┌────┴─────┐
                     │  OCI VM  │
                     │          │
              80/443 │  Traefik │ ← Let's Encrypt ACME (HTTP-01)
                     │   v3.1   │   Labels-based auto-discovery
                     └────┬─────┘
                          │  traefik_net (external Docker bridge)
              ┌───────────┘
              │
     ┌────────┴─────────┐
     │  nginx (frontend) │  port 80 (internal only)
     │  React SPA        │  serves /  → static bundle
     │                   │  proxies /api/, /admin/ → backend:8000
     └────────┬──────────┘
              │  feature_rank_internal (isolated Docker bridge)
     ┌────────┴────────┐    ┌──────────────────┐
     │ Django (backend) │    │  MySQL 8.4 (db)  │
     │ Gunicorn 2w      │────│  persistent vol  │
     │ port 8000        │    │  port 3306       │
     └──────────────────┘    └──────────────────┘
```

## Networks

| Network                  | Type     | Members                       | Purpose                                   |
|--------------------------|----------|-------------------------------|-------------------------------------------|
| `traefik_net`            | external | traefik, frontend             | Traefik routes HTTP from internet to nginx |
| `feature_rank_internal`  | internal | frontend, backend, db         | Isolated — no direct internet access       |

**Key property:** The database and Django backend are on `feature_rank_internal` only.
They cannot be reached from the internet or directly from Traefik. All inbound traffic
enters through the nginx container, which proxies `/api/` and `/admin/` to the backend.

## Services

| Container              | Image                 | Network(s)                            | Exposed ports (public) |
|------------------------|-----------------------|---------------------------------------|------------------------|
| `traefik`              | traefik:v3.1          | traefik_net                           | 80, 443                |
| `feature-rank-frontend`| nginx:1.27-alpine     | traefik_net, feature_rank_internal    | none (Traefik routes)  |
| `feature-rank-backend` | python:3.13-slim      | feature_rank_internal                 | none                   |
| `feature-rank-db`      | mysql:8.4             | feature_rank_internal                 | none                   |

## Request flow

1. Browser connects to `https://feature-rank.yourdomain.com` (port 443)
2. Traefik terminates TLS (Let's Encrypt cert), adds `X-Forwarded-Proto: https`
3. Traefik forwards plain HTTP to `feature-rank-frontend:80`
4. nginx serves static React files for all non-API routes (`/`, `/features/*`, etc.)
5. nginx proxies `/api/*` and `/admin/*` to `feature-rank-backend:8000`
6. Django reads `X-Forwarded-Proto: https` via `SECURE_PROXY_SSL_HEADER` and treats
   the request as HTTPS (correct cookie flags, HSTS, secure redirects)
7. Django queries MySQL on `feature-rank-db:3306`

## Volumes

| Volume          | Mount                       | Purpose                             |
|-----------------|-----------------------------|-------------------------------------|
| `mysql_data`    | `/var/lib/mysql`            | Persistent MySQL data               |
| `traefik_acme`  | `/acme`                     | Let's Encrypt certificate storage   |

## Multi-app hosting

The `traefik_net` network is created once and shared across all app stacks on the VM.
To add a second application:

1. Create the second app's compose file with `traefik_net` as an external network
2. Add Traefik labels to the second app's frontend container with a different `Host()`
3. Add the second app's services to their own internal network (`appname_internal`)
4. The existing Traefik instance auto-discovers the new containers via Docker labels

No Traefik configuration changes are required. The single `traefik` container in the
feature-rank stack continues to serve both apps.

## Resource limits (production)

| Service   | Memory limit |
|-----------|-------------|
| traefik   | 128 MB      |
| db        | 512 MB      |
| backend   | 256 MB      |
| frontend  | 64 MB       |
| **Total** | **960 MB**  |

These limits are suitable for a 2–4 GB Always Free ARM VM (OCI VM.Standard.A1.Flex).
Adjust `deploy.resources.limits.memory` in `docker-compose.prod.yml` as needed.

## OCI Always Free VM recommendation

| Shape                  | OCPU | RAM  | Architecture | Notes                          |
|------------------------|------|------|--------------|--------------------------------|
| VM.Standard.A1.Flex    | 4    | 24GB | ARM (Ampere) | Best value; 4 instances pooled |
| VM.Standard.E2.1.Micro | 1    | 1GB  | x86          | Minimal; tight for multi-app   |

**Recommendation:** Use VM.Standard.A1.Flex with 2 OCPU / 4 GB for comfortable
multi-app hosting while staying within the Always Free allocation.

> **Note on Docker images:** The ARM-based A1.Flex instances use the `linux/arm64`
> architecture. All images used (mysql:8.4, traefik:v3.1, nginx:1.27-alpine,
> python:3.13-slim, node:22-alpine) publish multi-arch manifests and will pull the
> correct variant automatically.
