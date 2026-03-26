# ── Stage 1: builder ─────────────────────────────────────────────────────────
# Compiles mysqlclient and installs all Python dependencies into a virtualenv.
FROM python:3.13-slim AS builder

# Install OS build dependencies required to compile mysqlclient
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*

# Create an isolated virtualenv so it can be copied cleanly to the runtime stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build
COPY pyproject.toml .

# Install the package and all its dependencies (no dev extras in the image)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
# Minimal image containing only the runtime MySQL shared library and the venv.
FROM python:3.13-slim AS runtime

# Install only the MySQL runtime shared library (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmysqlclient21 \
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
