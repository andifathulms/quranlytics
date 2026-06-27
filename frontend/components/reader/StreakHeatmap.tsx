"use client";

import { Card } from "@/components/ui/Card";

const WEEKS = 13; // ~3 months
const DAYS = WEEKS * 7;

// A GitHub-style grid of recent reading days. `readingDays` is a set of ISO
// date strings (YYYY-MM-DD); we render the last ~13 weeks ending today.
export function StreakHeatmap({ readingDays }: { readingDays: string[] }) {
  const read = new Set(readingDays);

  // Build the last DAYS dates ending today, oldest first.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: { iso: string; active: boolean }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, active: read.has(iso) });
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Reading activity</h2>
        <span className="text-xs text-muted">last {WEEKS} weeks</span>
      </div>
      <div
        className="mt-3 grid grid-flow-col gap-1"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
      >
        {cells.map((c) => (
          <span
            key={c.iso}
            title={`${c.iso}${c.active ? " · read" : ""}`}
            className={`h-3 w-3 rounded-sm ${
              c.active ? "bg-khatulistiwa" : "bg-surface-2"
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
