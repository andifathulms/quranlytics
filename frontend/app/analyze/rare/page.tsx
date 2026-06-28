"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { RareResult } from "@/lib/api/types";

type Mode = "lemma" | "root";

export default function RareWordsPage() {
  const [by, setBy] = useState<Mode>("lemma");
  const [threshold, setThreshold] = useState(1);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<RareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  // Reset to the first page whenever the lens or threshold changes.
  useEffect(() => {
    setPage(1);
  }, [by, threshold]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .rareWords(threshold, page, by)
      .then((res) => active && setResult(res.data))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : "Failed to load"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [by, threshold, page, reload]);

  const total = result?.total ?? 0;
  const pageSize = result?.page_size ?? 60;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-fg">Rare Word Finder</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Words that occur at most a few times in the whole Quran. By{" "}
          <strong>lemma</strong> each dictionary form is counted on its own; by{" "}
          <strong>root</strong> all words sharing a trilateral root are grouped,
          surfacing genuinely rare vocabulary rather than rare inflections.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {(["lemma", "root"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setBy(m)}
              aria-pressed={by === m}
              className={`px-3 py-1.5 capitalize transition-colors ${
                by === m
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-surface-2"
              }`}
            >
              by {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
        </div>

        {!loading && (
          <Badge tone="emerald">
            {total} {by === "root" ? "roots" : "words"}
          </Badge>
        )}
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
            {result?.mode === "root"
              ? result.words.map((r) => (
                  <Card key={r.root_key} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/analyze/root?root=${encodeURIComponent(r.root_key)}`}>
                          <ArabicText className="text-2xl hover:text-khatulistiwa">
                            {r.root}
                          </ArabicText>
                        </Link>
                        <Badge tone="gold">{r.count}×</Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted" title={r.meaning}>
                        {r.transliteration}
                        {r.meaning ? ` · ${r.meaning}` : ""}
                      </p>
                    </div>
                    {r.verse_key && (
                      <Link
                        href={`/${r.verse_key.split(":")[0]}#${r.verse_key.replace(":", "-")}`}
                        className="shrink-0 font-mono text-xs text-khatulistiwa hover:underline"
                      >
                        {r.verse_key}
                      </Link>
                    )}
                  </Card>
                ))
              : result?.words.map((w) => (
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
                      {w.root && (
                        <Link
                          href={`/analyze/root?root=${encodeURIComponent(w.root_key || w.root)}`}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-khatulistiwa"
                          title={
                            typeof w.root_count === "number" && w.root_count >= 20
                              ? "A rare form of a common root"
                              : "Explore this root"
                          }
                        >
                          <span>root</span>
                          <ArabicText className="text-sm">{w.root}</ArabicText>
                          {typeof w.root_count === "number" && (
                            <span
                              className={
                                w.root_count >= 20 ? "font-medium text-waraq" : ""
                              }
                            >
                              · {w.root_count}×
                            </span>
                          )}
                        </Link>
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
