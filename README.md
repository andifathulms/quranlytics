# Quranlytics

> *Read the Quran. Understand its patterns. Discover its miracles.*

Quranlytics is a Quran reader + pattern intelligence platform. It lets users read
the Quran in Arabic, English, and Indonesian — then go deeper with analytical tools
to discover linguistic patterns, numerical structures, word frequencies, and
semantic relationships across the text.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 (pg_trgm, full-text search) |
| Cache | Redis |
| Task Queue | Celery + Redis |
| Containerization | Docker + Docker Compose |

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Backend API → http://localhost:8000/api/v1/
- Frontend    → http://localhost:3000/

## Data ingestion

Run inside the `backend` container, in order:

```bash
python manage.py ingest_surahs
python manage.py ingest_verses
python manage.py ingest_translations --language=en --translator_id=131
python manage.py ingest_translations --language=id --translator_id=33
python manage.py ingest_words
python manage.py compute_stats
python manage.py build_frequency_cache
```

## Project layout

```
backend/    Django 5 + DRF — quran, analytics, semantic, users apps
frontend/   Next.js 14 reader + analytics UI
```

See [CLAUDE.md](CLAUDE.md) and [PRD.md](PRD.md) for full specification.

## Arabic text integrity

Quranic Arabic text is rendered exactly as sourced. It is never altered,
paraphrased, or truncated. The only derived field is `text_clean` (tashkeel
stripped) which exists solely for search and is never displayed to users.
