"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api/client";
import type { SurahTajwid, TajwidSegment, Verse } from "@/lib/api/types";

import { VerseRow } from "./VerseRow";

const STORAGE_KEY = "quranlytics:tajwid";

// Wraps the surah's verses with an optional tajwīd colour-coding layer. The
// toggle is remembered; when on, we fetch the surah's per-verse segments once
// and hand each VerseRow its coloured spans.
export function ReaderVerses({
  surahId,
  verses,
}: {
  surahId: number;
  verses: Verse[];
}) {
  const [on, setOn] = useState(false);
  const [data, setData] = useState<SurahTajwid | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore the saved preference on mount.
  useEffect(() => {
    setOn(
      typeof window !== "undefined" &&
        window.localStorage.getItem(STORAGE_KEY) === "1",
    );
  }, []);

  // Fetch segments the first time colours are switched on for this surah.
  useEffect(() => {
    if (!on || data || loading) return;
    setLoading(true);
    api
      .surahTajwid(surahId)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [on, data, loading, surahId]);

  function toggle() {
    const next = !on;
    setOn(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    }
  }

  const segmentsByKey = useMemo(() => {
    const map: Record<string, TajwidSegment[]> = {};
    for (const v of data?.verses ?? []) map[v.verse_key] = v.segments;
    return map;
  }, [data]);

  const ruleColors = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of data?.legend ?? []) map[r.id] = r.color;
    return map;
  }, [data]);

  const active = on && Boolean(data);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-sand pb-3 dark:border-khatulistiwa/30">
        <button
          onClick={toggle}
          aria-pressed={on}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            on
              ? "border-waraq bg-waraq/15 text-waraq"
              : "border-sand text-lapis/70 hover:text-lapis dark:text-parchment/70"
          }`}
        >
          🎨 Tajwīd colours {on ? "on" : "off"}
        </button>
        {on && loading && (
          <span className="text-xs text-muted">Loading colours…</span>
        )}
        {active && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {data!.legend.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-muted">{r.label_en}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {active && (
        <p className="mb-4 text-xs text-muted">
          A study aid covering the rules detectable from the script — not a
          substitute for learning tajwīd with a qualified teacher. The Arabic
          text is only coloured, never changed.
        </p>
      )}

      <section>
        {verses.map((v) => (
          <VerseRow
            key={v.id}
            verse={v}
            tajwid={active ? segmentsByKey[v.verse_key] : undefined}
            ruleColors={active ? ruleColors : undefined}
          />
        ))}
      </section>
    </div>
  );
}
