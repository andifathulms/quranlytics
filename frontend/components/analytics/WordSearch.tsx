"use client";

import { useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge } from "@/components/ui/Card";
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

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(term);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          dir="rtl"
          placeholder="ادخل كلمة…"
          className="flex-1 rounded-lg border border-sand bg-white px-4 py-2 text-xl font-quran focus:border-khatulistiwa focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-khatulistiwa px-5 py-2 text-parchment hover:bg-lapis disabled:opacity-50"
        >
          {loading ? "…" : "Analyze"}
        </button>
      </form>

      <ArabicKeyboard onInsert={(ch) => setTerm((t) => t + ch)} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ArabicText className="text-3xl">{result.query}</ArabicText>
            <Badge tone="emerald">{result.total} occurrences</Badge>
            <Badge tone="blue">{result.per_surah.length} surahs</Badge>
          </div>

          {result.total === 0 ? (
            <p className="text-lapis/60">
              No occurrences found. Try the lemma (dictionary form) of the word.
            </p>
          ) : (
            <>
              <Heatmap data={result} />
              <div className="overflow-hidden rounded-lg border border-sand">
                <table className="w-full text-sm">
                  <thead className="bg-sand/40 text-left">
                    <tr>
                      <th className="px-3 py-2">Surah</th>
                      <th className="px-3 py-2 text-right font-mono">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.per_surah.map((p) => (
                      <tr key={p.surah_id} className="border-t border-sand/60">
                        <td className="px-3 py-1.5">
                          {p.surah_id}. {p.surah_name}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-waraq">
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
