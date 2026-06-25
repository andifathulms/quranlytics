"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { DivineNameDetail, DivineNameSummary } from "@/lib/api/types";

import { VerseList } from "./VerseList";

// Asmā' al-Ḥusnā: a browsable grid of the 99 names; clicking one reveals its
// occurrences, per-surah spread, and the verses themselves.
export function DivineNamesExplorer({
  names,
  methodology,
}: {
  names: DivineNameSummary[];
  methodology: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
        {methodology}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((n) => (
          <NameCard
            key={n.id}
            name={n}
            open={openId === n.id}
            onToggle={() => setOpenId(openId === n.id ? null : n.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NameCard({
  name,
  open,
  onToggle,
}: {
  name: DivineNameSummary;
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
            <span className="font-mono text-xs text-muted">
              {name.number === 0 ? "★" : name.number}
            </span>
            <span className="font-medium text-fg">{name.transliteration}</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted">{name.meaning_en}</p>
        </div>
        <ArabicText className="shrink-0 text-2xl text-waraq">
          {name.arabic}
        </ArabicText>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {name.count !== null ? (
          <Badge tone="emerald">{name.count} occurrences</Badge>
        ) : (
          <Badge tone="neutral">explore via root</Badge>
        )}
        {name.root && (
          <Link
            href={`/analyze/root?root=${encodeURIComponent(name.root)}`}
            className="text-xs text-khatulistiwa hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            root {name.root} →
          </Link>
        )}
      </div>

      {open && <NameDetail id={name.id} />}
    </Card>
  );
}

function NameDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<DivineNameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch once when the card expands (this component mounts on expand).
  useEffect(() => {
    setLoading(true);
    api
      .divineName(id)
      .then((res) => setDetail(res.data))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load name"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="mt-4 h-40 w-full" />;
  if (error) return <ErrorBanner message={error} />;
  if (!detail) return null;

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <p className="text-sm text-muted">
        <span className="text-fg">{detail.transliteration}</span> —{" "}
        {detail.meaning_en} · {detail.meaning_id}
      </p>

      {detail.lemma === null ? (
        <p className="text-sm text-muted">
          This name is a phrase or is expressed through related word-forms rather
          than a single word.{" "}
          {detail.root && (
            <Link
              href={`/analyze/root?root=${encodeURIComponent(detail.root)}`}
              className="text-khatulistiwa hover:underline"
            >
              Explore its root ({detail.root}) →
            </Link>
          )}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald">{detail.total ?? 0} word-form occurrences</Badge>
            <Badge tone="blue">{detail.per_surah.length} surahs</Badge>
            <Link
              href={`/analyze/word?word=${encodeURIComponent(detail.lemma)}`}
              className="text-xs text-khatulistiwa hover:underline"
            >
              open in Word Frequency →
            </Link>
          </div>

          {detail.per_surah.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {detail.per_surah.map((p) => (
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

          {detail.verses.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-muted">
                Showing {detail.verses.length} of {detail.verse_total} verses
                containing this word-form:
              </p>
              <VerseList verses={detail.verses} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
