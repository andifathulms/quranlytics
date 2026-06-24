# CLAUDE.md — Quranlytics

## Project Identity

**Quranlytics** is a Quran reader + pattern intelligence platform. It lets users read the Quran in Arabic, English, and Indonesian — and then go deeper, using analytical tools to discover linguistic patterns, numerical structures, word frequencies, and semantic relationships across the text.

This is a spiritually significant project. Treat Arabic Quranic text with precision. Never alter, paraphrase, or truncate Quranic text in any way. Render it exactly as sourced.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 (pg_trgm, full-text search) |
| Cache | Redis |
| Task Queue | Celery + Redis |
| Containerization | Docker + Docker Compose |
| Deployment | GCP Cloud Run |
| CDN | Cloudflare |

---

## Project Structure

```
quranlytics/
├── backend/
│   ├── manage.py
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── quran/          # Core Quran data: surahs, verses, words
│   │   ├── analytics/      # Frequency, patterns, structural analysis
│   │   ├── semantic/       # AI-powered search and theme clustering
│   │   └── users/          # Auth, bookmarks, notes, history
│   ├── scripts/
│   │   └── ingest/         # Data ingestion from quran.com API
│   └── requirements/
│       ├── base.txt
│       ├── dev.txt
│       └── prod.txt
├── frontend/
│   ├── app/
│   │   ├── (reader)/
│   │   │   ├── [surah]/
│   │   │   └── juz/[n]/
│   │   ├── analyze/
│   │   │   ├── word/
│   │   │   ├── root/
│   │   │   ├── cooccurrence/
│   │   │   └── structure/
│   │   ├── explore/        # Miracle Facts Explorer
│   │   └── dashboard/      # Personal analytics
│   ├── components/
│   │   ├── reader/
│   │   ├── analytics/
│   │   └── ui/
│   └── lib/
│       ├── api/
│       └── hooks/
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Core Models

### `apps/quran/models.py`

```python
class Surah(models.Model):
    number = models.IntegerField(unique=True)           # 1-114
    name_arabic = models.CharField(max_length=50)
    name_transliteration = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_id = models.CharField(max_length=100)
    revelation_type = models.CharField(max_length=10)   # Meccan / Medinan
    verse_count = models.IntegerField()
    revelation_order = models.IntegerField()            # Chronological order

class Verse(models.Model):
    surah = models.ForeignKey(Surah, on_delete=models.CASCADE, related_name='verses')
    number = models.IntegerField()                      # Verse number within surah
    text_uthmani = models.TextField()                   # Arabic Uthmani script
    text_clean = models.TextField()                     # Arabic without tashkeel (for search)
    juz_number = models.IntegerField()
    page_number = models.IntegerField()
    revelation_order = models.IntegerField()            # Global chronological order

    class Meta:
        unique_together = ('surah', 'number')
        ordering = ['surah__number', 'number']

class Translation(models.Model):
    LANGUAGE_CHOICES = [('en', 'English'), ('id', 'Indonesian')]
    verse = models.ForeignKey(Verse, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES)
    translator = models.CharField(max_length=100)
    text = models.TextField()

class WordRoot(models.Model):
    root_arabic = models.CharField(max_length=20, unique=True)
    root_transliteration = models.CharField(max_length=50)
    meaning_en = models.CharField(max_length=200)
    meaning_id = models.CharField(max_length=200)

class Word(models.Model):
    verse = models.ForeignKey(Verse, on_delete=models.CASCADE, related_name='words')
    position = models.IntegerField()                    # Word position in verse
    arabic = models.CharField(max_length=100)
    transliteration = models.CharField(max_length=200)
    translation_en = models.CharField(max_length=200)
    lemma = models.CharField(max_length=100)            # Dictionary form
    root = models.ForeignKey(WordRoot, on_delete=models.SET_NULL, null=True, blank=True)
    morphology_tag = models.CharField(max_length=200)   # POS + features
    is_stopword = models.BooleanField(default=False)

    class Meta:
        ordering = ['verse', 'position']

