"use client";

import type { SurahOrder } from "@/lib/surahOrder";

// Mushaf / Revelation segmented toggle, shared by the surah browser and the
// structural-analysis selectors.
export function OrderToggle({
  value,
  onChange,
}: {
  value: SurahOrder;
  onChange: (order: SurahOrder) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Surah order"
      className="inline-flex overflow-hidden rounded-lg border border-surface-2 text-sm"
    >
      {(
        [
          ["mushaf", "Mushaf", "Standard order, as printed in the Mushaf"],
          ["revelation", "Revelation", "Chronological order of revelation"],
        ] as [SurahOrder, string, string][]
      ).map(([val, label, title]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          aria-pressed={value === val}
          title={title}
          className={
            value === val
              ? "bg-lapis px-3 py-1.5 font-medium text-parchment"
              : "px-3 py-1.5 text-muted hover:bg-surface-2"
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
