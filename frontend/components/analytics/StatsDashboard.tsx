"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Card";
import type { SurahStatRow } from "@/lib/api/types";

type Metric = keyof Pick<
  SurahStatRow,
  | "verse_count"
  | "word_count"
  | "letter_count"
  | "unique_word_count"
  | "unique_root_count"
>;

const METRICS: { key: Metric; label: string }[] = [
  { key: "word_count", label: "Words" },
  { key: "letter_count", label: "Letters" },
  { key: "verse_count", label: "Verses" },
  { key: "unique_word_count", label: "Unique words" },
  { key: "unique_root_count", label: "Unique roots" },
];

export function StatsDashboard({ rows }: { rows: SurahStatRow[] }) {
  const [metric, setMetric] = useState<Metric>("word_count");
  const [sortDesc, setSortDesc] = useState(false);

  const max = useMemo(
    () => Math.max(1, ...rows.map((r) => r[metric])),
    [rows, metric],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          words: acc.words + r.word_count,
          letters: acc.letters + r.letter_count,
          verses: acc.verses + r.verse_count,
        }),
        { words: 0, letters: 0, verses: 0 },
      ),
    [rows],
  );

  const sorted = useMemo(() => {
    if (!sortDesc) return rows;
    return [...rows].sort((a, b) => b[metric] - a[metric]);
  }, [rows, metric, sortDesc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              metric === m.key
                ? "bg-khatulistiwa text-parchment"
                : "border border-sand text-lapis/70 hover:bg-sand/40"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Badge tone="emerald">{totals.words.toLocaleString()} total words</Badge>
        <Badge tone="gold">{totals.letters.toLocaleString()} total letters</Badge>
        <Badge tone="blue">{totals.verses.toLocaleString()} total verses</Badge>
      </div>

      {/* Per-surah column chart (114 surahs, in Mushaf order). */}
      <div className="rounded-lg border border-sand bg-lapis p-4">
        <div className="mb-2 flex items-center gap-3 text-xs text-parchment/70">
          <span className="uppercase tracking-wide">
            {METRICS.find((m) => m.key === metric)?.label} per surah
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-sm bg-waraq" /> Meccan
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-sm bg-khatulistiwa" /> Medinan
          </span>
        </div>
        <div className="flex h-40 items-end gap-[2px] overflow-x-auto">
          {rows.map((r) => (
            <div
              key={r.surah_id}
              title={`${r.surah_id}. ${r.surah_name}: ${r[metric].toLocaleString()}`}
              className="w-2 shrink-0 rounded-t-sm"
              style={{
                height: `${Math.max(2, (r[metric] / max) * 100)}%`,
                backgroundColor:
                  r.revelation_type === "Meccan" ? "#C9A84C" : "#1B4F72",
              }}
            />
          ))}
        </div>
      </div>

      {/* Sortable table. */}
      <div className="overflow-hidden rounded-lg border border-sand">
        <table className="w-full text-sm">
          <thead className="bg-sand/40 text-left">
            <tr>
              <th className="px-3 py-2">Surah</th>
              <th className="px-3 py-2">Type</th>
              <th
                className="cursor-pointer px-3 py-2 text-right"
                onClick={() => setSortDesc((s) => !s)}
              >
                {METRICS.find((m) => m.key === metric)?.label}{" "}
                {sortDesc ? "↓" : "·"}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.surah_id} className="border-t border-sand/60">
                <td className="px-3 py-1.5">
                  {r.surah_id}. {r.surah_name}
                </td>
                <td className="px-3 py-1.5 text-lapis/60">
                  {r.revelation_type}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-waraq">
                  {r[metric].toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
