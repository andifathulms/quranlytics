"use client";

// Simple Arabic letter picker so users don't need a physical Arabic keyboard
// (CLAUDE.md: search tools must be usable without one).
// Each entry pairs the glyph with its name for an accessible label.
const LETTERS: Array<[string, string]> = [
  ["ا", "alif"], ["ب", "ba"], ["ت", "ta"], ["ث", "tha"], ["ج", "jim"],
  ["ح", "ha"], ["خ", "kha"], ["د", "dal"], ["ذ", "dhal"], ["ر", "ra"],
  ["ز", "zay"], ["س", "sin"], ["ش", "shin"], ["ص", "sad"], ["ض", "dad"],
  ["ط", "ta (emphatic)"], ["ظ", "za (emphatic)"], ["ع", "ayn"], ["غ", "ghayn"], ["ف", "fa"],
  ["ق", "qaf"], ["ك", "kaf"], ["ل", "lam"], ["م", "mim"], ["ن", "nun"],
  ["ه", "ha (soft)"], ["و", "waw"], ["ي", "ya"], ["ء", "hamza"], ["ة", "ta marbuta"],
  ["ى", "alif maqsura"], ["أ", "alif with hamza above"], ["إ", "alif with hamza below"],
  ["آ", "alif madda"], ["ؤ", "waw with hamza"], ["ئ", "ya with hamza"],
];

export function ArabicKeyboard({
  onInsert,
}: {
  onInsert: (char: string) => void;
}) {
  return (
    <div
      dir="rtl"
      role="group"
      aria-label="Arabic letter picker"
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-2"
    >
      {LETTERS.map(([ch, name]) => (
        <button
          key={ch}
          type="button"
          onClick={() => onInsert(ch)}
          aria-label={`Insert ${name}`}
          className="h-10 w-10 rounded font-quran text-lg text-fg hover:bg-waraq/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
