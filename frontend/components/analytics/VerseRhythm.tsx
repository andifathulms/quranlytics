"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Surah, VerseLengths } from "@/lib/api/types";

import { SurahSelect } from "./SurahSelect";

// Verse-length / rhythm visualizer: a column per verse (height = word count),
// plus a long/short rhythm strip relative to the surah average.
export function VerseRhythm({ surahs }: { surahs: Surah[] }) {
  const [surah, setSurah] = useState(1);
  const [data, setData] = useState<VerseLengths | null>(null);
  const [loading, setLoading] = useState(true);

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
        <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="emerald">{data.summary.verse_count} verses</Badge>
            <Badge tone="gold">avg {data.summary.avg} words</Badge>
            <Badge tone="blue">
              {data.summary.min}–{data.summary.max} range
            </Badge>
          </div>

          {/* Word-count column chart. */}
          <div className="rounded-lg border border-sand bg-lapis p-4">
            <div className="mb-2 text-xs uppercase tracking-wide text-parchment/70">
              Words per verse
            </div>
            <div className="flex h-40 items-end gap-[2px] overflow-x-auto">
              {data.verses.map((v) => (
                <div
                  key={v.verse_key}
                  title={`${v.verse_key}: ${v.word_count} words, ${v.letter_count} letters`}
                  className="w-2 shrink-0 rounded-t-sm"
                  style={{
                    height: `${Math.max(2, (v.word_count / max) * 100)}%`,
                    backgroundColor:
                      v.word_count >= avg ? "#C9A84C" : "#1B4F72",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Rhythm strip: long (above avg) vs short (below). */}
          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-lapis/50 dark:text-parchment/50">
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
