"use client";

import { useEffect, useRef, useState } from "react";

import {
  SCALE_MAX,
  SCALE_MIN,
  useReaderSettings,
} from "@/lib/reader/ReaderSettings";

// A small "Display" popover that consolidates the reader's display + playback
// preferences in one place instead of scattering them across the toolbar.
export function ReaderSettingsSheet() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { arabicScale, incScale, decScale, showTranslation, setShowTranslation } =
    useReaderSettings();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pct = Math.round(arabicScale * 100);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Reader display settings"
        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
          open
            ? "border-waraq bg-waraq/15 text-waraq"
            : "border-sand text-lapis/70 hover:text-lapis dark:text-parchment/70"
        }`}
      >
        ⚙︎ Display
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Reader display settings"
          className="absolute right-0 z-30 mt-2 w-64 space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xl"
        >
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Arabic text size
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={decScale}
                disabled={arabicScale <= SCALE_MIN}
                aria-label="Decrease Arabic text size"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-sm hover:bg-surface-2 disabled:opacity-40"
              >
                A−
              </button>
              <div className="flex-1 text-center text-sm tabular-nums text-muted">
                {pct}%
              </div>
              <button
                onClick={incScale}
                disabled={arabicScale >= SCALE_MAX}
                aria-label="Increase Arabic text size"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-sand text-lg hover:bg-surface-2 disabled:opacity-40"
              >
                A+
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-fg">Show translation</span>
            <input
              type="checkbox"
              checked={showTranslation}
              onChange={(e) => setShowTranslation(e.target.checked)}
              className="h-4 w-4 accent-khatulistiwa"
            />
          </label>
          <p className="-mt-2 text-xs text-muted">
            In reading mode: show meaning under each page, or tap an ayah to
            reveal it.
          </p>
        </div>
      )}
    </div>
  );
}
