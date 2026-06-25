"use client";

import { useState } from "react";

import type { WordFrequency } from "@/lib/api/types";

// 114-cell distribution heatmap. Each cell is a surah; gold intensity scales
// with the word's count there (the PRD "Pattern Reveal" element). Cells are
// real buttons with accessible labels; tapping one shows a readout below the
// grid so the data is reachable on touch (where hover titles don't fire).
export function Heatmap({ data }: { data: WordFrequency }) {
  const counts = new Map(data.per_surah.map((p) => [p.surah_id, p]));
  const max = Math.max(1, ...data.per_surah.map((p) => p.count));
  const [selected, setSelected] = useState<number | null>(null);

  const selectedEntry = selected ? counts.get(selected) : null;
  const readout = selected
    ? selectedEntry
      ? `Surah ${selected} · ${selectedEntry.surah_name}: ${selectedEntry.count}`
      : `Surah ${selected}: 0 occurrences`
    : "Tap a cell to see its surah and count";

  return (
    <div className="rounded-lg border border-border bg-lapis p-4">
      <div className="mb-2 flex items-center justify-between text-parchment/70">
        <span className="text-xs uppercase tracking-wide">
          Distribution across 114 surahs
        </span>
        <span className="font-mono text-xs">peak {max}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 114 }, (_, i) => i + 1).map((surahNo) => {
          const entry = counts.get(surahNo);
          const intensity = entry ? entry.count / max : 0;
          const label = entry
            ? `Surah ${surahNo} (${entry.surah_name}): ${entry.count}`
            : `Surah ${surahNo}: 0`;
          return (
            <button
              key={surahNo}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={selected === surahNo}
              onClick={() => setSelected(surahNo === selected ? null : surahNo)}
              className="h-5 w-5 rounded-[2px] animate-pattern-reveal transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq sm:h-6 sm:w-6"
              style={{
                animationDelay: `${surahNo * 6}ms`,
                backgroundColor:
                  intensity > 0
                    ? `rgba(201, 168, 76, ${0.25 + intensity * 0.75})`
                    : "rgba(245, 240, 232, 0.06)",
                outline:
                  selected === surahNo ? "2px solid #C9A84C" : undefined,
              }}
            />
          );
        })}
      </div>
      <p className="mt-2 font-mono text-xs text-parchment/70" aria-live="polite">
        {readout}
      </p>
    </div>
  );
}
