"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api/client";
import type { Surah, VerseLengths } from "@/lib/api/types";

import { SurahSelect } from "./SurahSelect";

// Verse-length / rhythm visualizer: a column per verse (height = word count),
// plus a long/short rhythm strip relative to the surah average.
export function VerseRhythm({ surahs }: { surahs: Surah[] }) {
  const [surah, setSurah] = useState(1);
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

  const max = data ? Math.max(1, ...data.verses.map((v) => v.word_count)) : 1;
  const avg = data?.summary.avg ?? 0;

  return (
    <div className="space-y-4">
      <SurahSelect surahs={surahs} value={surah} onChange={setSurah} label="Surah" />

      {loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="emerald">{data.summary.verse_count} verses</Badge>
            <Badge tone="gold">avg {data.summary.avg} words</Badge>
            <Badge tone="blue">
              {data.summary.min}–{data.summary.max} range
            </Badge>
          </div>

          {/* Word-count column chart. Bars are focusable; selecting one fills
              the readout below (touch has no hover title). */}
          <div className="rounded-lg border border-border bg-lapis p-4">
            <div className="mb-2 flex items-center justify-between text-parchment/70">
              <span className="text-xs uppercase tracking-wide">
                Words per verse
              </span>
              <span className="font-mono text-xs" aria-live="polite">
                {selected
                  ? (() => {
                      const v = data.verses.find(
                        (x) => x.verse_key === selected,
                      );
                      return v
                        ? `${v.verse_key}: ${v.word_count} words · ${v.letter_count} letters`
                        : "";
                    })()
                  : "Tap a bar"}
              </span>
            </div>
            <div className="flex h-40 items-end gap-1 overflow-x-auto">
              {data.verses.map((v) => (
                <button
                  key={v.verse_key}
                  type="button"
                  title={`${v.verse_key}: ${v.word_count} words, ${v.letter_count} letters`}
                  aria-label={`Verse ${v.verse_key}: ${v.word_count} words, ${v.letter_count} letters`}
                  aria-pressed={selected === v.verse_key}
                  onClick={() =>
                    setSelected(selected === v.verse_key ? null : v.verse_key)
                  }
                  className="w-3 shrink-0 rounded-t-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq"
                  style={{
                    height: `${Math.max(2, (v.word_count / max) * 100)}%`,
                    backgroundColor:
                      v.word_count >= avg ? "#C9A84C" : "#1B4F72",
                    outline:
                      selected === v.verse_key ? "2px solid #F5F0E8" : undefined,
                  }}
                />
              ))}
            </div>
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
                  title={`${v.verse_key}: ${v.word_count} words`}
                  className={
                    v.word_count >= avg ? "text-waraq" : "text-khatulistiwa/60"
                  }
                >
                  {v.word_count >= avg ? "▰" : "▱"}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
