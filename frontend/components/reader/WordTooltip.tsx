"use client";

import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import type { Word } from "@/lib/api/types";

// Tooltip shown when a reader clicks a word: transliteration, meaning, root,
// morphology, plus a jump into the word-frequency analyzer.
export function WordTooltip({
  word,
  onClose,
}: {
  word: Word;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-sand bg-white p-3 text-left shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between">
        <ArabicText className="text-2xl text-lapis">{word.arabic}</ArabicText>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-lapis/40 hover:text-lapis"
        >
          ×
        </button>
      </div>
      {word.transliteration && (
        <div className="mt-1 text-sm italic text-lapis/70">
          {word.transliteration}
        </div>
      )}
      {word.translation_en && (
        <div className="text-sm text-lapis">{word.translation_en}</div>
      )}
      <dl className="mt-2 space-y-1 text-xs text-lapis/70">
        {word.lemma && (
          <div>
            <span className="font-semibold">Lemma:</span> {word.lemma}
          </div>
        )}
        {word.root && (
          <div className="flex items-center gap-1">
            <span className="font-semibold">Root:</span>
            <ArabicText className="text-base">{word.root.root_arabic}</ArabicText>
            <span>({word.root.root_transliteration})</span>
          </div>
        )}
        {word.morphology_tag && (
          <div>
            <span className="font-semibold">Morphology:</span>{" "}
            {word.morphology_tag}
          </div>
        )}
      </dl>
      <div className="mt-3 flex flex-col gap-1">
        {word.lemma && (
          <Link
            href={`/analyze/word?word=${encodeURIComponent(word.lemma)}`}
            className="rounded bg-khatulistiwa px-2 py-1 text-center text-xs text-parchment hover:bg-lapis"
          >
            Analyze this word →
          </Link>
        )}
        {word.root && (
          <Link
            href={`/analyze/root?root=${encodeURIComponent(word.root.root_arabic)}`}
            className="rounded border border-khatulistiwa px-2 py-1 text-center text-xs text-khatulistiwa hover:bg-sand/40"
          >
            Explore root →
          </Link>
        )}
      </div>
    </div>
  );
}