# Materialized stats — populated via Celery task
class SurahStats(models.Model):
    surah = models.OneToOneField(Surah, on_delete=models.CASCADE)
    verse_count = models.IntegerField()
    word_count = models.IntegerField()
    letter_count = models.IntegerField()
    unique_word_count = models.IntegerField()
    unique_root_count = models.IntegerField()
    computed_at = models.DateTimeField()
```

---

## Data Ingestion

Run ingestion scripts in order:

```bash
# 1. Ingest surahs
python manage.py ingest_surahs

# 2. Ingest verses + Arabic text
python manage.py ingest_verses

# 3. Ingest translations (EN + ID)
python manage.py ingest_translations --language=en --translator_id=131
python manage.py ingest_translations --language=id --translator_id=33

# 4. Ingest word-level morphology (from Quranic Arabic Corpus)
python manage.py ingest_words

# 5. Compute materialized stats
python manage.py compute_stats

# 6. Build word frequency cache
python manage.py build_frequency_cache
```

### API Sources

```python
QURAN_API_BASE = "https://api.quran.com/api/v4"
TRANSLATION_IDS = {
    "en": 131,    # Sahih International
    "id": 33,     # Kemenag RI
}
TAFSIR_IDS = {
    "en": 169,    # Tafsir Ibn Kathir (EN)
    "id": 164,    # Tafsir Kemenag (ID)
}
```

Always implement rate limiting in ingestion scripts: 1 request/second, with retry on 429.

---

## Analytics Engine

### `apps/analytics/services.py`

Key service functions Claude Code should implement:

```python
def get_word_frequency(word: str = None, root: str = None) -> dict:
    """
    Returns total count + per-surah distribution.
    If `root` provided, matches all words sharing that root.
    If `word` provided, matches lemma exactly.
    Returns: { total, per_surah: [{surah_id, surah_name, count, verses}] }
    """

def get_root_tree(root_arabic: str) -> dict:
    """
    Returns all words derived from a trilateral root.
    Returns: { root, meaning, derivatives: [{lemma, forms, total_count, sample_verses}] }
    """

def get_cooccurrence(word1: str, word2: str) -> dict:
    """
    Finds all verses containing both word1 AND word2.
    Returns: { count, verses: [full verse objects with translations] }
    """

def get_surah_stats(surah_id: int) -> dict:
    """Returns precomputed stats from SurahStats model."""

def find_rare_words(max_count: int = 1) -> list:
    """Returns words appearing <= max_count times in the entire Quran."""

def verify_numeric_claim(word: str, expected_count: int) -> dict:
    """
    Verify a popular numeric claim (e.g. 'يوم appears 365 times').
    Returns: { claimed: 365, actual: <real_count>, verified: bool, verses: [...] }
    """
```

### Performance Rules
- All frequency queries MUST use pre-computed `word_frequency` materialized view
- Never run COUNT queries on Word table in real-time for user-facing APIs
- Cache all analytics API responses in Redis (TTL: 24h — data is static)
- Paginate verse lists: max 50 verses per page

---

## Frontend Architecture

### Key Pages

#### `/[surah]` — Reader
- Left panel: Arabic text (RTL), right-to-left, `Amiri Quran` font
- Right panel: English + Indonesian translations side by side
- Clicking any word opens a tooltip: transliteration, meaning, root, morphology
- "Analyze this word" button → jumps to `/analyze/word?lemma=...`
- Verse toolbar: bookmark, copy, share, go to tafsir

#### `/analyze/word` — Word Frequency
- Search input (Arabic keyboard helper or transliteration input)
- Results: total count badge + animated heatmap (114 surah columns)
- Scrollable verse list below the heatmap
- Toggle: by Mushaf order vs Revelation order

#### `/analyze/root` — Root Explorer
- Trilateral root input with Arabic letter picker
- Morphology tree (React tree component)
- Frequency table per derived form

#### `/analyze/structure` — Structural Patterns
- Tab: Numeric Verifier | Chiastic Structure | Paired Surahs | Verse Rhythm

#### `/explore` — Miracle Facts Explorer
- Card grid of documented patterns
- Each card: claim → click → live verification with real data
- Filter by: Numerical | Linguistic | Structural | Thematic

### Component Conventions

```tsx
// Arabic text — always use this wrapper
<ArabicText className="text-2xl font-quran leading-loose" dir="rtl">
  {verse.text_uthmani}
