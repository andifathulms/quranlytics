import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge } from "@/components/ui/Card";
import type { ScoredVerse } from "@/lib/api/types";

// Verse results with a semantic-similarity score badge.
export function ScoredVerseList({ verses }: { verses: ScoredVerse[] }) {
  return (
    <div className="divide-y divide-sand dark:divide-khatulistiwa/30">
      {verses.map((v) => {
        const en = v.translations.find((t) => t.language === "en");
        const id = v.translations.find((t) => t.language === "id");
        return (
          <article key={v.id} className="py-4">
            <div className="flex items-center gap-2">
              <Link
                href={`/${v.surah_number}`}
                className="font-mono text-xs text-khatulistiwa hover:underline"
              >
                {v.verse_key}
              </Link>
              <Badge tone="emerald">
                {Math.round(v.similarity * 100)}% match
              </Badge>
            </div>
            <div dir="rtl" className="mt-1 text-right">
              <ArabicText className="text-2xl leading-loose">
                {v.text_uthmani}
              </ArabicText>
            </div>
            {en && (
              <p className="mt-2 text-sm text-lapis/90 dark:text-parchment/80">
                {en.text}
              </p>
            )}
            {id && (
              <p className="text-sm text-lapis/60 dark:text-parchment/60">{id.text}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
