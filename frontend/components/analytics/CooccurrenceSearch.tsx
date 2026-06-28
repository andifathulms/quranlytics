"use client";

import { useState } from "react";

import { ShareDiscoveryButton } from "@/components/community/ShareDiscoveryButton";
import { ArabicText } from "@/components/ui/ArabicText";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api/client";
import type { Cooccurrence } from "@/lib/api/types";

import { ArabicKeyboard } from "./ArabicKeyboard";
import { VerseList } from "./VerseList";

// Ready-made word pairs so the tool can be tried without typing Arabic. Matching
// is by lemma (dictionary form), so these are bare nouns — not "ال"-prefixed —
// and each is verified to return verses.
const EXAMPLES: { w1: string; w2: string; label: string }[] = [
  { w1: "سماء", w2: "ارض", label: "heaven ∩ earth" },
  { w1: "ليل", w2: "نهار", label: "night ∩ day" },
  { w1: "شمس", w2: "قمر", label: "sun ∩ moon" },
  { w1: "رحمة", w2: "عذاب", label: "mercy ∩ punishment" },
  { w1: "جنة", w2: "نار", label: "paradise ∩ fire" },
];

// Find every verse where two words co-occur (e.g. رحمة + عذاب).
export function CooccurrenceSearch() {
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [active, setActive] = useState<1 | 2>(1);
  const [result, setResult] = useState<Cooccurrence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(a = w1, b = w2) {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.cooccurrence(a.trim(), b.trim());
      setResult(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function tryExample(a: string, b: string) {
    setW1(a);
    setW2(b);
    run(a, b);
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
        <Input
          script="arabic"
          value={w1}
          onChange={(e) => setW1(e.target.value)}
          onFocus={() => setActive(1)}
          placeholder="الكلمة الأولى"
          className="flex-1"
        />
        <span className="font-mono text-muted">∩</span>
        <Input
          script="arabic"
          value={w2}
          onChange={(e) => setW2(e.target.value)}
          onFocus={() => setActive(2)}
          placeholder="الكلمة الثانية"
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Find
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => tryExample(ex.w1, ex.w2)}
            className="rounded-full border border-sand px-3 py-1 text-xs text-muted transition-colors hover:border-khatulistiwa hover:text-khatulistiwa"
          >
            <span dir="rtl" className="font-quran">
              {ex.w1} ∩ {ex.w2}
            </span>
            <span className="ml-1.5 text-[10px] opacity-70">{ex.label}</span>
          </button>
        ))}
      </div>

      <ArabicKeyboard onInsert={insert} />

      {error && <ErrorBanner message={error} onRetry={() => run()} />}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ArabicText className="text-2xl">{result.word1}</ArabicText>
            <span className="text-muted">&amp;</span>
            <ArabicText className="text-2xl">{result.word2}</ArabicText>
            <Badge tone="emerald">{result.count} shared verses</Badge>
            {result.count > 0 && (
              <ShareDiscoveryButton
                title={`${result.word1} and ${result.word2} co-occur in ${result.count} verses`}
                body={`The words "${result.word1}" and "${result.word2}" appear together in the same verse ${result.count} times.`}
                category="Thematic"
                payload={{ word1: result.word1, word2: result.word2, count: result.count }}
              />
            )}
          </div>
          {result.count === 0 ? (
            <EmptyState
              icon="∩"
              title="No shared verses"
              description="No verse contains both words. Try lemma (dictionary) forms of each."
            />
          ) : (
            <VerseList
              verses={result.verses}
              highlight={[result.word1, result.word2]}
            />
          )}
        </div>
      )}
    </div>
  );
}
