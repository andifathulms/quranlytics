"use client";

import { useEffect, useRef, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Popover } from "@/components/ui/Popover";
import type { Verse } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { useReaderSettings } from "@/lib/reader/ReaderSettings";

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

// Translation of a verse, limited to the chosen language(s). Used inline (the
// density toggle) and inside the tap-to-reveal popover (which always shows both).
function VerseMeaning({
  verse,
  show = "both",
}: {
  verse: Verse;
  show?: "en" | "id" | "both";
}) {
  const en = verse.translations.find((t) => t.language === "en");
  const id = verse.translations.find((t) => t.language === "id");
  return (
    <div className="space-y-1">
      {show !== "id" && en && <p className="text-sm text-fg">{en.text}</p>}
      {show !== "en" && id && <p className="text-sm text-muted">{id.text}</p>}
    </div>
  );
}

// A single ayah within the flowing mushaf. Inline so the text stays continuous,
// but it owns a ref + observer so reading in mushaf mode records the reader's
// position. When translations aren't shown inline, tapping an ayah reveals its
// meaning in a popover — progressive disclosure that keeps the mushaf flow.
function FlowAyah({ verse, tappable }: { verse: Verse; tappable: boolean }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const { recordRead } = useAuth();
  const { currentId, playing } = useReaderAudio();
  const [open, setOpen] = useState(false);
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
    <>
      <span
        ref={ref}
        id={`${verse.surah_number}-${verse.number}`}
        role={tappable ? "button" : undefined}
        tabIndex={tappable ? 0 : undefined}
        onClick={tappable ? () => setOpen((o) => !o) : undefined}
        onKeyDown={
          tappable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              }
            : undefined
        }
        className={`scroll-mt-20 rounded transition-colors ${
          tappable ? "cursor-pointer hover:bg-waraq/10" : ""
        } ${active ? "bg-waraq/20 ring-1 ring-waraq/40" : ""}`}
        title={tappable ? "Tap for translation" : undefined}
      >
        {verse.text_uthmani}
        <span className="mx-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-waraq align-middle text-base text-waraq">
          {toArabicNumber(verse.number)}
        </span>{" "}
      </span>
      {tappable && (
        <Popover
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={ref}
          label={`Translation of ${verse.verse_key}`}
          width={360}
        >
          <div className="text-left">
            <div className="mb-1 font-mono text-xs text-muted">
              {verse.verse_key}
            </div>
            <VerseMeaning verse={verse} />
          </div>
        </Popover>
      )}
    </>
  );
}

// A span of verses (surah, juzʾ, or page) laid out like the printed muṣḥaf:
// continuous RTL Arabic, justified so both margins align, split into pages that
// end on verse boundaries. The Uthmani text is rendered verbatim; the ayah
// marker is appended after each verse, never inserted into the text.
export function ReadingFlow({ verses }: { verses: Verse[] }) {
  const { translations } = useReaderSettings();
  const showInline = translations !== "off";
  const pages = byPage(verses);

  return (
    <div className="space-y-6">
      {pages.map(({ page, verses: pageVerses }) => (
        <div
          key={`${page}-${pageVerses[0]?.id}`}
          className="rounded-lg border border-sand bg-surface px-5 py-8 shadow-sm dark:border-khatulistiwa/30"
        >
          <ArabicText
            className="block text-justify quran-verse leading-[2.7] text-fg"
            style={{ textAlignLast: "right" }}
          >
            {pageVerses.map((v) => (
              <FlowAyah key={v.id} verse={v} tappable={!showInline} />
            ))}
          </ArabicText>

          {showInline && (
            <div className="mt-6 space-y-4 border-t border-sand pt-4 dark:border-khatulistiwa/30">
              {pageVerses.map((v) => (
                <div key={v.id} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-muted">
                    {v.verse_key}
                  </span>
                  <VerseMeaning verse={v} show={translations} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-sand pt-3 text-center text-xs text-muted dark:border-khatulistiwa/30">
            ﴿ {page} ﴾
          </div>
        </div>
      ))}
    </div>
  );
}
