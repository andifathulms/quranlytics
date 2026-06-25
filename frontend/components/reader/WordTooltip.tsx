"use client";

import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import type { Word } from "@/lib/api/types";

// Morphology detail shown when a reader taps a word: transliteration, meaning,
// root, morphology, plus jumps into the analyzers. Rendered as the content of a
// Popover/bottom-sheet (see VerseRow), so it owns no positioning of its own.
export function WordTooltip({
  word,
  onClose,
}: {
  word: Word;
  onClose: () => void;
}) {
  return (
    <div className="text-left">
      <div className="flex items-start justify-between">
        <ArabicText className="text-2xl text-fg">{word.arabic}</ArabicText>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      {word.transliteration && (
        <div className="mt-1 text-sm italic text-muted">
          {word.transliteration}
        </div>
      )}
      {word.translation_en && (
        <div className="text-sm text-fg">{word.translation_en}</div>
      )}
      <dl className="mt-2 space-y-1 text-xs text-muted">
        {word.lemma && (
          <div>
            <span className="font-semibold">Lemma:</span> {word.lemma}
          </div>
        )}
        {word.root && (
          <div className="flex items-center gap-1">
            <span className="font-semibold">Root:</span>
            <ArabicText className="text-base">
              {word.root.root_display || word.root.root_arabic}
            </ArabicText>
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
            className="rounded bg-accent px-2 py-1.5 text-center text-xs text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Analyze this word →
          </Link>
        )}
        {word.root && (
          <Link
            href={`/analyze/root?root=${encodeURIComponent(word.root.root_arabic)}`}
            className="rounded border border-accent px-2 py-1.5 text-center text-xs text-accent hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Explore root →
          </Link>
        )}
      </div>
    </div>
  );
}
