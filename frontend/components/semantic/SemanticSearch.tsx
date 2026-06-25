"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api/client";
import type { SemanticResult } from "@/lib/api/types";

import { ScoredVerseList } from "./ScoredVerseList";

const EXAMPLES = [
  "mercy and forgiveness",
  "patience in hardship",
  "the creation of the heavens",
  "kasih sayang kepada orang tua",
];

// Natural-language semantic search — embeds the query and ranks verses by
// meaning, not keywords. Works across English, Indonesian, and Arabic.
export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SemanticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.semanticSearch(q.trim(), 20);
      setResult(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask in plain language — e.g. 'mercy and forgiveness'"
          className="flex-1 rounded-lg border border-sand bg-white px-4 py-2 text-lapis focus:border-khatulistiwa focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-khatulistiwa px-5 py-2 text-parchment hover:bg-lapis disabled:opacity-50"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuery(ex);
              run(ex);
            }}
            className="rounded-full border border-sand px-3 py-1 text-lapis/60 hover:bg-sand/40 dark:text-parchment/60"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-lapis/60 dark:text-parchment/60">
              Results for “{result.query}”
            </span>
            <Badge tone="blue">{result.count} verses</Badge>
          </div>
          <ScoredVerseList verses={result.verses} />
        </div>
      )}
    </div>
  );
}
