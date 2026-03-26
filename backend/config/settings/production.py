from .base import *  # noqa: F401, F403

DEBUG = False

# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# TLS is terminated at the load balancer / nginx level; the app itself does
# not need to redirect HTTP → HTTPS.
SECURE_SSL_REDIRECT = False

# Secure cookie flags — cookies must only be transmitted over HTTPS.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS — instruct browsers to only connect via HTTPS for 1 year, including
# all subdomains. This also covers the admin subdomain if one is used.
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Trust the X-Forwarded-Proto header from the load balancer so Django
# correctly identifies the original request scheme as HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# conn_max_age is already set to 600 in base.py via dj_database_url.config().
# No override needed here.

# ---------------------------------------------------------------------------
# Static files — WhiteNoise serves compressed, cache-busted static assets
# directly from the Django process without a separate file server.
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
