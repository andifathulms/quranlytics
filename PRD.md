# PRD — Quranlytics: Quranic Pattern Intelligence Platform

## Overview

**Product Name:** Quranlytics  
**Tagline:** *"Read the Quran. Understand its patterns. Discover its miracles."*  
**Owner:** Andi Fathul Mukminin Salahuddin  
**Stack:** Django + DRF · React/Next.js · PostgreSQL · Docker · GCP  
**Data Source:** api.quran.com (public API) + open Quran JSON datasets  

---

## 1. Problem Statement

Existing Quran platforms (quran.com, tanzil.net, equran.id) excel at *reading* — beautiful typography, audio recitation, translations. But they offer no tools for *analytical exploration*. Scholars have documented remarkable numerical and linguistic patterns in the Quran for centuries, yet an ordinary reader has no accessible way to discover or verify these patterns interactively.

Quranlytics bridges this gap: a full Quran reader with a built-in analytical layer that lets users *discover* the mathematical, linguistic, and structural miracles of the Quran themselves.

---

## 2. Target Users

| Persona | Goal |
|---|---|
| **Muslim students & general readers** | Read daily with translation, discover patterns organically |
| **Islamic scholars & researchers** | Deep linguistic/numerical analysis, export data |
| **Da'wah content creators** | Quickly find shareable miracle facts with citations |
| **Non-Muslim curious readers** | Explore the Quran's structure neutrally and analytically |

**Primary locale:** Indonesian + English  
**Secondary locale:** Arabic (display only, not UI language)

---

## 3. Core Feature Areas

### 3.1 — Quran Reader (Foundation Layer)

- Full Arabic text with proper Uthmani script rendering
- Side-by-side translations: **English** (Sahih International) + **Indonesian** (Kemenag RI)
- Surah browser + Juz browser + verse-by-verse navigation
- Tafsir panel (expandable, Ibn Kathir / Kemenag)
- Bookmarks, highlights, personal notes
- Audio recitation (via quran.com API)
- Night mode / reading mode

### 3.2 — Word Analysis Engine

The core analytical differentiator.

**Word Frequency Map**
- Search any Arabic word or root — see total occurrences, per-surah breakdown
- Heatmap across all 114 surahs (color-coded by density)
- Timeline across revelation order vs Mushaf order

**Root Word Analysis (Arabic Morphology)**
- Input any trilateral root (e.g. ك-ت-ب)
- See all derived words, their forms, frequencies, and verse locations
- Morphology tree visualization

**Word Co-occurrence**
- Which words appear together most frequently?
- "Show me every verse where رحمة (mercy) and عذاب (punishment) appear in the same verse"
- Network graph of semantic neighbors

**Rare Word Finder**
- Hapax legomena — words that appear only once in the entire Quran
- Words unique to specific surahs

### 3.3 — Structural Pattern Analysis

**Numerical Analysis**
- Word/verse/letter counts per surah, per juz, per theme
- Famous patterns explorer:
  - "The word يوم (Day) appears 365 times"
  - "The word شهر (Month) appears 12 times"
  - User-verifiable with click-through to every verse
- Symmetric verse count checker between paired surahs
- Custom count: count any word/root/phrase yourself

**Chiastic Structure Detector (Ring Composition)**
- A–B–C–B'–A' pattern visualization
- Known chiastic structures pre-loaded, user can submit new ones

**Surah Symmetry**
- Surah Al-Fatihah structure visualizer
- Paired surah analysis (e.g. Al-Falaq & An-Nas)
- First/last verse comparison across surah pairs

**Verse Length Distribution**
- Bar chart of verse lengths (by word count) per surah
- Rhythm pattern visualizer — long/short verse alternation

### 3.4 — Semantic & Theme Analysis

**Theme Clustering**
- Browse verses by topic: Tawhid, Prophethood, Judgment Day, Ethics, Science, etc.
- AI-assisted: ask a question in natural language → receive thematically grouped verses

**Cross-Reference Engine**
- Select a verse → see all thematically related verses (semantic similarity)
- Compare same story across multiple surahs (e.g. Prophet Musa across the Quran)

**Miracle Facts Explorer**
- Curated database of documented Quranic numerical/linguistic miracles
- Each fact is *interactive* — click any claim to verify it yourself with live data
- User-submitted discoveries with community voting

### 3.5 — Personal Analytics Dashboard

- Reading streak & history
- "Words I've explored" personal lexicon
- Saved patterns & discoveries
- Export to PDF/PNG for sharing

---

## 4. Data Architecture

### Quran Data Sources

```
Primary:   https://api.quran.com/api/v4/  (free, comprehensive)
Fallback:  Quran JSON (github.com/semarketir/quranjson)
Arabic:    Tanzil Quran Text (tanzil.net) — Uthmani script
Morphology: Quranic Arabic Corpus (corpus.quran.com) — word-level morphology
```

### Local Database Schema (PostgreSQL)

```
surah (114 rows)
  id, name_arabic, name_transliteration, name_en, name_id,
  revelation_type, verse_count, juz_start, revelation_order

verse
  id, surah_id, verse_number, text_uthmani, text_clean,
  juz_number, page_number, revelation_order

translation
  id, verse_id, language, translator, text

word
  id, verse_id, position, arabic, transliteration, translation,
  root, morphology_tag, lemma

word_root
  id, root_arabic (3-4 chars), root_transliteration, meaning_en, meaning_id

surah_stats (materialized)
  surah_id, verse_count, word_count, letter_count,
  unique_word_count, unique_root_count

word_frequency (materialized)
  word_lemma / root, total_count, surah_distribution (jsonb)
```

### Indexing Strategy

