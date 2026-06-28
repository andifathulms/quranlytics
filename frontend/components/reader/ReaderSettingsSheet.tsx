"use client";

import { useEffect, useRef, useState } from "react";

import {
  SCALE_MAX,
  SCALE_MIN,
  SPEEDS,
  type TranslationMode,
  useReaderSettings,
} from "@/lib/reader/ReaderSettings";

const TRANSLATION_OPTS: { value: TranslationMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "en", label: "EN" },
  { value: "id", label: "ID" },
  { value: "both", label: "Both" },
];

// A small "Display" popover that consolidates the reader's display + playback
// preferences in one place instead of scattering them across the toolbar.
export function ReaderSettingsSheet() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    arabicScale,
    incScale,
    decScale,
    translations,
    setTranslations,
    playbackRate,
    setPlaybackRate,
  } = useReaderSettings();

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

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Translation (reading mode)
            </div>
            <div className="flex gap-1">
              {TRANSLATION_OPTS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setTranslations(o.value)}
                  aria-pressed={translations === o.value}
                  className={`flex-1 rounded-lg border px-1 py-1.5 text-xs transition-colors ${
                    translations === o.value
                      ? "border-waraq bg-waraq/15 text-waraq"
                      : "border-sand text-muted hover:bg-surface-2"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">
              When Off, tap an ayah to reveal its translation.
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Recitation speed
            </div>
            <div className="flex gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackRate(s)}
                  aria-pressed={playbackRate === s}
                  className={`flex-1 rounded-lg border px-1 py-1.5 text-xs tabular-nums transition-colors ${
                    playbackRate === s
                      ? "border-waraq bg-waraq/15 text-waraq"
                      : "border-sand text-muted hover:bg-surface-2"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
