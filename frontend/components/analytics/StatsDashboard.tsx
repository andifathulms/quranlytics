"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, Card } from "@/components/ui/Card";
import type { SurahStatRow } from "@/lib/api/types";

type SortDir = "none" | "desc" | "asc";

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
  const [sortDir, setSortDir] = useState<SortDir>("none");
  const [selected, setSelected] = useState<number | null>(null);

  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "";

  const max = useMemo(
    () => Math.max(1, ...rows.map((r) => r[metric])),
    [rows, metric],
  );

  // Highlights for the current metric: largest, smallest, and average surah.
  const highlight = useMemo(() => {
    if (!rows.length) return null;
    let hi = rows[0];
    let lo = rows[0];
    let sum = 0;
    for (const r of rows) {
      if (r[metric] > hi[metric]) hi = r;
      if (r[metric] < lo[metric]) lo = r;
      sum += r[metric];
    }
    return { hi, lo, avg: Math.round(sum / rows.length) };
  }, [rows, metric]);

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
    if (sortDir === "none") return rows;
    const dir = sortDir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => (a[metric] - b[metric]) * dir);
  }, [rows, metric, sortDir]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            aria-pressed={metric === m.key}
            className={`rounded-full px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              metric === m.key
                ? "bg-accent text-white"
                : "border border-border text-muted hover:bg-surface-2"
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

      {highlight && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <HighlightCard
            label={`Most ${metricLabel.toLowerCase()}`}
            row={highlight.hi}
            value={highlight.hi[metric]}
          />
          <HighlightCard
            label={`Fewest ${metricLabel.toLowerCase()}`}
            row={highlight.lo}
            value={highlight.lo[metric]}
          />
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted">
              Average per surah
            </div>
            <div className="mt-1 font-display text-2xl text-fg">
              {highlight.avg.toLocaleString()}
            </div>
            <div className="text-xs text-muted">{metricLabel.toLowerCase()}</div>
          </Card>
        </div>
      )}

      {/* Per-surah column chart (114 surahs, in Mushaf order). */}
      <div className="rounded-lg border border-border bg-lapis p-4">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-parchment/70">
          <span className="uppercase tracking-wide">{metricLabel} per surah</span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-sm bg-waraq" /> Meccan
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2 w-2 rounded-sm bg-khatulistiwa" /> Medinan
          </span>
          <span className="ml-auto font-mono" aria-live="polite">
            {selected
              ? (() => {
                  const r = rows.find((x) => x.surah_id === selected);
                  return r
                    ? `${r.surah_id}. ${r.surah_name}: ${r[metric].toLocaleString()}`
                    : "";
                })()
              : "Tap a bar"}
          </span>
        </div>
        <div className="flex h-40 items-end gap-1 overflow-x-auto">
          {rows.map((r) => (
            <button
              key={r.surah_id}
              type="button"
              title={`${r.surah_id}. ${r.surah_name}: ${r[metric].toLocaleString()}`}
              aria-label={`Surah ${r.surah_id} ${r.surah_name}: ${r[metric].toLocaleString()}`}
              aria-pressed={selected === r.surah_id}
              onClick={() =>
                setSelected(selected === r.surah_id ? null : r.surah_id)
              }
              className="w-3 shrink-0 rounded-t-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq"
              style={{
                height: `${Math.max(2, (r[metric] / max) * 100)}%`,
                backgroundColor:
                  r.revelation_type === "Meccan" ? "#C9A84C" : "#1B4F72",
                outline:
                  selected === r.surah_id ? "2px solid #F5F0E8" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Sortable table. */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left">
            <tr>
              <th className="px-3 py-2">Surah</th>
              <th className="px-3 py-2">Type</th>
              <th
                className="px-3 py-2 text-right"
                aria-sort={
                  sortDir === "desc"
                    ? "descending"
                    : sortDir === "asc"
                      ? "ascending"
                      : "none"
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setSortDir((s) =>
                      s === "none" ? "desc" : s === "desc" ? "asc" : "none",
                    )
                  }
                  className="ml-auto flex items-center gap-1 rounded font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  title="Sort"
                >
                  {metricLabel}{" "}
                  <span aria-hidden="true">
                    {sortDir === "desc" ? "↓" : sortDir === "asc" ? "↑" : "·"}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.surah_id} className="border-t border-border hover:bg-surface-2">
                <td className="px-3 py-1.5">
                  <Link
                    href={`/${r.surah_id}`}
                    className="hover:text-khatulistiwa hover:underline"
                  >
                    {r.surah_id}. {r.surah_name}
                  </Link>
                </td>
                <td className="px-3 py-1.5 text-muted">
                  {r.revelation_type}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-gold">
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

function HighlightCard({
  label,
  row,
  value,
}: {
  label: string;
  row: SurahStatRow;
  value: number;
}) {
  return (
    <Link href={`/${row.surah_id}`}>
      <Card variant="interactive">
        <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
        <div className="mt-1 font-display text-2xl text-fg">
          {value.toLocaleString()}
        </div>
        <div className="truncate text-xs text-muted">
          {row.surah_id}. {row.surah_name}
        </div>
      </Card>
    </Link>
  );
}