- Full-text search index on `word.arabic` + `word.root`
- GIN index on `word_frequency.surah_distribution`
- Trigram index (`pg_trgm`) for fuzzy Arabic search

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────┐
│                  Next.js 14                 │
│  (App Router · TypeScript · Tailwind CSS)   │
│                                             │
│  /reader        — Quran reading interface   │
│  /analyze       — Pattern analysis tools    │
│  /explore       — Miracle facts browser     │
│  /dashboard     — Personal analytics        │
└─────────────────┬───────────────────────────┘
                  │ REST + WebSocket
┌─────────────────▼───────────────────────────┐
│              Django 5 + DRF                 │
│                                             │
│  apps/quran      — verses, surahs, words    │
│  apps/analytics  — frequency, patterns      │
│  apps/semantic   — AI-powered search        │
│  apps/users      — auth, bookmarks, history │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           PostgreSQL 16                     │
│  + pg_trgm (fuzzy search)                  │
│  + Full-text search (Arabic + Latin)        │
│  + Materialized views (word frequencies)    │
└─────────────────────────────────────────────┘

Additional services:
  Redis        — caching frequent analytics queries
  Celery       — background: re-compute materialized stats
  GCP Cloud Run — containerized deployment
  Cloudflare   — CDN + caching Arabic assets
```

---

## 6. API Design

### Quran Reader APIs
```
GET /api/v1/surahs/                          — list all 114 surahs
GET /api/v1/surahs/{id}/verses/              — verses with translations
GET /api/v1/verses/{id}/words/               — word-level breakdown
GET /api/v1/search/?q=&lang=ar|en|id         — full-text search
```

### Analytics APIs
```
GET /api/v1/analytics/word-frequency/?word=&root=
    → { total, per_surah: [{surah_id, count}], verses: [...] }

GET /api/v1/analytics/root-tree/?root=كتب
    → { root, derivatives: [{word, form, count, verses}] }

GET /api/v1/analytics/co-occurrence/?word1=&word2=
    → { shared_verses: [...], count }

GET /api/v1/analytics/surah-stats/{surah_id}/
    → { verse_count, word_count, letter_count, unique_words, ... }

GET /api/v1/analytics/count/?word=&scope=quran|surah:{id}|juz:{n}
    → { count, verses: [...] }

GET /api/v1/analytics/rare-words/?threshold=1
    → { words: [{word, count, verse_id}] }

POST /api/v1/analytics/semantic-search/
    body: { query: "mercy and forgiveness" }
    → { verses: [...with similarity scores] }
```

---

## 7. UI/UX Direction

### Design Language: *"Illuminated Manuscript meets Data Dashboard"*

Inspired by the aesthetic of classical Islamic geometric art and the precision of data visualization — not a generic dark-mode app, not a plain white reader.

**Color Palette:**
- `#0D1B2A` — Deep Lapis (primary background, reader mode)
- `#1B4F72` — Khatulistiwa Blue (accent, matches OIKN familiarity)
- `#C9A84C` — Waraq Gold (verse numbers, highlights — evokes illuminated manuscripts)
- `#F5F0E8` — Parchment (light mode background)
- `#E8D5A3` — Sand (secondary surfaces in light mode)
- `#2ECC71` — Emerald (positive data, found patterns)

**Typography:**
- Arabic: `Amiri Quran` (purpose-built for Quranic text, Google Fonts)
- Display: `Playfair Display` (chapter headers — classical gravitas)
- Body/UI: `Inter` (clean data presentation)
- Data/Numbers: `JetBrains Mono` (verse counts, statistics)

**Signature Element:**
The **Pattern Reveal animation** — when a word frequency result loads, dots appear one by one across a Quran map (114 columns = surahs, rows = verses) pulsing gold wherever the word occurs, giving an immediate visual sense of distribution before numbers appear.

---

## 8. Phases

### Phase 1 — Reader Foundation (6 weeks)
- Data ingestion pipeline (quran.com API → local PostgreSQL)
- Full Quran reader: Arabic + EN + ID translations
- Basic search
- Surah/Juz navigation
- Bookmarks & notes
- Mobile responsive

### Phase 2 — Core Analytics (8 weeks)
- Word frequency analysis + heatmap
- Root word explorer + morphology tree
- Co-occurrence analysis
- Surah statistics dashboard
- Verse count verifier (numerical miracle tool)

### Phase 3 — Advanced Analysis (6 weeks)
- Rare word finder
- Verse length / rhythm analysis
- Chiastic structure visualizer
- Paired surah symmetry tool
- Miracle Facts Explorer (curated + user-submitted)

### Phase 4 — AI Layer (4 weeks)
- Semantic verse search (embedding-based)
- Natural language question → verse clusters
- Theme clustering engine
- Cross-reference engine

### Phase 5 — Community & Sharing (4 weeks)
- User accounts + personal analytics
- Discovery sharing (PNG/PDF export of findings)
- Community submissions & voting on miracle claims
- Public profile: "my discoveries"

---

## 9. Non-Goals (for now)

- No live user-to-user features (forum, comments)
- No mobile native app (PWA is sufficient initially)
- No paid tier — fully free, open source
- No automated fatwa/religious ruling generation via AI

---

## 10. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Monthly Active Users | 10,000+ |
| Average session duration | > 8 minutes |
| Analytics tool usage rate | > 40% of sessions |
| Discoveries submitted by users | > 100 |
| Page load time (reader) | < 1.5s |

---

## 11. Open Questions

1. Should Arabic morphology be computed locally (using `camel-tools` Python library) or sourced entirely from Quranic Arabic Corpus API?
2. License implications of Tanzil text vs quran.com API — confirm terms before production use
3. AI semantic search: use OpenAI embeddings or self-hosted multilingual model? (Cost vs privacy tradeoff)
4. Should Indonesian Tafsir (Kemenag) be scraped/licensed or linked externally?
