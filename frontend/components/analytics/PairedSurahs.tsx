"use client";

import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Surah, SurahBrief, SurahPair, Verse } from "@/lib/api/types";

import { SurahSelect } from "./SurahSelect";

function VersePeek({ label, verse }: { label: string; verse: Verse | null }) {
  if (!verse) return null;
  const en = verse.translations.find((t) => t.language === "en");
  return (
    <div className="mt-2">
      <div className="text-xs uppercase tracking-wide text-lapis/40 dark:text-parchment/40">
        {label} · {verse.verse_key}
      </div>
      <div dir="rtl" className="text-right">
        <ArabicText className="text-xl">{verse.text_uthmani}</ArabicText>
      </div>
      {en && <p className="text-xs text-lapis/70 dark:text-parchment/60">{en.text}</p>}
    </div>
  );
}

function SurahCard({ s }: { s: SurahBrief }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">
            {s.surah_id}. {s.name}
          </div>
          <Badge tone={s.revelation_type === "Meccan" ? "gold" : "blue"}>
            {s.revelation_type}
          </Badge>
        </div>
        <ArabicText className="text-2xl text-khatulistiwa">{s.name_arabic}</ArabicText>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-sm">
        <div>
          <dt className="text-xs text-lapis/50 dark:text-parchment/50">verses</dt>
          <dd className="text-waraq">{s.verse_count}</dd>
        </div>
        <div>
          <dt className="text-xs text-lapis/50 dark:text-parchment/50">words</dt>
          <dd className="text-waraq">{s.word_count ?? "–"}</dd>
        </div>
        <div>
          <dt className="text-xs text-lapis/50 dark:text-parchment/50">letters</dt>
          <dd className="text-waraq">{s.letter_count ?? "–"}</dd>
        </div>
      </dl>
      <VersePeek label="First verse" verse={s.first_verse} />
      <VersePeek label="Last verse" verse={s.last_verse} />
    </Card>
  );
}

export function PairedSurahs({ surahs }: { surahs: Surah[] }) {
  const [a, setA] = useState(113);
  const [b, setB] = useState(114);
  const [pair, setPair] = useState<SurahPair | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .surahPair(a, b)
      .then((res) => active && setPair(res.data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [a, b]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <SurahSelect surahs={surahs} value={a} onChange={setA} label="Surah A" />
        <SurahSelect surahs={surahs} value={b} onChange={setB} label="Surah B" />
      </div>

      {loading || !pair?.available ? (
        <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone={pair.symmetry.same_verse_count ? "emerald" : "gold"}>
              {pair.symmetry.same_verse_count
                ? "Equal verse counts"
                : `Verse count differs by ${pair.symmetry.verse_count_diff}`}
            </Badge>
            <Badge tone="blue">Δ words: {pair.symmetry.word_count_diff}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SurahCard s={pair.a} />
            <SurahCard s={pair.b} />
          </div>
        </>
      )}
    </div>
  );
}
