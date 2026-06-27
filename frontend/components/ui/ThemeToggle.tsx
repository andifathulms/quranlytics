"use client";

import { useTheme } from "@/lib/theme/ThemeContext";

const LABELS = {
  day: { icon: "☀", title: "Day", next: "sepia" },
  sepia: { icon: "❧", title: "Sepia", next: "night" },
  night: { icon: "☾", title: "Night", next: "day" },
} as const;

// Cycles the reading theme: day → sepia → night → day.
export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const { icon, title, next } = LABELS[theme];
  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${title}. Switch to ${next} mode.`}
      title={`${title} — tap for ${next}`}
      className="rounded p-1 text-base text-parchment/70 hover:text-waraq focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-waraq focus-visible:ring-offset-2 focus-visible:ring-offset-lapis"
    >
      {icon}
    </button>
  );
}
