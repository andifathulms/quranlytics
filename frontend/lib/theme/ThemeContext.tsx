"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const THEME_KEY = "quranlytics.theme";

export type Theme = "day" | "sepia" | "night";
const ORDER: Theme[] = ["day", "sepia", "night"];

interface ThemeState {
  theme: Theme;
  night: boolean; // back-compat convenience
  setTheme: (t: Theme) => void;
  cycle: () => void;
}

const ThemeCtx = createContext<ThemeState | null>(null);

// Accept both the new theme names and the legacy "day"/"night" values.
function parse(saved: string | null): Theme {
  if (saved === "night" || saved === "sepia" || saved === "day") return saved;
  return "day";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("day");

  // Restore persisted preference on mount.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(THEME_KEY) : null;
    setThemeState(parse(saved));
  }, []);

  // Reflect the preference onto <html>: `dark` for Tailwind's dark: variants,
  // `sepia` for the warm reading palette. Day clears both.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "night");
    root.classList.toggle("sepia", theme === "sepia");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const cycle = useCallback(
    () => setThemeState((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]),
    [],
  );

  return (
    <ThemeCtx.Provider value={{ theme, night: theme === "night", setTheme, cycle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
