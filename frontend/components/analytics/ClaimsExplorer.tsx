"use client";

import { useEffect, useState } from "react";

import { ShareDiscoveryButton } from "@/components/community/ShareDiscoveryButton";
import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type {
  ClaimVerdict,
  NumericClaimDetail,
  NumericClaimSummary,
} from "@/lib/api/types";

import { VerseList } from "./VerseList";

const VERDICT: Record<
  ClaimVerdict,
  { tone: "emerald" | "gold" | "danger"; label: string }
> = {
  verified: { tone: "emerald", label: "✓ Holds up" },
  disputed: { tone: "gold", label: "≈ Depends how you count" },
  refuted: { tone: "danger", label: "✗ Doesn’t hold" },
};

// Honest verifier: popular numeric claims, each checked live against the corpus
// and labelled Verified / Disputed / Refuted — with the data shown so the
// reader can judge.
export function ClaimsExplorer({
  claims,
  categories,
  methodology,
}: {
  claims: NumericClaimSummary[];
  categories: string[];
  methodology: string;
}) {
  const [cat, setCat] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered =
    cat === "All" ? claims : claims.filter((c) => c.category === cat);

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
        {methodology}
      </p>

      <div className="flex flex-wrap gap-2 text-xs">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1 transition-colors ${
              cat === c
                ? "border-waraq bg-waraq/15 text-waraq"
                : "border-sand text-muted hover:text-fg"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <ClaimCard
            key={c.id}
            claim={c}
            open={openId === c.id}
            onToggle={() => setOpenId(openId === c.id ? null : c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ClaimCard({
  claim,
  open,
  onToggle,
}: {
  claim: NumericClaimSummary;
  open: boolean;
  onToggle: () => void;
}) {
  const v = VERDICT[claim.verdict];
  return (
    <Card className={open ? "ring-1 ring-waraq lg:col-span-2" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-wide text-muted">
            {claim.category}
          </span>
          <h3 className="font-medium text-fg">{claim.title}</h3>
        </div>
        <Badge tone={v.tone}>{v.label}</Badge>
      </div>

      <p className="mt-2 text-sm text-muted">{claim.claim_en}</p>

      <div className="mt-3 space-y-1">
        <div className="text-xs text-muted">
          Claimed: <span className="text-fg">{claim.claimed_display}</span>
        </div>
        {claim.terms.map((t) => (
          <div key={t.lemma} className="flex items-center gap-2 text-sm">
            <ArabicText className="text-lg">{t.lemma}</ArabicText>
            <span className="text-muted">{t.label}</span>
            <Badge tone="blue">{t.count} in the Quran</Badge>
          </div>
        ))}
      </div>

      <p className="mt-3 border-l-2 border-sand pl-3 text-sm text-lapis/80 dark:text-parchment/70">
        {claim.note_en}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={onToggle}
          className="text-xs text-khatulistiwa hover:underline"
        >
          {open ? "Hide verses" : "Show the verses →"}
        </button>
        <ShareDiscoveryButton
          title={`${claim.title} — ${v.label}`}
          body={`${claim.claim_en} Checked live: ${claim.terms
            .map((t) => `${t.lemma} = ${t.count}`)
            .join(", ")}. ${claim.note_en}`}
          category={
            (["Numerical", "Linguistic", "Structural", "Thematic"].includes(
              claim.category,
            )
              ? claim.category
              : "Other") as
              | "Numerical"
              | "Linguistic"
              | "Structural"
              | "Thematic"
              | "Other"
          }
          payload={{ id: claim.id, verdict: claim.verdict }}
        />
      </div>

      {open && <ClaimVerses id={claim.id} />}
    </Card>
  );
}

function ClaimVerses({ id }: { id: string }) {
  const [detail, setDetail] = useState<NumericClaimDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .numericClaim(id)
      .then((res) => setDetail(res.data))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load verses"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="mt-4 h-40 w-full" />;
  if (error) return <ErrorBanner message={error} />;
  if (!detail) return null;

  return (
    <div className="mt-4 space-y-5 border-t border-border pt-4">
      {detail.terms.map((t) => (
        <div key={t.lemma} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <ArabicText className="text-xl text-waraq">{t.lemma}</ArabicText>
            <span className="text-sm text-muted">{t.label}</span>
            <Badge tone="emerald">{t.count} occurrences</Badge>
          </div>
          {t.verses.length > 0 && (
            <>
              <p className="text-xs text-muted">
                Showing {t.verses.length} of {t.verse_total} verses:
              </p>
              <VerseList verses={t.verses} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
