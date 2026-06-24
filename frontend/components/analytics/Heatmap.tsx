"use client";

import type { WordFrequency } from "@/lib/api/types";

// 114-column distribution heatmap. Each column is a surah; gold intensity
// scales with the word's count there (the PRD "Pattern Reveal" element).
export function Heatmap({ data }: { data: WordFrequency }) {
  const counts = new Map(data.per_surah.map((p) => [p.surah_id, p]));
  const max = Math.max(1, ...data.per_surah.map((p) => p.count));

  return (
    <div className="rounded-lg border border-sand bg-lapis p-4">
      <div className="mb-2 flex items-center justify-between text-parchment/70">
        <span className="text-xs uppercase tracking-wide">
          Distribution across 114 surahs
        </span>
        <span className="font-mono text-xs">peak {max}</span>
      </div>
      <div className="flex flex-wrap gap-[3px]">
        {Array.from({ length: 114 }, (_, i) => i + 1).map((surahNo) => {
          const entry = counts.get(surahNo);
          const intensity = entry ? entry.count / max : 0;
          return (
            <div
              key={surahNo}
              title={
                entry
                  ? `Surah ${surahNo} (${entry.surah_name}): ${entry.count}`
                  : `Surah ${surahNo}: 0`
              }
              className="h-4 w-4 rounded-[2px] animate-pattern-reveal"
              style={{
                animationDelay: `${surahNo * 6}ms`,
                backgroundColor:
                  intensity > 0
                    ? `rgba(201, 168, 76, ${0.25 + intensity * 0.75})`
                    : "rgba(245, 240, 232, 0.06)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
