# ── Stage 1: builder ─────────────────────────────────────────────────────────
# Compiles mysqlclient and installs all Python dependencies into a virtualenv.
FROM python:3.13-slim AS builder

# Upgrade all OS packages first to patch any known CVEs in the base image,
# then install build dependencies required to compile mysqlclient.
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*

# Create an isolated virtualenv so it can be copied cleanly to the runtime stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build

# Copy the full source so setuptools can discover the package and resolve all
# declared dependencies. Without source files, setuptools builds an empty wheel
# and silently skips installing [project] dependencies.
COPY . .

# Install the package and all its dependencies (no dev extras in the image)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
# Minimal image containing only the runtime MySQL shared library and the venv.
FROM python:3.13-slim AS runtime

# Upgrade all OS packages to patch CVEs in the base image, then install
# only the MySQL-compatible runtime shared library (no build tools).
# python:3.13-slim is based on Debian trixie which ships libmariadb3 instead
# of libmysqlclient21. mysqlclient links against it transparently.
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    libmariadb3 \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for running the application
RUN useradd --uid 1000 --no-create-home --shell /bin/false appuser

# Bring in the fully-built virtualenv from the builder stage
COPY --from=builder /opt/venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy application source
COPY . .

# Transfer ownership of the working directory to the non-root user
RUN chown -R appuser:appuser /app

# Make the entrypoint executable (also committed as +x, but be explicit)
RUN chmod +x /app/entrypoint.sh

USER appuser

ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 8000

# Default command — development runserver.
# Overridden in docker-compose.prod.yml with gunicorn.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
