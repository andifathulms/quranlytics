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
  const [words, setWords] = useState<RareWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .rareWords(threshold)
      .then((res) => active && setWords(res.data.words))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : "Failed to load"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [threshold, reload]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-fg">Rare Word Finder</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Words (by lemma) that occur at most a few times in the whole Quran.
          A threshold of 1 lists hapax legomena — words used exactly once.
        </p>
      </header>

      <div className="flex items-center gap-2 text-sm">
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
        {!loading && <Badge tone="emerald">{words.length} words</Badge>}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setReload((n) => n + 1)} />}
      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((w) => (
            <Card key={w.lemma} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArabicText className="text-2xl">{w.lemma}</ArabicText>
                <Badge tone="gold">{w.count}×</Badge>
              </div>
              {w.verse_key && (
                <Link
                  href={`/${w.verse_key.split(":")[0]}?hl=${encodeURIComponent(w.lemma)}#${w.verse_key.replace(":", "-")}`}
                  className="font-mono text-xs text-khatulistiwa hover:underline"
                >
                  {w.verse_key}
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
