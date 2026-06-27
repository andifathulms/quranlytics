"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api/client";
import type { SurahTajwid, TajwidSegment, Verse } from "@/lib/api/types";
import { RECITERS } from "@/lib/audio";

import { ReaderAudioProvider, useReaderAudio } from "./ReaderAudio";
import { VerseRow } from "./VerseRow";

const STORAGE_KEY = "quranlytics:tajwid";

// Wraps the surah's verses with the recitation player and an optional tajwīd
// colour-coding layer.
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

  useEffect(() => {
    setOn(
      typeof window !== "undefined" &&
        window.localStorage.getItem(STORAGE_KEY) === "1",
    );
  }, []);

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
    <ReaderAudioProvider verses={verses}>
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-sand pb-3 dark:border-khatulistiwa/30">
        <AudioControls />
        <span className="mx-1 hidden h-4 w-px bg-sand sm:inline-block" />
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
      </div>

      {active && (
        <div className="mb-4 space-y-2">
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
          <p className="text-xs text-muted">
            A study aid covering the rules detectable from the script — not a
            substitute for learning tajwīd with a qualified teacher. The Arabic
            text is only coloured, never changed.
          </p>
        </div>
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
    </ReaderAudioProvider>
  );
}

// Play/pause the whole surah + pick a reciter. Lives inside the audio provider.
function AudioControls() {
  const { playing, currentId, playSurah, pause, reciterId, setReciterId } =
    useReaderAudio();
  const active = currentId !== null && playing;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (active ? pause() : playSurah())}
        className="rounded-lg border border-khatulistiwa px-3 py-1.5 text-sm text-khatulistiwa hover:bg-sand/40"
        title={active ? "Pause recitation" : "Play the whole surah"}
      >
        {active ? "❚❚ Pause" : "▶ Play surah"}
      </button>
      <select
        value={reciterId}
        onChange={(e) => setReciterId(e.target.value)}
        aria-label="Reciter"
        className="rounded-lg border border-sand bg-surface px-2 py-1.5 text-xs text-fg focus:border-khatulistiwa focus:outline-none"
      >
        {RECITERS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
