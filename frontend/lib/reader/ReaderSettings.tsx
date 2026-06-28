"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Reader display + playback preferences, persisted together as one JSON blob and
// shared across every reader surface (surah, juzʾ, page). Kept separate from the
// app theme (ThemeContext) because these are reading-specific.
const KEY = "quranlytics:reader";

export const SCALE_MIN = 0.8;
export const SCALE_MAX = 1.8;
const SCALE_STEP = 0.1;

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

interface ReaderSettingsApi {
  arabicScale: number; // multiplier on the base Arabic font size
  incScale: () => void;
  decScale: () => void;
  showTranslation: boolean; // show translations inline in reading mode
  setShowTranslation: (b: boolean) => void;
  playbackRate: number; // recitation speed
  setPlaybackRate: (n: number) => void;
}

interface Persisted {
  arabicScale?: number;
  showTranslation?: boolean;
  playbackRate?: number;
}

const clampScale = (n: number) =>
  Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(n * 10) / 10));

const Ctx = createContext<ReaderSettingsApi | null>(null);

export function ReaderSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [arabicScale, setArabicScale] = useState(1);
  const [showTranslation, setShowTranslationState] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);

  // Restore persisted preferences on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Persisted;
      if (typeof p.arabicScale === "number") setArabicScale(clampScale(p.arabicScale));
      if (typeof p.showTranslation === "boolean") setShowTranslationState(p.showTranslation);
      if (typeof p.playbackRate === "number") setPlaybackRateState(p.playbackRate);
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist whenever anything changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: Persisted = { arabicScale, showTranslation, playbackRate };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  }, [arabicScale, showTranslation, playbackRate]);

  // Expose the Arabic scale as a CSS variable so `.quran-verse` text resizes
  // everywhere without threading the value through every component.
  useEffect(() => {
    document.documentElement.style.setProperty("--quran-scale", String(arabicScale));
  }, [arabicScale]);

  const incScale = useCallback(
    () => setArabicScale((s) => clampScale(s + SCALE_STEP)),
    [],
  );
  const decScale = useCallback(
    () => setArabicScale((s) => clampScale(s - SCALE_STEP)),
    [],
  );
  const setShowTranslation = useCallback(
    (b: boolean) => setShowTranslationState(b),
    [],
  );
  const setPlaybackRate = useCallback((n: number) => setPlaybackRateState(n), []);

  const api = useMemo<ReaderSettingsApi>(
    () => ({
      arabicScale,
      incScale,
      decScale,
      showTranslation,
      setShowTranslation,
      playbackRate,
      setPlaybackRate,
    }),
    [
      arabicScale,
      incScale,
      decScale,
      showTranslation,
      setShowTranslation,
      playbackRate,
      setPlaybackRate,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useReaderSettings(): ReaderSettingsApi {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useReaderSettings must be used within ReaderSettingsProvider");
  return ctx;
}
