"""Test settings — isolate side effects from the running dev stack.

Uses an in-process local-memory cache so the test suite never touches (or
flushes) the shared dev Redis. Everything else inherits development.
"""
from .development import *  # noqa: F401,F403

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "quranlytics-tests",
    }
}

# Faster password hashing in tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
