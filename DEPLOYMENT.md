# Deployment

**Strategy:** CI builds two images on every push to `main` and pushes them to
GHCR. The VM holds **no source code** — only `docker-compose.prod.yml` + `.env`.
You deploy by pulling the new images and restarting.

```
push to main ──► GitHub Actions (.github/workflows/release.yml)
                   ├─ ghcr.io/<owner>/quranlytics-backend:latest  (+ :<sha>)
                   └─ ghcr.io/<owner>/quranlytics-frontend:latest (+ :<sha>)
VM: docker compose -f docker-compose.prod.yml pull && up -d
```

---

## 1. One-time GitHub setup

1. **Frontend public API URL (required).** The browser bundle bakes
   `NEXT_PUBLIC_API_BASE` at *build* time. In the repo:
   **Settings → Secrets and variables → Actions → Variables → New variable**
   - `NEXT_PUBLIC_API_BASE = https://quranlytics.example/api/v1`
   Re-run the workflow after setting it (push or **Run workflow**).
2. **Package visibility.** The first push creates two private GHCR packages.
   Either make them **public** (Package → Settings → Change visibility), or on
   the VM `docker login ghcr.io` with a PAT that has `read:packages`.
3. Nothing else — CI uses the built-in `GITHUB_TOKEN` to push.

---

## 2. VM prerequisites

- Linux VM (Ubuntu 22.04+/Debian 12 fine), Docker Engine + compose plugin.
- Outbound internet (image pulls + the one-time data seed hit external APIs).
- A reverse proxy for TLS (Caddy/Nginx/Cloudflare) in front — see §6.

```bash
# Docker (official convenience script)
curl -fsSL https://get.docker.com | sh
```

Put two files on the VM (e.g. `/opt/quranlytics/`):
- `docker-compose.prod.yml` (from this repo)
- `.env` (copy `.env.prod.example`, fill every blank — generate a real
  `SECRET_KEY`, set a strong `POSTGRES_PASSWORD` and matching `DATABASE_URL`,
  your domain in `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS`, and `IMAGE_OWNER`).

---

## 3. First deployment

```bash
cd /opt/quranlytics
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Apply DB schema (run once per deploy that adds migrations):
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate

# Admin user (optional):
docker compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
```

Health check: `curl -fsS http://localhost:8000/api/v1/health/`.

---

## 4. Seed the Quran data (one time) — **this answers "do I run the
prophets / Asmā' al-Ḥusnā normalization on the VM?"**

**Short answer: no special per-feature step.** The Prophets, Asmā' al-Ḥusnā,
Numeric-claims verifier, Tajwīd, Refrains and Chiastic features are computed
from **code + curated data that ships inside the image** — there is no
"build prophets" or "build names" command. They only need the **core text data
+ two materialized caches** to exist. The morphology lemma fix is in the code,
so a fresh `ingest_morphology` already produces correct lemmas (Mūsā 136,
Ibrāhīm 69, etc.) — nothing extra to re-run.

So the **entire** data setup is this pipeline, run **once** (the data is static):

```bash
C="docker compose -f docker-compose.prod.yml run --rm backend python manage.py"

$C ingest_surahs
$C ingest_verses
$C ingest_translations --language=en --translator_id=131   # Sahih International
$C ingest_translations --language=id --translator_id=33    # Kemenag RI
$C ingest_words
$C ingest_morphology          # roots + lemmas (Quranic Arabic Corpus)
$C compute_stats              # → SurahStats  (powers Statistics + surah headers)
$C build_frequency_cache      # → WordFrequency (powers Word Freq, 99 Names, claims)
```

What each downstream feature depends on:

| Feature | Needs |
|---|---|
| Reader, search, juzʾ/page, refrains, tajwīd | `ingest_verses` (+ `ingest_words` for word tooltips) |
| Word frequency, rare words, **Asmā' al-Ḥusnā**, **numeric claims** | `build_frequency_cache` |
| Root explorer, **Prophets** matching | `ingest_words` + `ingest_morphology` |
| Statistics, surah/% progress | `compute_stats` |

Notes:
- This seed hits `api.quran.com` and the GitHub morphology file, so the VM needs
  internet and it takes a while (translations/words are rate-limited).
- **Faster alternative:** run the pipeline once on any machine, then move the DB:
  `pg_dump` → copy → `psql` restore into the VM's `db` volume. No API load on prod.
- A nightly Celery task keeps the materialized caches fresh; you can also re-run
  `compute_stats` / `build_frequency_cache` by hand anytime.

### Semantic search & themes (optional, heavy)
These need the ML image (`torch` + `sentence-transformers`). Build the backend
with `--build-arg INSTALL_ML=true` (add it to the workflow or a separate image),
then:
```bash
$C ingest_embeddings      # ~6,236 verse embeddings (CPU-heavy, minutes)
$C cluster_themes
```
If you skip this, the rest of the app works; only `/semantic` and `/themes`
return empty. Budget extra RAM (see §7).

---

## 5. Updating (every release)

```bash
cd /opt/quranlytics
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker image prune -f
```

Pin `TAG=<commit-sha>` in `.env` for reproducible/rollback-able deploys
(`latest` always points at the newest main build).

---

## 6. Reverse proxy / TLS

The compose exposes `frontend:3000` and `backend:8000` on the host. Front them
with a proxy that terminates TLS and routes:
- `https://quranlytics.example` → `frontend:3000`
- `https://quranlytics.example/api` → `backend:8000`

`NEXT_PUBLIC_API_BASE` (build) and `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS` (env)
must match the public URLs. Production settings already trust
`X-Forwarded-Proto` and force HTTPS.

---

## 7. VM specifications

The data footprint is small (≈6.2k verses, ≈77k words, a few-thousand-row
frequency cache → a few hundred MB of Postgres). Sizing is driven by the running
services, not the data.

**Core stack (no semantic/ML) — recommended:**

| Resource | Min | Comfortable |
|---|---|---|
| vCPU | 2 | 2–4 |
| RAM | 2 GB (+1 GB swap) | **4 GB** |
| Disk (SSD) | 20 GB | **40 GB** |

Rough RAM at rest: Postgres ~300 MB · Redis ~50 MB · gunicorn (3 workers)
~400 MB · Celery worker+beat ~250 MB · Next.js ~250 MB → ~1.3 GB, so 2 GB is
tight but workable; 4 GB is comfortable headroom. Images total ~1 GB.

**With semantic search (ML image):** `torch` + the embedding model add a large
image (~3–4 GB) and load the model into RAM. Use **4 vCPU / 8 GB RAM /
60 GB SSD**; the one-time `ingest_embeddings` is CPU-bound and faster with more
cores. A managed Postgres/Redis offloads memory if you'd rather keep the app VM
small.

Smallest real-world pick: a **2 vCPU / 4 GB / 40 GB** instance (e.g. DO
basic, Hetzner CX22, Lightsail 4 GB) runs the core stack comfortably.

---

## 8. Backups

The only stateful piece is the `postgres_data` volume:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U quran quranlytics | gzip > backup-$(date +%F).sql.gz
```

Redis is a cache (rebuildable) — no backup needed.
