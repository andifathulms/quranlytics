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

Host ports are remapped off the defaults to avoid colliding with other local
stacks (containers still use standard ports internally):

- Frontend    → http://localhost:3010/
- Backend API → http://localhost:8010/api/v1/
- Postgres    → localhost:5440 · Redis → localhost:6380

## Data ingestion

Run inside the `backend` container, in order:

```bash
python manage.py ingest_surahs
python manage.py ingest_verses
python manage.py ingest_translations --language=en --translator_id=131
python manage.py ingest_translations --language=id --translator_id=33
python manage.py ingest_words
python manage.py ingest_morphology   # roots + lemmas (Quranic Arabic Corpus)
python manage.py compute_stats
python manage.py build_frequency_cache
```

## Project layout

```
backend/    Django 5 + DRF — quran, analytics, semantic, users apps
frontend/   Next.js 14 reader + analytics UI
```

See [CLAUDE.md](CLAUDE.md) and [PRD.md](PRD.md) for full specification.

## Data sources & morphology

`ingest_words` pulls surface forms + translations from the quran.com API, which
does **not** expose lemma/root morphology. `ingest_morphology` then layers in the
**Quranic Arabic Corpus** morphology (roots + dictionary lemmas, already in
Arabic script), keyed by `surah:verse:word`. Word positions align 1:1 between
the two sources, so every word is matched; ~50k of the 77k words carry a
trilateral root (the rest are particles/proper nouns), across ~1,650 distinct
roots. Lemmas and roots are stored under the same `normalize_search` key used
for query input, so the Root Explorer, root-scoped frequency, and rare-word
tools resolve user input directly. If `ingest_morphology` is skipped, `lemma`
falls back to the normalized surface form so the surface-level tools still work.

## Arabic text integrity

Quranic Arabic text is rendered exactly as sourced. It is never altered,
paraphrased, or truncated. The only derived field is `text_clean` (tashkeel
stripped) which exists solely for search and is never displayed to users.
