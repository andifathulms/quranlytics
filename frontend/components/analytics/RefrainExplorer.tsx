"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ShareDiscoveryButton } from "@/components/community/ShareDiscoveryButton";
import { ArabicText } from "@/components/ui/ArabicText";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { PhraseSearch, RepeatedVerse } from "@/lib/api/types";

import { ArabicKeyboard } from "./ArabicKeyboard";
import { VerseList } from "./VerseList";

const TABS = [
  { key: "phrase", label: "Find a phrase" },
  { key: "repeated", label: "Repeated verses" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function RefrainExplorer() {
  const [tab, setTab] = useState<TabKey>("phrase");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-sand dark:border-khatulistiwa/40">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-waraq text-waraq"
                : "border-transparent text-lapis/60 hover:text-lapis dark:text-parchment/60 dark:hover:text-parchment"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "phrase" ? <PhraseFinder /> : <RepeatedVerses />}
    </div>
  );
}

// Find every verse containing an exact phrase (e.g. فبأي آلاء ربكما).
function PhraseFinder() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<PhraseSearch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.phraseSearch(q.trim());
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
          run();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          script="arabic"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="فبأي آلاء ربكما تكذبان"
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Find
        </Button>
      </form>

      <ArabicKeyboard onInsert={(ch) => setQ((t) => t + ch)} />

      {error && <ErrorBanner message={error} onRetry={run} />}

      {result && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ArabicText className="text-2xl">{result.phrase}</ArabicText>
            <Badge tone="emerald">{result.count} verses</Badge>
            {result.count > 0 && (
              <ShareDiscoveryButton
                title={`"${result.phrase}" appears in ${result.count} verses`}
                body={`The phrase "${result.phrase}" appears verbatim in ${result.count} verses of the Quran.`}
                category="Linguistic"
                payload={{ phrase: result.phrase, count: result.count }}
              />
            )}
          </div>
          {result.count === 0 ? (
            <EmptyState
              icon="🔍"
              title="No verses found"
              description="No verse contains that exact phrase. Try a shorter or differently-spelled phrase."
            />
          ) : (
            <VerseList verses={result.verses} />
          )}
        </div>
      )}
    </div>
  );
}

// Gallery of verses that recur verbatim across the Quran (refrains / tikrār).
function RepeatedVerses() {
  const [refrains, setRefrains] = useState<RepeatedVerse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.repeatedVerses();
      setRefrains(res.data.refrains);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load refrains");
      setRefrains(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={load} />;

  if (!refrains || refrains.length === 0) {
    return (
      <EmptyState
        icon="🔁"
        title="No repeated verses"
        description="Run the verse ingestion commands on the backend, then reload."
      />
    );
  }

  return (
    <div className="space-y-5">
      {refrains.map((r) => (
        <Card key={r.verse.id}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="gold">repeats {r.count}×</Badge>
            <span className="flex flex-wrap gap-1 text-xs text-muted">
              {r.verse_keys.map((k) => (
                <Link
                  key={k}
                  href={`/${k.split(":")[0]}`}
                  className="font-mono text-khatulistiwa hover:underline"
                >
                  {k}
                </Link>
              ))}
            </span>
            <ShareDiscoveryButton
              className="ml-auto"
              title={`A verse repeated ${r.count}× in the Quran`}
              body={`This verse appears verbatim ${r.count} times: ${r.verse_keys.join(", ")}.`}
              category="Linguistic"
              payload={{ verse_keys: r.verse_keys, count: r.count }}
            />
          </div>
          <VerseList verses={[r.verse]} />
        </Card>
      ))}
    </div>
  );
}
