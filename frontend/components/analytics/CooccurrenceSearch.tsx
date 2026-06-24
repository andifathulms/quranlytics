"use client";

import { useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api/client";
import type { Cooccurrence } from "@/lib/api/types";

import { ArabicKeyboard } from "./ArabicKeyboard";
import { VerseList } from "./VerseList";

// Find every verse where two words co-occur (e.g. رحمة + عذاب).
export function CooccurrenceSearch() {
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [active, setActive] = useState<1 | 2>(1);
  const [result, setResult] = useState<Cooccurrence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!w1.trim() || !w2.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.cooccurrence(w1.trim(), w2.trim());
      setResult(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const insert = (ch: string) =>
    active === 1 ? setW1((t) => t + ch) : setW2((t) => t + ch);

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          value={w1}
          onChange={(e) => setW1(e.target.value)}
          onFocus={() => setActive(1)}
          dir="rtl"
          placeholder="الكلمة الأولى"
          className="flex-1 rounded-lg border border-sand bg-white px-4 py-2 text-xl font-quran focus:border-khatulistiwa focus:outline-none"
        />
        <span className="font-mono text-lapis/50">∩</span>
        <input
          value={w2}
          onChange={(e) => setW2(e.target.value)}
          onFocus={() => setActive(2)}
          dir="rtl"
          placeholder="الكلمة الثانية"
          className="flex-1 rounded-lg border border-sand bg-white px-4 py-2 text-xl font-quran focus:border-khatulistiwa focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-khatulistiwa px-5 py-2 text-parchment hover:bg-lapis disabled:opacity-50"
        >
          {loading ? "…" : "Find"}
        </button>
      </form>

      <ArabicKeyboard onInsert={insert} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ArabicText className="text-2xl">{result.word1}</ArabicText>
            <span className="text-lapis/50">&amp;</span>
            <ArabicText className="text-2xl">{result.word2}</ArabicText>
            <Badge tone="emerald">{result.count} shared verses</Badge>
          </div>
          {result.count === 0 ? (
            <p className="text-lapis/60">
              No verse contains both words. Try lemma (dictionary) forms.
            </p>
          ) : (
            <VerseList verses={result.verses} />
          )}
        </div>
      )}
    </div>
  );
}
