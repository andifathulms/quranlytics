"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
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
export function SemanticSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
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

  // Auto-run when arriving with a prefilled query (e.g. from global search).
  const ranFor = useRef<string | null>(null);
  useEffect(() => {
    if (initialQuery && ranFor.current !== initialQuery) {
      ranFor.current = initialQuery;
      setQuery(initialQuery);
      run(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask in plain language — e.g. 'mercy and forgiveness'"
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuery(ex);
              run(ex);
            }}
            className="rounded-full border border-border px-3 py-1 text-muted hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => run(query)} />}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">
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
