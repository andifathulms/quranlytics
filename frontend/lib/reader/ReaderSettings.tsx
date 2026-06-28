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

// Which translation(s) to show in reading mode. "off" keeps the clean mushaf.
export type TranslationMode = "off" | "en" | "id" | "both";

interface ReaderSettingsApi {
  arabicScale: number; // multiplier on the base Arabic font size
  incScale: () => void;
  decScale: () => void;
  translations: TranslationMode; // which translations to show in reading mode
  setTranslations: (m: TranslationMode) => void;
  playbackRate: number; // recitation speed
  setPlaybackRate: (n: number) => void;
}

interface Persisted {
  arabicScale?: number;
  translations?: TranslationMode;
  showTranslation?: boolean; // legacy boolean — migrated to translations
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
  const [translations, setTranslationsState] = useState<TranslationMode>("off");
  const [playbackRate, setPlaybackRateState] = useState(1);

  // Restore persisted preferences on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Persisted;
      if (typeof p.arabicScale === "number") setArabicScale(clampScale(p.arabicScale));
      if (p.translations) setTranslationsState(p.translations);
      else if (typeof p.showTranslation === "boolean")
        setTranslationsState(p.showTranslation ? "both" : "off"); // migrate legacy
      if (typeof p.playbackRate === "number") setPlaybackRateState(p.playbackRate);
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist whenever anything changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload: Persisted = { arabicScale, translations, playbackRate };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  }, [arabicScale, translations, playbackRate]);

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
  const setTranslations = useCallback(
    (m: TranslationMode) => setTranslationsState(m),
    [],
  );
  const setPlaybackRate = useCallback((n: number) => setPlaybackRateState(n), []);

  const api = useMemo<ReaderSettingsApi>(
    () => ({
      arabicScale,
      incScale,
      decScale,
      translations,
      setTranslations,
      playbackRate,
      setPlaybackRate,
    }),
    [
      arabicScale,
      incScale,
      decScale,
      translations,
      setTranslations,
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
