"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/client";
import type { Surah, VerseLengths } from "@/lib/api/types";
import type { SurahOrder } from "@/lib/surahOrder";

import { SurahSelect } from "./SurahSelect";

type Metric = "word_count" | "letter_count";
const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: "word_count", label: "Words", unit: "words" },
  { key: "letter_count", label: "Letters", unit: "letters" },
];

// Verse-length / rhythm visualizer: a column per verse (height = chosen metric),
// an average reference line, plus a long/short rhythm strip relative to average.
export function VerseRhythm({
  surahs,
  order = "mushaf",
}: {
  surahs: Surah[];
  order?: SurahOrder;
}) {
  const [surah, setSurah] = useState(1);
  const [metric, setMetric] = useState<Metric>("word_count");
  const [data, setData] = useState<VerseLengths | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .verseLengths(surah)
      .then((res) => active && setData(res.data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [surah]);

  const unit = METRICS.find((m) => m.key === metric)?.unit ?? "";
  const { max, avg } = useMemo(() => {
    if (!data?.verses.length) return { max: 1, avg: 0 };
    const vals = data.verses.map((v) => v[metric]);
    return {
      max: Math.max(1, ...vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    };
  }, [data, metric]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <SurahSelect
          surahs={surahs}
          value={surah}
          onChange={setSurah}
          label="Surah"
          order={order}
        />
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              aria-pressed={metric === m.key}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                metric === m.key
                  ? "border-accent bg-accent text-white"
                  : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="emerald">{data.summary.verse_count} verses</Badge>
            <Badge tone="gold">avg {Math.round(avg)} {unit}</Badge>
            <Badge tone="blue">
              {Math.min(...data.verses.map((v) => v[metric]))}–
              {Math.max(...data.verses.map((v) => v[metric]))} range
            </Badge>
          </div>

          {/* Column chart with an average reference line. Bars are focusable;
              selecting one fills the readout (touch has no hover title). */}
          <div className="rounded-lg border border-border bg-lapis p-4">
            <div className="mb-2 flex items-center justify-between text-parchment/70">
              <span className="text-xs uppercase tracking-wide">
                {METRICS.find((m) => m.key === metric)?.label} per verse
              </span>
              <span className="font-mono text-xs" aria-live="polite">
                {selected
                  ? (() => {
                      const v = data.verses.find((x) => x.verse_key === selected);
                      return v
                        ? `${v.verse_key}: ${v.word_count} words · ${v.letter_count} letters`
                        : "";
                    })()
                  : "Tap a bar"}
              </span>
            </div>
            <div className="relative flex h-40 items-end gap-1 overflow-x-auto">
              {/* average line */}
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-parchment/40"
                style={{ bottom: `${(avg / max) * 100}%` }}
                aria-hidden="true"
              />
              {data.verses.map((v) => (
                <button
                  key={v.verse_key}
                  type="button"
                  title={`${v.verse_key}: ${v[metric]} ${unit}`}
                  aria-label={`Verse ${v.verse_key}: ${v.word_count} words, ${v.letter_count} letters`}
                  aria-pressed={selected === v.verse_key}
                  onClick={() =>
                    setSelected(selected === v.verse_key ? null : v.verse_key)
                  }
                  className="w-3 shrink-0 rounded-t-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq"
                  style={{
                    height: `${Math.max(2, (v[metric] / max) * 100)}%`,
                    backgroundColor:
                      v[metric] >= avg ? "#C9A84C" : "#1B4F72",
                    outline:
                      selected === v.verse_key ? "2px solid #F5F0E8" : undefined,
                  }}
                />
              ))}
            </div>
            {selected && (
              <Link
                href={`/${surah}#${selected.replace(":", "-")}`}
                className="mt-2 inline-block text-xs text-waraq hover:underline"
              >
                Open {selected} in the reader →
              </Link>
            )}
          </div>

          {/* Rhythm strip: long (above avg) vs short (below). */}
          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-muted">
              Rhythm — long ▰ / short ▱ relative to average
            </div>
            <div dir="rtl" className="flex flex-wrap gap-[3px] font-mono text-lg leading-none">
              {data.verses.map((v) => (
                <span
                  key={v.verse_key}
                  title={`${v.verse_key}: ${v[metric]} ${unit}`}
                  className={
                    v[metric] >= avg ? "text-waraq" : "text-khatulistiwa/60"
                  }
                >
                  {v[metric] >= avg ? "▰" : "▱"}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
