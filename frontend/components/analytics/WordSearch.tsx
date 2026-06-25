"use client";

import { useEffect, useRef, useState } from "react";

import { ShareDiscoveryButton } from "@/components/community/ShareDiscoveryButton";
import { ArabicText } from "@/components/ui/ArabicText";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { SkeletonHeatmap } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { WordFrequency } from "@/lib/api/types";

import { ArabicKeyboard } from "./ArabicKeyboard";
import { Heatmap } from "./Heatmap";

// Word frequency tool: search a word/lemma, reveal the heatmap + per-surah list.
export function WordSearch({ initialWord = "" }: { initialWord?: string }) {
  const [term, setTerm] = useState(initialWord);
  const [result, setResult] = useState<WordFrequency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(word: string) {
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.wordFrequency({ word: word.trim() });
      setResult(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Auto-run when arriving with a prefilled word (deep link / example chip).
  const ranFor = useRef<string | null>(null);
  useEffect(() => {
    if (initialWord && ranFor.current !== initialWord) {
      ranFor.current = initialWord;
      setTerm(initialWord);
      run(initialWord);
    }
  }, [initialWord]);

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(term);
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          script="arabic"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ادخل كلمة…"
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Analyze
        </Button>
      </form>

      <ArabicKeyboard onInsert={(ch) => setTerm((t) => t + ch)} />

      {error && <ErrorBanner message={error} onRetry={() => run(term)} />}

      {loading && !result && <SkeletonHeatmap />}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ArabicText className="text-3xl">{result.query}</ArabicText>
            <Badge tone="emerald">{result.total} occurrences</Badge>
            <Badge tone="blue">{result.per_surah.length} surahs</Badge>
            {result.total > 0 && (
              <ShareDiscoveryButton
                title={`The word ${result.query} appears ${result.total} times`}
                body={`Searching the Quran, the word "${result.query}" occurs ${result.total} times across ${result.per_surah.length} surahs.`}
                category="Linguistic"
                payload={{ word: result.query, total: result.total }}
              />
            )}
          </div>

          {result.total === 0 ? (
            <EmptyState
              icon="∅"
              title="No occurrences found"
              description="Try the lemma (dictionary form) of the word — search matches the exact lemma."
            />
          ) : (
            <>
              <Heatmap data={result} />
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 text-left">
                    <tr>
                      <th className="px-3 py-2">Surah</th>
                      <th className="px-3 py-2 text-right font-mono">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.per_surah.map((p) => (
                      <tr key={p.surah_id} className="border-t border-border">
                        <td className="px-3 py-1.5">
                          {p.surah_id}. {p.surah_name}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-gold">
                          {p.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
