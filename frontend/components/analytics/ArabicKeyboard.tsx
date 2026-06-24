"use client";

// Simple Arabic letter picker so users don't need a physical Arabic keyboard
// (CLAUDE.md: search tools must be usable without one).
const LETTERS = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر",
  "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف",
  "ق", "ك", "ل", "م", "ن", "ه", "و", "ي", "ء", "ة",
  "ى", "أ", "إ", "آ", "ؤ", "ئ",
];

export function ArabicKeyboard({
  onInsert,
}: {
  onInsert: (char: string) => void;
}) {
  return (
    <div dir="rtl" className="flex flex-wrap gap-1 rounded-lg border border-sand bg-white/60 p-2">
      {LETTERS.map((ch) => (
        <button
          key={ch}
          type="button"
          onClick={() => onInsert(ch)}
          className="h-9 w-9 rounded font-quran text-lg hover:bg-waraq/20"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
