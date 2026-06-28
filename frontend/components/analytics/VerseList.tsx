import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import type { Verse } from "@/lib/api/types";

// Compact, read-only verse list for analytics results (no word lazy-loading).
export function VerseList({ verses }: { verses: Verse[] }) {
  return (
    <div className="divide-y divide-sand">
      {verses.map((v) => {
        const en = v.translations.find((t) => t.language === "en");
        const id = v.translations.find((t) => t.language === "id");
        return (
          <article key={v.id} className="py-4">
            <Link
              href={`/${v.surah_number}#${v.surah_number}-${v.number}`}
              className="font-mono text-xs text-khatulistiwa hover:underline"
            >
              {v.verse_key}
            </Link>
            <div dir="rtl" className="mt-1 text-right">
              <ArabicText className="text-2xl leading-loose">
                {v.text_uthmani}
              </ArabicText>
            </div>
            {en && <p className="mt-2 text-sm text-fg">{en.text}</p>}
            {id && <p className="text-sm text-muted">{id.text}</p>}
          </article>
        );
      })}
    </div>
  );
}
