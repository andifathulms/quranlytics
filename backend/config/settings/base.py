"""Base Django settings shared across environments."""
from __future__ import annotations

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

# backend/config/settings/base.py -> backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env from repo root (one level above backend/) if present.
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    # Third party
    "rest_framework",
    "corsheaders",
    "django_filters",
    # Local apps
    "apps.quran",
    "apps.analytics",
    "apps.semantic",
    "apps.users",
    "apps.community",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get(
            "DATABASE_URL",
            "postgres://quran:quran_dev@localhost:5432/quranlytics",
        ),
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Cache (Redis) ──────────────────────────────────────
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}
ANALYTICS_CACHE_TTL = 60 * 60 * 24  # 24h — Quran data is static

# ─── DRF ────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "EXCEPTION_HANDLER": "apps.common.envelope.envelope_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    # Throttles are applied per-view (not globally) so reads stay unthrottled.
    "DEFAULT_THROTTLE_RATES": {
        "register": "20/hour",
        "write": "60/hour",
        "vote": "300/hour",
        "semantic": "30/min",
        "proxy": "60/min",
    },
}

# ─── Celery ─────────────────────────────────────────────
CELERY_BROKER_URL = os.environ.get(
    "CELERY_BROKER_URL", "redis://localhost:6379/1"
)
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True

# ─── CORS ───────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")
    if o.strip()
]

# ─── Quran data sources ─────────────────────────────────
QURAN_API_BASE = os.environ.get(
    "QURAN_API_BASE", "https://api.quran.com/api/v4"
)
QURAN_API_KEY = os.environ.get("QURAN_API_KEY", "")
TRANSLATION_IDS = {"en": 20, "id": 33}  # Saheeh International, Kemenag RI
# quran.com exposes Ibn Kathir (EN). Indonesian Kemenag tafsir comes from
# equran.id (a separate source) instead — see the tafsir view.
TAFSIR_IDS = {"en": 169}  # quran.com tafsir resource ids (per language)
EQURAN_API_BASE = os.environ.get("EQURAN_API_BASE", "https://equran.id/api/v2")
INGEST_RATE_LIMIT_SECONDS = 1.0  # 1 request/second

# Quranic Arabic Corpus morphology (roots + lemmas in Arabic script).
# Tab-separated: location<TAB>form<TAB>tag<TAB>features, location = s:v:w:seg.
QURAN_MORPHOLOGY_URL = os.environ.get(
    "QURAN_MORPHOLOGY_URL",
    "https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt",
)

# ─── Semantic layer (Phase 4) ───────────────────────────
# Self-hosted multilingual sentence-transformer. 384-dim embeddings stored in
# pgvector. The model downloads once on first use and is cached in-container.
EMBEDDING_MODEL = os.environ.get(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
EMBEDDING_DIM = 384
THEME_CLUSTER_COUNT = int(os.environ.get("THEME_CLUSTER_COUNT", "24"))
