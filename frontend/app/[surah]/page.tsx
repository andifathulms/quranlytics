import Link from "next/link";
import { notFound } from "next/navigation";

import { VerseRow } from "@/components/reader/VerseRow";
import { ArabicText } from "@/components/ui/ArabicText";
import { Badge } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Surah, Verse } from "@/lib/api/types";

export const revalidate = 3600;

// Standard Bismillah opening. Rendered as a surah header EXCEPT:
//  - Surah 1 (Al-Fatihah): verse 1:1 IS the Bismillah — never double-render.
//  - Surah 9 (At-Tawbah): has no Bismillah.
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

async function getData(
  number: number,
): Promise<{ surah: Surah; verses: Verse[] } | null> {
  try {
    const [surahRes, versesRes] = await Promise.all([
      api.getSurah(number),
      api.getSurahVerses(number),
    ]);
    return { surah: surahRes.data, verses: versesRes.data };
  } catch {
    return null;
  }
}

export default async function SurahPage({
  params,
}: {
  params: { surah: string };
}) {
  const number = Number(params.surah);
  if (!Number.isInteger(number) || number < 1 || number > 114) notFound();

  const data = await getData(number);
  if (!data) notFound();
  const { surah, verses } = data;

  const showBismillah = number !== 1 && number !== 9;

  return (
    <div>
      <nav className="mb-4 text-sm text-lapis/60">
        <Link href="/" className="hover:text-khatulistiwa">
          ← All surahs
        </Link>
      </nav>

      <header className="mb-6 rounded-xl bg-lapis px-6 py-8 text-center text-parchment">
        <ArabicText className="text-4xl text-waraq text-shadow-gold">
          {surah.name_arabic}
        </ArabicText>
        <h1 className="mt-2 font-display text-2xl">
          {surah.number}. {surah.name_transliteration}
        </h1>
        <p className="text-parchment/70">{surah.name_en}</p>
        <div className="mt-3 flex justify-center gap-2">
          <Badge tone={surah.revelation_type === "Meccan" ? "gold" : "blue"}>
            {surah.revelation_type}
          </Badge>
          <Badge tone="emerald">{surah.verse_count} verses</Badge>
          {surah.stats && (
            <Badge tone="blue">{surah.stats.word_count} words</Badge>
          )}
        </div>
      </header>

      {showBismillah && (
        <div className="mb-6 text-center">
          <ArabicText className="text-3xl text-khatulistiwa">
            {BISMILLAH}
          </ArabicText>
        </div>
      )}

      <section>
        {verses.map((v) => (
          <VerseRow key={v.id} verse={v} />
        ))}
      </section>
    </div>
  );
}
