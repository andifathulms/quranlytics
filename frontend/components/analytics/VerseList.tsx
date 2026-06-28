import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import type { Verse } from "@/lib/api/types";

// Diacritic + hamza/alef normalisation mirroring the backend, so a query term
// matches the vowelled surface word.
const HARAKAT = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const HAMZA: Record<string, string> = {
  "آ": "ا",
  "أ": "ا",
  "إ": "ا",
  "ٱ": "ا",
  "ى": "ي",
  "ة": "ه",
};
const norm = (s: string) =>
  [...s.replace(HARAKAT, "")].map((c) => HAMZA[c] ?? c).join("");
const dropAl = (s: string) => (s.startsWith("ال") ? s.slice(2) : s);

// Variants of a token to compare: normalized, and with a leading ال removed.
function variants(s: string): string[] {
  const n = norm(s.replace(/[^؀-ۿ]/g, ""));
  return [n, dropAl(n)];
}

function tokenMatches(token: string, termVariants: string[][]): boolean {
  const tv = variants(token);
  return termVariants.some((term) =>
    term.some((t) => t.length > 1 && tv.some((x) => x.includes(t))),
  );
}

// Compact, read-only verse list for analytics results (no word lazy-loading).
// When `highlight` terms are given, matching words in the Arabic are marked.
export function VerseList({
  verses,
  highlight,
}: {
  verses: Verse[];
  highlight?: string[];
}) {
  const termVariants = (highlight ?? [])
    .filter(Boolean)
    .map((t) => variants(t));

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
                {termVariants.length > 0
                  ? v.text_uthmani.split(/(\s+)/).map((tok, i) =>
                      /\s/.test(tok) || !tokenMatches(tok, termVariants) ? (
                        tok
                      ) : (
                        <mark
                          key={i}
                          className="rounded bg-waraq/40 px-0.5 text-fg"
                        >
                          {tok}
                        </mark>
                      ),
                    )
                  : v.text_uthmani}
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
