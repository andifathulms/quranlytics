"use client";

import { useRef, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Popover } from "@/components/ui/Popover";
import { api } from "@/lib/api/client";
import type { Verse, Word } from "@/lib/api/types";

import { VerseToolbar } from "./VerseToolbar";
import { WordTooltip } from "./WordTooltip";

// One verse: clickable Arabic words (RTL) on top, EN + ID translations below.
export function VerseRow({ verse }: { verse: Verse }) {
  const [words, setWords] = useState<Word[] | null>(verse.words ?? null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const activeWord = words?.find((w) => w.id === activeId) ?? null;

  const en = verse.translations.find((t) => t.language === "en");
  const id = verse.translations.find((t) => t.language === "id");

  async function ensureWords() {
    if (words || loading) return;
    setLoading(true);
    try {
      const res = await api.getVerse(verse.id);
      setWords(res.data.words ?? []);
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="border-b border-sand py-6 dark:border-khatulistiwa/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-waraq/20 px-2 py-0.5 font-mono text-xs text-[#8a6d1f] dark:text-waraq">
          {verse.verse_key}
        </span>
      </div>

      {/* Arabic — RTL, words clickable for the morphology tooltip. */}
      <div
        dir="rtl"
        className="flex flex-wrap justify-end gap-x-2 gap-y-3 text-right"
        onMouseEnter={ensureWords}
      >
        {words && words.length > 0 ? (
          words.map((w) => (
            <button
              key={w.id}
              ref={activeId === w.id ? anchorRef : undefined}
              onClick={(e) => {
                anchorRef.current = e.currentTarget;
                setActiveId(activeId === w.id ? null : w.id);
              }}
              className="rounded px-1 transition-colors hover:bg-waraq/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArabicText className="text-3xl leading-loose">
                {w.arabic}
              </ArabicText>
            </button>
          ))
        ) : (
          <ArabicText className="text-3xl leading-loose">
            {verse.text_uthmani}
          </ArabicText>
        )}
      </div>

      <Popover
        open={activeWord !== null}
        onClose={() => setActiveId(null)}
        anchorRef={anchorRef}
        label="Word details"
      >
        {activeWord && (
          <WordTooltip word={activeWord} onClose={() => setActiveId(null)} />
        )}
      </Popover>

      {/* Translations — side by side. */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {en && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-lapis/50 dark:text-parchment/50">
              English · {en.translator}
            </div>
            <p className="text-sm text-lapis/90 dark:text-parchment/80">{en.text}</p>
          </div>
        )}
        {id && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-lapis/50 dark:text-parchment/50">
              Indonesia · {id.translator}
            </div>
            <p className="text-sm text-lapis/90 dark:text-parchment/80">{id.text}</p>
          </div>
        )}
      </div>

      <VerseToolbar verse={verse} />
    </article>
  );
}
