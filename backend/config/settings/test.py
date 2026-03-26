"""
Test settings — uses SQLite in-memory to avoid MySQL driver requirement.
This settings module is used for running tests and generating migrations
in environments where MySQL is not available.
"""

from .base import *  # noqa: F401, F403

DEBUG = True

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CORS_ALLOW_ALL_ORIGINS = True

# Disable password hashing for speed in tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
