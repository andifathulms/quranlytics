"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { wordAudioUrl } from "@/lib/audio";
import { useLemmaLinks } from "@/lib/hooks/useLemmaLinks";
import { describeSegment } from "@/lib/morphology";
import type { Word } from "@/lib/api/types";

// Morphology detail shown when a reader taps a word: transliteration, meaning,
// root, morphology, plus jumps into the analyzers. Rendered as the content of a
// Popover/bottom-sheet (see VerseRow), so it owns no positioning of its own.
export function WordTooltip({
  word,
  surahNumber,
  ayahNumber,
  onClose,
}: {
  word: Word;
  surahNumber: number;
  ayahNumber: number;
  onClose: () => void;
}) {
  function playWord() {
    new Audio(wordAudioUrl(surahNumber, ayahNumber, word.position)).play().catch(
      () => {},
    );
  }

  // Auto-play the word's recitation when the tooltip opens (the tap is the
  // user gesture browsers require). Re-fires for each newly tapped word.
  useEffect(() => {
    playWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id]);
  // If this word is a divine name or a prophet, offer a jump to its explorer.
  const links = useLemmaLinks();
  const lemma = word.lemma || "";
  const nameLink = links?.names[lemma];
  const prophetLink = links?.prophets[lemma];

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
      <button
        onClick={playWord}
        className="mt-1 inline-flex items-center gap-1 rounded text-xs text-khatulistiwa hover:underline"
        title="Play this word"
      >
        🔊 Play word
      </button>
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

      {/* Segment breakdown: prefixes / stem / suffixes with their grammar,
          from the corpus segment layer. Only shown once loaded. */}
      {word.segments && word.segments.length > 0 && (
        <div className="mt-2 border-t border-sand pt-2 dark:border-khatulistiwa/30">
          <div className="mb-1 text-xs font-semibold text-muted">Grammar</div>
          <ul className="space-y-1">
            {word.segments.map((seg) => (
              <li
                key={seg.position}
                className="flex items-baseline gap-2 text-xs"
              >
                <ArabicText className="text-sm text-fg">{seg.arabic}</ArabicText>
                <span className="text-muted">{describeSegment(seg)}</span>
                <span className="ml-auto text-[10px] uppercase tracking-wide text-muted/70">
                  {seg.segment_type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
        {nameLink && (
          <Link
            href={`/explore/names?name=${encodeURIComponent(nameLink.id)}`}
            className="rounded border border-waraq px-2 py-1.5 text-center text-xs text-waraq hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            ✦ One of the 99 Names — {nameLink.label} →
          </Link>
        )}
        {prophetLink && (
          <Link
            href={`/explore/prophets?prophet=${encodeURIComponent(prophetLink.id)}`}
            className="rounded border border-waraq px-2 py-1.5 text-center text-xs text-waraq hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            📖 Prophet {prophetLink.label} — all verses →
          </Link>
        )}
      </div>
    </div>
  );
}
