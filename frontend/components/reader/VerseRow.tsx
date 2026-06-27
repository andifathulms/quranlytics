"use client";

import { useEffect, useRef, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Popover } from "@/components/ui/Popover";
import { api } from "@/lib/api/client";
import type { TajwidSegment, Verse, Word } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";

import { useReaderAudio } from "./ReaderAudio";
import { VerseToolbar } from "./VerseToolbar";
import { WordTooltip } from "./WordTooltip";

// One verse: clickable Arabic words (RTL) on top, EN + ID translations below.
// When `tajwid` segments are supplied, the Arabic is rendered as colour-coded
// spans instead of per-word buttons (the two modes are mutually exclusive).
export function VerseRow({
  verse,
  tajwid,
  ruleColors,
  hidden = false,
}: {
  verse: Verse;
  tajwid?: TajwidSegment[];
  ruleColors?: Record<string, string>;
  hidden?: boolean;
}) {
  const [words, setWords] = useState<Word[] | null>(verse.words ?? null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  const { currentId, playing } = useReaderAudio();
  const isPlaying = currentId === verse.id && playing;

  // Ḥifẓ self-test: hide the Arabic until the reader taps to check recall.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false); // re-hide whenever hide-mode is (re)enabled
  }, [hidden]);
  const concealed = hidden && !revealed;

  // Follow-along: scroll the verse into view when it starts playing.
  useEffect(() => {
    if (isPlaying) {
      articleRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isPlaying]);

  // Reading progress: when this verse scrolls into view, record it as the
  // reader's position (no-op when signed out; debounced + furthest-kept server-side).
  const { recordRead } = useAuth();
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          recordRead(verse.surah_number, verse.number);
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [recordRead, verse.surah_number, verse.number]);

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
    <article
      ref={articleRef}
      className={`scroll-mt-20 rounded-lg border-b border-sand px-3 py-6 transition-colors dark:border-khatulistiwa/30 ${
        isPlaying ? "bg-waraq/10 ring-1 ring-waraq/40" : ""
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-waraq/20 px-2 py-0.5 font-mono text-xs text-[#8a6d1f] dark:text-waraq">
          {verse.verse_key}
        </span>
        {isPlaying && (
          <span className="text-xs text-khatulistiwa">▶ playing</span>
        )}
      </div>

      {/* Arabic — RTL. Colour-coded (tajwīd) spans, or clickable words.
          In ḥifẓ hide-mode it's blurred until tapped (recall self-test). */}
      <div className="relative">
      {concealed && (
        <button
          onClick={() => setRevealed(true)}
          className="absolute inset-0 z-10 flex items-center justify-center rounded text-sm text-khatulistiwa"
          aria-label="Reveal verse"
        >
          👁 Tap to reveal
        </button>
      )}
      <div
        dir="rtl"
        className={`flex flex-wrap justify-end gap-x-2 gap-y-3 text-right transition ${
          concealed ? "select-none blur-md" : ""
        }`}
        aria-hidden={concealed}
        onMouseEnter={tajwid || concealed ? undefined : ensureWords}
      >
        {tajwid ? (
          <ArabicText className="text-3xl leading-loose">
            {tajwid.map((s, i) => (
              <span
                key={i}
                style={s.rule ? { color: ruleColors?.[s.rule] } : undefined}
              >
                {s.text}
              </span>
            ))}
          </ArabicText>
        ) : words && words.length > 0 ? (
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
      </div>

      <Popover
        open={activeWord !== null}
        onClose={() => setActiveId(null)}
        anchorRef={anchorRef}
        label="Word details"
      >
        {activeWord && (
          <WordTooltip
            word={activeWord}
            surahNumber={verse.surah_number}
            ayahNumber={verse.number}
            onClose={() => setActiveId(null)}
          />
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
