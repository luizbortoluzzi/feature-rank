# Build context: repo root (.)
# All COPY paths are relative to the repo root.

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Installs Node dependencies from the lockfile into a clean layer.
FROM node:22-alpine AS deps

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
# Runs the Vite production build and produces the compiled static assets.
# VITE_API_BASE_URL is baked into the bundle at build time by Vite.
# Pass "" (empty string) for same-origin API calls proxied through nginx.
# Pass "https://api.example.com" to call a separate API host directly.
FROM node:22-alpine AS builder

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .
RUN npm run build

# ── Stage 3: runner (production) ─────────────────────────────────────────────
# Serves the compiled assets via nginx.
# Main nginx.conf and the site default.conf are bind-mounted from
# docker/nginx/ in docker-compose.prod.yml, so they can be updated without
# rebuilding the image. The COPY here provides defaults when running the image
# standalone.
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx master process requires root to bind port 80 and manage workers.
# Workers run as the nginx user automatically per the nginx.conf user directive.

# ── Stage 4: dev ──────────────────────────────────────────────────────────────
# Runs the Vite dev server with hot-reload.
# node_modules are installed at build time; the host source is bind-mounted
# at run time via docker-compose volumes (see docker-compose.yml).
FROM node:22-alpine AS dev

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --frozen-lockfile

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
