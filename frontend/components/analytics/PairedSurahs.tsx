"use client";

import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Surah, SurahBrief, SurahPair, Verse } from "@/lib/api/types";

import { SurahSelect } from "./SurahSelect";

// Well-documented surah pairs, for one-tap comparison.
const PRESETS: { a: number; b: number; label: string }[] = [
  { a: 113, b: 114, label: "Al-Muʿawwidhatān" },
  { a: 2, b: 3, label: "Az-Zahrāwān" },
  { a: 55, b: 56, label: "Ar-Raḥmān · Al-Wāqiʿah" },
  { a: 73, b: 74, label: "Al-Muzzammil · Al-Muddaththir" },
  { a: 105, b: 106, label: "Al-Fīl · Quraysh" },
  { a: 8, b: 9, label: "Al-Anfāl · At-Tawbah" },
];

function VersePeek({ label, verse }: { label: string; verse: Verse | null }) {
  if (!verse) return null;
  const en = verse.translations.find((t) => t.language === "en");
  const id = verse.translations.find((t) => t.language === "id");
  return (
    <div className="mt-2">
      <div className="text-xs uppercase tracking-wide text-muted">
        {label} · {verse.verse_key}
      </div>
      <div dir="rtl" className="text-right">
        <ArabicText className="text-xl">{verse.text_uthmani}</ArabicText>
      </div>
      {en && <p className="text-xs text-fg">{en.text}</p>}
      {id && <p className="text-xs text-muted">{id.text}</p>}
    </div>
  );
}

// Side-by-side bars comparing one metric across the two surahs.
function CompareRow({
  label,
  a,
  b,
}: {
  label: string;
  a: number | null;
  b: number | null;
}) {
  if (a == null || b == null) return null;
  const max = Math.max(1, a, b);
  return (
    <div className="text-xs">
      <div className="mb-1 flex justify-between text-muted">
        <span className="font-mono text-waraq">{a.toLocaleString()}</span>
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-mono text-khatulistiwa dark:text-[#5b8fb0]">
          {b.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-1 justify-end">
          <div
            className="h-2 rounded-l bg-waraq"
            style={{ width: `${(a / max) * 100}%` }}
          />
        </div>
        <div className="flex flex-1 justify-start">
          <div
            className="h-2 rounded-r bg-khatulistiwa dark:bg-[#5b8fb0]"
            style={{ width: `${(b / max) * 100}%` }}
          />
        </div>
      </div>
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

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Known pairs:</span>
        {PRESETS.map((p) => {
          const on = a === p.a && b === p.b;
          return (
            <button
              key={p.label}
              onClick={() => {
                setA(p.a);
                setB(p.b);
              }}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                on
                  ? "border-waraq bg-waraq/15 text-waraq"
                  : "border-sand text-muted hover:border-khatulistiwa hover:text-khatulistiwa"
              }`}
            >
              {p.a}·{p.b} {p.label}
            </button>
          );
        })}
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
          <div className="space-y-2 rounded-lg border border-border bg-surface-2 p-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-waraq">
                {pair.a.surah_id}. {pair.a.name}
              </span>
              <span className="text-khatulistiwa dark:text-[#5b8fb0]">
                {pair.b.surah_id}. {pair.b.name}
              </span>
            </div>
            <CompareRow label="verses" a={pair.a.verse_count} b={pair.b.verse_count} />
            <CompareRow label="words" a={pair.a.word_count} b={pair.b.word_count} />
            <CompareRow label="letters" a={pair.a.letter_count} b={pair.b.letter_count} />
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
