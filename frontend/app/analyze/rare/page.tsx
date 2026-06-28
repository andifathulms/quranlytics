"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { RareWord } from "@/lib/api/types";

export default function RareWordsPage() {
  const [threshold, setThreshold] = useState(1);
  const [page, setPage] = useState(1);
  const [words, setWords] = useState<RareWord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  // Reset to the first page whenever the threshold changes.
  useEffect(() => {
    setPage(1);
  }, [threshold]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .rareWords(threshold, page)
      .then((res) => {
        if (!active) return;
        setWords(res.data.words);
        setTotal(res.data.total);
        setPageSize(res.data.page_size);
      })
      .catch((e) => active && setError(e instanceof ApiError ? e.message : "Failed to load"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [threshold, page, reload]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-fg">Rare Word Finder</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Words (by lemma) that occur at most a few times in the whole Quran.
          A threshold of 1 lists hapax legomena — words used exactly once.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Max occurrences:</span>
        {[1, 2, 3].map((t) => (
          <button
            key={t}
            onClick={() => setThreshold(t)}
            aria-pressed={threshold === t}
            className={`rounded-full px-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              threshold === t
                ? "bg-accent text-white"
                : "border border-border text-muted hover:bg-surface-2"
            }`}
          >
            ≤ {t}
          </button>
        ))}
        {!loading && <Badge tone="emerald">{total} words</Badge>}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />}
      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {words.map((w) => (
              <Card key={w.lemma} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ArabicText className="text-2xl">{w.lemma}</ArabicText>
                    <Badge tone="gold">{w.count}×</Badge>
                  </div>
                  {w.gloss && (
                    <p className="mt-1 truncate text-xs text-muted" title={w.gloss}>
                      {w.gloss}
                    </p>
                  )}
                </div>
                {w.verse_key && (
                  <Link
                    href={`/${w.verse_key.split(":")[0]}?hl=${encodeURIComponent(w.lemma)}#${w.verse_key.replace(":", "-")}`}
                    className="shrink-0 font-mono text-xs text-khatulistiwa hover:underline"
                  >
                    {w.verse_key}
                  </Link>
                )}
              </Card>
            ))}
          </div>

          {pageCount > 1 && (
            <nav className="flex items-center justify-center gap-4 pt-2 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border px-3 py-1.5 text-muted hover:bg-surface-2 disabled:opacity-40"
              >
                ‹ Prev
              </button>
              <span className="text-muted">
                Page {page} of {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                className="rounded-lg border border-border px-3 py-1.5 text-muted hover:bg-surface-2 disabled:opacity-40"
              >
                Next ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
