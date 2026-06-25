"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const THEME_KEY = "quranlytics.theme";

interface ThemeState {
  night: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [night, setNight] = useState(false);

  // Restore persisted preference on mount.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    if (saved === "night") setNight(true);
  }, []);

  // Reflect the preference onto <html> so Tailwind's `dark:` variants apply.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", night);
    localStorage.setItem(THEME_KEY, night ? "night" : "day");
  }, [night]);

  const toggle = useCallback(() => setNight((n) => !n), []);

  return <ThemeCtx.Provider value={{ night, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
