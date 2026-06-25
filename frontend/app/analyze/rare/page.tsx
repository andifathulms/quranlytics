"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api/client";
import type { RareWord } from "@/lib/api/types";

export default function RareWordsPage() {
  const [threshold, setThreshold] = useState(1);
  const [words, setWords] = useState<RareWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [threshold]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Rare Word Finder</h1>
        <p className="text-lapis/60 dark:text-parchment/60">
          Words (by lemma) that occur at most a few times in the whole Quran.
          A threshold of 1 lists hapax legomena — words used exactly once.
        </p>
      </header>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-lapis/60 dark:text-parchment/60">Max occurrences:</span>
        {[1, 2, 3].map((t) => (
          <button
            key={t}
            onClick={() => setThreshold(t)}
            className={`rounded-full px-3 py-1 ${
              threshold === t
                ? "bg-khatulistiwa text-parchment"
                : "border border-sand text-lapis/70 dark:text-parchment/70"
            }`}
          >
            ≤ {t}
          </button>
        ))}
        {!loading && <Badge tone="emerald">{words.length} words</Badge>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>
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
                  href={`/${w.verse_key.split(":")[0]}`}
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
