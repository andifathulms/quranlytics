"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/lib/api/client";
import type { SurahTajwid, TajwidSegment, Verse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { RECITERS } from "@/lib/audio";
import { usePersistentToggle } from "@/lib/hooks/usePersistentToggle";
import { useToast } from "@/lib/toast/ToastContext";

import { ReaderAudioProvider, useReaderAudio } from "./ReaderAudio";
import { READING_MODE_KEY, ReadingFlow } from "./ReadingFlow";
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
  const [memorize, setMemorize] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [reading, toggleReading] = usePersistentToggle(READING_MODE_KEY);

  // This surah's reading progress (for the header), and a one-time nudge when
  // the daily goal is reached while reading.
  const { progress } = useAuth();
  const { toast } = useToast();
  const total = verses.length;
  const furthest = progress?.progress?.[String(surahId)] ?? 0;
  const surahCompleted = furthest >= total && furthest > 0;
  const surahPct = furthest ? Math.min(100, Math.round((furthest / total) * 100)) : 0;

  const goalMet = progress?.goal_met ?? false;
  const hasProgress = Boolean(progress);
  const prevGoalMet = useRef<boolean | null>(null);
  useEffect(() => {
    if (!hasProgress) return;
    if (prevGoalMet.current === false && goalMet) {
      toast("✓ Daily reading goal reached — bārak Allāhu fīk!", "success");
    }
    prevGoalMet.current = goalMet;
  }, [goalMet, hasProgress, toast]);

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
      {progress && furthest > 0 && (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className={surahCompleted ? "text-[#1e7e44] dark:text-emerald" : "text-muted"}>
            {surahCompleted ? "✓ Completed" : `Ayah ${furthest} of ${total}`}
          </span>
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${surahCompleted ? "bg-emerald" : "bg-waraq"}`}
              style={{ width: `${surahPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-sand pb-3 dark:border-khatulistiwa/30">
        <AudioControls />
        <span className="mx-1 hidden h-4 w-px bg-sand sm:inline-block" />
        <button
          onClick={toggleReading}
          aria-pressed={reading}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            reading
              ? "border-waraq bg-waraq/15 text-waraq"
              : "border-sand text-lapis/70 hover:text-lapis dark:text-parchment/70"
          }`}
        >
          📖 Reading mode {reading ? "on" : "off"}
        </button>
        {!reading && (
          <>
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
            <button
              onClick={() => setMemorize((m) => !m)}
              aria-pressed={memorize}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                memorize
                  ? "border-waraq bg-waraq/15 text-waraq"
                  : "border-sand text-lapis/70 hover:text-lapis dark:text-parchment/70"
              }`}
            >
              🧠 Memorize {memorize ? "on" : "off"}
            </button>
          </>
        )}
        {on && loading && (
          <span className="text-xs text-muted">Loading colours…</span>
        )}
      </div>

      {!reading && memorize && (
        <HifzControls hideText={hideText} setHideText={setHideText} />
      )}

      {!reading && active && (
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

      {reading ? (
        <ReadingFlow verses={verses} />
      ) : (
        <section>
          {verses.map((v) => (
            <VerseRow
              key={v.id}
              verse={v}
              tajwid={active ? segmentsByKey[v.verse_key] : undefined}
              ruleColors={active ? ruleColors : undefined}
              hidden={memorize && hideText}
            />
          ))}
        </section>
      )}
    </ReaderAudioProvider>
  );
}

const REPEAT_OPTIONS: { label: string; value: number }[] = [
  { label: "×1", value: 1 },
  { label: "×3", value: 3 },
  { label: "×5", value: 5 },
  { label: "loop", value: Infinity },
];

// Ḥifẓ controls: how many times each verse repeats before advancing, whether to
// loop the surah, and whether to hide the text for self-testing.
function HifzControls({
  hideText,
  setHideText,
}: {
  hideText: boolean;
  setHideText: (v: boolean) => void;
}) {
  const { repeat, setRepeat, loopSurah, setLoopSurah } = useReaderAudio();

  // Leaving memorize mode restores normal playback (these live in the
  // session-persistent audio context, so reset them on unmount).
  useEffect(() => {
    return () => {
      setRepeat(1);
      setLoopSurah(false);
      setHideText(false);
    };
  }, [setRepeat, setLoopSurah, setHideText]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-waraq/40 bg-waraq/5 px-3 py-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        Repeat each verse
      </span>
      <div className="flex gap-1">
        {REPEAT_OPTIONS.map((o) => (
          <button
            key={o.label}
            onClick={() => setRepeat(o.value)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              repeat === o.value
                ? "bg-waraq/30 text-waraq"
                : "text-lapis/60 hover:bg-waraq/15 dark:text-parchment/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <input
          type="checkbox"
          checked={loopSurah}
          onChange={(e) => setLoopSurah(e.target.checked)}
        />
        Loop surah
      </label>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <input
          type="checkbox"
          checked={hideText}
          onChange={(e) => setHideText(e.target.checked)}
        />
        Hide text (tap a verse to reveal)
      </label>
    </div>
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
