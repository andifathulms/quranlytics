"use client";

import { useEffect, useRef } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import type { Verse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";

import { useReaderAudio } from "./ReaderAudio";

// Shared localStorage key so the reading-mode preference persists across the
// surah, juzʾ, and page readers.
export const READING_MODE_KEY = "quranlytics:reading";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicNumber = (n: number) =>
  String(n)
    .split("")
    .map((d) => AR_DIGITS[Number(d)] ?? d)
    .join("");

// Group verses into the mushaf pages they belong to. Because every verse carries
// its printed page_number, each group begins and ends on a verse boundary —
// reproducing the muṣḥaf rule that a page never breaks in the middle of an ayah.
function byPage(verses: Verse[]): { page: number; verses: Verse[] }[] {
  const groups: { page: number; verses: Verse[] }[] = [];
  for (const v of verses) {
    const last = groups[groups.length - 1];
    if (last && last.page === v.page_number) last.verses.push(v);
    else groups.push({ page: v.page_number, verses: [v] });
  }
  return groups;
}

// A single ayah within the flowing mushaf. Inline so the text stays continuous,
// but it owns a ref + observer so that reading in mushaf mode still records the
// reader's position (streaks, goal, "continue reading") — exactly like the
// per-verse rows do in normal mode.
function FlowAyah({ verse }: { verse: Verse }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const { recordRead } = useAuth();
  const { currentId, playing } = useReaderAudio();
  const active = currentId === verse.id;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          recordRead(verse.surah_number, verse.number);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [recordRead, verse.surah_number, verse.number]);

  // Follow-along: keep the verse the reciter is on in view, so the reader never
  // loses their place in the continuous mushaf text.
  useEffect(() => {
    if (active && playing) {
      ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [active, playing]);

  return (
    <span
      ref={ref}
      id={`${verse.surah_number}-${verse.number}`}
      className={`scroll-mt-20 rounded transition-colors ${
        active ? "bg-waraq/20 ring-1 ring-waraq/40" : ""
      }`}
    >
      {verse.text_uthmani}
      <span className="mx-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-waraq align-middle text-base text-waraq">
        {toArabicNumber(verse.number)}
      </span>{" "}
    </span>
  );
}

// A span of verses (surah, juzʾ, or page) laid out like the printed muṣḥaf:
// continuous RTL Arabic, justified so both margins align, split into pages that
// end on verse boundaries. The Uthmani text is rendered verbatim; the ayah
// marker is appended after each verse, never inserted into the text.
export function ReadingFlow({ verses }: { verses: Verse[] }) {
  const pages = byPage(verses);

  return (
    <div className="space-y-6">
      {pages.map(({ page, verses: pageVerses }) => (
        <div
          key={`${page}-${pageVerses[0]?.id}`}
          className="rounded-lg border border-sand bg-surface px-5 py-8 shadow-sm dark:border-khatulistiwa/30"
        >
          <ArabicText
            className="block text-justify text-3xl leading-[2.7] text-fg"
            style={{ textAlignLast: "right" }}
          >
            {pageVerses.map((v) => (
              <FlowAyah key={v.id} verse={v} />
            ))}
          </ArabicText>
          <div className="mt-6 border-t border-sand pt-3 text-center text-xs text-muted dark:border-khatulistiwa/30">
            ﴿ {page} ﴾
          </div>
        </div>
      ))}
    </div>
  );
}
