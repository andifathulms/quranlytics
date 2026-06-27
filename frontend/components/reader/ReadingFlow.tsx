"use client";

import { ArabicText } from "@/components/ui/ArabicText";
import type { Verse } from "@/lib/api/types";

// Shared localStorage key so the reading-mode preference persists across the
// surah, juzʾ, and page readers.
export const READING_MODE_KEY = "quranlytics:reading";

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicNumber = (n: number) =>
  String(n)
    .split("")
    .map((d) => AR_DIGITS[Number(d)] ?? d)
    .join("");

// A span of verses (surah, juzʾ, or page) as one continuous RTL Arabic flow,
// each ayah followed by its number in an ornament — no translations, toolbars,
// or row breaks. The Uthmani text is rendered verbatim; the marker is appended,
// never inserted.
export function ReadingFlow({ verses }: { verses: Verse[] }) {
  return (
    <div dir="rtl" className="rounded-lg bg-surface px-5 py-8 text-right">
      <ArabicText className="block text-3xl leading-[2.7] text-fg">
        {verses.map((v) => (
          <span key={v.id}>
            {v.text_uthmani}
            <span className="mx-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-waraq align-middle text-base text-waraq">
              {toArabicNumber(v.number)}
            </span>{" "}
          </span>
        ))}
      </ArabicText>
    </div>
  );
}
