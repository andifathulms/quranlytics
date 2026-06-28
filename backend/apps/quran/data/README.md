# Root meanings data

`root_meanings_lanes.json` maps Quranic Arabic roots (space-separated letters)
to English glosses.

- **Source content:** *Lane's Arabic-English Lexicon* (Edward William Lane,
  1863–1893), which is in the **public domain**.
- **Compilation:** aggregated from the upstream
  [Quranic Arabic Corpus](https://corpus.quran.com/) via the community dataset
  at https://github.com/Quran-Journey/roots (`model/root_meanings.json`).

Ingested into `WordRoot.meaning_en` by:

```bash
python manage.py ingest_root_meanings
```

The command is idempotent and matches on the normalized root key
(`normalize_search`), so re-running it is safe.
