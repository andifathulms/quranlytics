"use client";

import { useState } from "react";

import { ShareDiscoveryButton } from "@/components/community/ShareDiscoveryButton";
import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api/client";
import type { NumericClaim } from "@/lib/api/types";

export interface MiracleFact {
  id: string;
  category: "Numerical" | "Linguistic" | "Structural" | "Thematic";
  title: string;
  word: string;
  claimed: number;
  description: string;
}

// A curated claim that the reader verifies against live data — the platform
// never asserts what a pattern "proves"; it surfaces the count and lets the
// user conclude.
export function MiracleCard({ fact }: { fact: MiracleFact }) {
  const [result, setResult] = useState<NumericClaim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyClaim(fact.word, fact.claimed);
      setResult(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <Badge tone="blue">{fact.category}</Badge>
        <ArabicText className="text-2xl text-khatulistiwa">
          {fact.word}
        </ArabicText>
      </div>
      <h3 className="mt-2 font-display text-lg">{fact.title}</h3>
      <p className="mt-1 flex-1 text-sm text-lapis/70">{fact.description}</p>

      <div className="mt-3">
        {result ? (
          <div className="rounded-lg bg-sand/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Claimed</span>
              <span className="font-mono">{result.claimed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Actual (live count)</span>
              <span className="font-mono text-waraq">{result.actual}</span>
            </div>
            <div className="mt-2">
              <Badge tone={result.verified ? "emerald" : "gold"}>
                {result.verified ? "✓ Matches" : "✗ Differs"}
              </Badge>
            </div>
            {result.verses.length > 0 && (
              <div className="mt-2 font-mono text-xs text-lapis/50">
                e.g. {result.verses.slice(0, 8).join(" · ")}
              </div>
            )}
            <div className="mt-3">
              <ShareDiscoveryButton
                title={`${fact.word}: claimed ${result.claimed}, actual ${result.actual}`}
                body={`Verifying the claim "${fact.title}" against live data: claimed ${result.claimed}, actual count ${result.actual} — ${result.verified ? "matches" : "differs"}.`}
                category="Numerical"
                payload={{
                  word: fact.word,
                  claimed: result.claimed,
                  actual: result.actual,
                  verified: result.verified,
                }}
              />
            </div>
          </div>
        ) : (
          <button
            onClick={verify}
            disabled={loading}
            className="w-full rounded-lg border border-khatulistiwa px-3 py-2 text-sm text-khatulistiwa hover:bg-sand/40 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify with live data →"}
          </button>
        )}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </Card>
  );
}
