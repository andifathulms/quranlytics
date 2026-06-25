"use client";

import { useTheme } from "@/lib/theme/ThemeContext";

// Night / reading mode toggle.
export function ThemeToggle() {
  const { night, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={night ? "Switch to day mode" : "Switch to night mode"}
      title={night ? "Day mode" : "Night mode"}
      className="rounded p-1 text-base text-parchment/70 hover:text-waraq"
    >
      {night ? "☀" : "☾"}
    </button>
  );
}
