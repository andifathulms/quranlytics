"use client";

import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { ProphetDetail, ProphetSummary } from "@/lib/api/types";

import { VerseList } from "./VerseList";

// The 25 prophets named in the Quran. Pick one to see the verses that name him
// (direct) and the titles/by-names that refer to him (indirect / references).
export function ProphetsExplorer({
  prophets,
  methodology,
}: {
  prophets: ProphetSummary[];
  methodology: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
        {methodology}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {prophets.map((p) => (
          <ProphetCard
            key={p.id}
            prophet={p}
            open={openId === p.id}
            onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProphetCard({
  prophet,
  open,
  onToggle,
}: {
  prophet: ProphetSummary;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className={open ? "ring-1 ring-waraq sm:col-span-2 lg:col-span-3" : ""}>
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted">{prophet.order}</span>
            <span className="font-medium text-fg">{prophet.transliteration}</span>
            <span className="text-xs text-muted">· {prophet.name_en}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{prophet.blurb_en}</p>
        </div>
        <ArabicText className="shrink-0 text-2xl text-waraq">
          {prophet.arabic}
        </ArabicText>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone="emerald">{prophet.direct_count} verses name him</Badge>
        {prophet.epithet_count > 0 && (
          <Badge tone="blue">{prophet.epithet_count} other reference(s)</Badge>
        )}
      </div>

      {open && <ProphetDetailView id={prophet.id} />}
    </Card>
  );
}

function ProphetDetailView({ id }: { id: string }) {
  const [detail, setDetail] = useState<ProphetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"direct" | "refs">("direct");

  useEffect(() => {
    setLoading(true);
    api
      .prophet(id)
      .then((res) => setDetail(res.data))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load prophet"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="mt-4 h-48 w-full" />;
  if (error) return <ErrorBanner message={error} />;
  if (!detail) return null;

  const hasRefs = detail.references.length > 0;

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2 border-b border-border">
        <TabButton active={tab === "direct"} onClick={() => setTab("direct")}>
          Named directly ({detail.direct_total})
        </TabButton>
        {hasRefs && (
          <TabButton active={tab === "refs"} onClick={() => setTab("refs")}>
            Other references
          </TabButton>
        )}
      </div>

      {tab === "direct" ? (
        <div className="space-y-3">
          {detail.direct_per_surah.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {detail.direct_per_surah.map((p) => (
                <span
                  key={p.surah_id}
                  title={`${p.surah_name}: ${p.count}`}
                  className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted"
                >
                  {p.surah_id}:{p.count}
                </span>
              ))}
            </div>
          )}
          {detail.direct_verses.length > 0 ? (
            <div>
              <p className="mb-1 text-xs text-muted">
                Showing {detail.direct_verses.length} of {detail.direct_total}{" "}
                verses that name {detail.transliteration}:
              </p>
              <VerseList verses={detail.direct_verses} />
            </div>
          ) : (
            <p className="text-sm text-muted">No direct mentions found.</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted">
            Titles and by-names the Quran uses for {detail.transliteration}{" "}
            without his personal name:
          </p>
          {detail.references.map((r) => (
            <div key={r.label_en} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <ArabicText className="text-xl text-waraq">{r.arabic}</ArabicText>
                <span className="text-sm text-fg">{r.label_en}</span>
                <Badge tone="emerald">{r.count} verses</Badge>
              </div>
              {r.verses.length > 0 && <VerseList verses={r.verses} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
        active
          ? "border-waraq text-waraq"
          : "border-transparent text-lapis/60 hover:text-lapis dark:text-parchment/60 dark:hover:text-parchment"
      }`}
    >
      {children}
    </button>
  );
}