</ArabicText>

// Never render Arabic in a generic <p> — it needs font + direction
// Never truncate Arabic text
// Never translate or paraphrase Arabic content
```

### Arabic Input
Use `react-arabic-keyboard` or implement a simple Arabic letter picker component. Users should not need a physical Arabic keyboard to use the search tools.

---

## Environment Variables

```env
# Django
SECRET_KEY=
DEBUG=False
DATABASE_URL=postgres://user:pass@localhost:5432/quranlytics
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=

# Quran API
QURAN_API_KEY=         # optional — public endpoint works without key

# AI (Phase 4)
OPENAI_API_KEY=        # for embeddings — or use self-hosted alternative

# GCP
GCP_PROJECT_ID=
GCP_BUCKET_NAME=       # for audio file caching

# Cloudflare
CLOUDFLARE_ZONE_ID=
```

---

## Coding Standards

### General
- All Python: type hints on all function signatures
- All TypeScript: strict mode, no `any`
- All API responses: consistent envelope `{ data, meta, errors }`
- All errors: meaningful messages, never expose stack traces in production

### Arabic Text Rules (Critical)
- NEVER modify, clean up, or alter Quranic Arabic text except `text_clean` field (strip tashkeel for search only)
- ALWAYS display `text_uthmani` to users
- ALWAYS set `dir="rtl"` on Arabic containers
- Font: `Amiri Quran` for verse text, fallback `Scheherazade New`

### Analytics Rules
- NEVER compute word counts on the fly for user-facing requests
- ALWAYS read from materialized stats or Redis cache
- IF cache miss → compute and store, return result with `X-Cache: MISS` header
- Celery task `recompute_all_stats` runs nightly to keep materialized views fresh

### API Pagination
```python
# Use cursor-based pagination for verse lists
class VerseCursorPagination(CursorPagination):
    page_size = 50
    ordering = 'revelation_order'
```

---

## Docker Setup

```yaml
# docker-compose.yml (development)
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: quranlytics
      POSTGRES_USER: quran
      POSTGRES_PASSWORD: quran_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis
    env_file: .env

  celery:
    build: ./backend
    command: celery -A config worker -l info
    depends_on:
      - redis

  frontend:
    build: ./frontend
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
```

---

## Phase 1 Build Order

Claude Code should implement in this exact order:

1. **Database + Models** — all models, migrations, indexes
2. **Ingestion scripts** — ingest all 6236 verses + translations + words
3. **Core APIs** — `/surahs/`, `/verses/`, `/words/`, `/search/`
4. **Reader UI** — surah list → surah reader → verse display → word tooltip
5. **Analytics APIs** — word frequency, root tree, co-occurrence, surah stats
6. **Analytics UI** — word search → heatmap → verse list
7. **Explore page** — Miracle Facts cards with live verification
8. **Auth + Bookmarks** — JWT auth, bookmark/note endpoints + UI

---

## Known Quirks

- Surah 9 (At-Tawbah) has no Bismillah — handle this edge case in reader
- Verse 1:1 IS the Bismillah — don't double-render it
- Surah numbering in quran.com API is 1-indexed (matches standard Mushaf)
- Word position in some morphology sources is 1-indexed, some 0-indexed — normalize to 1-indexed
- Arabic letter ء (hamza) has multiple Unicode representations — normalize on ingestion

---

## What NOT to Build (Scope Limits)

- No user-generated fatwa or religious rulings
- No AI that interprets meaning — only surfaces patterns and lets users conclude
- No comment/forum system in Phase 1-3
- No automated claims about what patterns "prove" — present data, let users interpret
- No audio recording by users (playback only)
