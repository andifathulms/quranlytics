import type { Config } from "tailwindcss";

// Palette from PRD §7 — "Illuminated Manuscript meets Data Dashboard".
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lapis: "#0D1B2A", // primary background, reader mode
        khatulistiwa: "#1B4F72", // accent
        waraq: "#C9A84C", // gold — verse numbers, highlights
        parchment: "#F5F0E8", // light mode background
        sand: "#E8D5A3", // secondary surfaces (light)
        emerald: "#2ECC71", // positive data, found patterns
      },
      fontFamily: {
        quran: ["var(--font-amiri-quran)", "Scheherazade New", "serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      keyframes: {
        "pattern-reveal": {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pattern-reveal": "pattern-reveal 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
