"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge, Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { MorphCount, MorphologyProfile, Surah } from "@/lib/api/types";

// Friendly labels for the corpus's terse feature codes.
const COARSE: Record<string, string> = { N: "Noun", V: "Verb", P: "Particle" };
const MOOD: Record<string, string> = {
  IND: "Indicative",
  SUBJ: "Subjunctive",
  JUS: "Jussive",
};
const VOICE: Record<string, string> = { ACT: "Active", PASS: "Passive" };
const DETAIL: Record<string, string> = {
  PRON: "Pronoun",
  P: "Preposition",
  CONJ: "Conjunction",
  REM: "Resumption particle",
  DET: "Determiner (al-)",
  PERF: "Perfect verb",
  IMPF: "Imperfect verb",
  IMPV: "Imperative verb",
  PN: "Proper noun",
  REL: "Relative pronoun",
  ACT_PCPL: "Active participle",
  PASS_PCPL: "Passive participle",
  ADJ: "Adjective",
  VN: "Verbal noun",
  NEG: "Negative particle",
  DEM: "Demonstrative",
  EMPH: "Emphatic",
  COND: "Conditional",
  INTG: "Interrogative",
  T: "Time adverb",
  LOC: "Location adverb",
  VOC: "Vocative",
  SUB: "Subordinating conjunction",
  CERT: "Particle of certainty",
  RES: "Restriction particle",
  FUT: "Future particle",
};

function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

// One labelled horizontal-bar list, scaled to its own maximum.
function BarList({
  title,
  rows,
  labels = {},
  prefix = "",
}: {
  title: string;
  rows: MorphCount[];
  labels?: Record<string, string>;
  prefix?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return null;
  return (
    <Card>
      <h3 className="mb-3 font-display text-lg text-accent">{title}</h3>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="text-sm">
            <div className="mb-0.5 flex items-baseline justify-between gap-2">
              <span>
                {prefix}
                {label(labels, r.key)}
              </span>
              <span className="font-mono text-xs text-muted">
                {r.count.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-waraq"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MorphologyExplorer({ surahs }: { surahs: Surah[] }) {
  const [surah, setSurah] = useState(0); // 0 = whole Quran
  const [data, setData] = useState<MorphologyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .morphologyProfile(surah || undefined)
      .then((res) => active && setData(res.data))
      .catch(
        (e) =>
          active &&
          setError(e instanceof ApiError ? e.message : "Failed to load morphology"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [surah]);

  const scope = useMemo(
    () => surahs.find((s) => s.number === surah)?.name_transliteration,
    [surahs, surah],
  );

  return (
    <div className="space-y-5">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Scope</span>
        <select
          value={surah}
          onChange={(e) => setSurah(Number(e.target.value))}
          className="rounded-lg border border-sand bg-white px-3 py-1.5 text-lapis focus:border-khatulistiwa focus:outline-none dark:bg-transparent dark:text-parchment"
        >
          <option value={0}>Whole Quran</option>
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name_transliteration}
            </option>
          ))}
        </select>
      </label>

      {error && <ErrorBanner message={error} onRetry={() => setSurah((s) => s)} />}

      {loading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="blue">
              {data.total_segments.toLocaleString()} segments
              {scope ? ` in ${scope}` : ""}
            </Badge>
            <Badge tone="gold">{data.verb_total.toLocaleString()} verb forms</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BarList title="Word class" rows={data.coarse_pos} labels={COARSE} />
            <BarList
              title="Verb form (I–X)"
              rows={data.verb_forms}
              prefix="Form "
            />
            <BarList title="Verb mood" rows={data.moods} labels={MOOD} />
            <BarList title="Verb voice" rows={data.voice} labels={VOICE} />
            <BarList
              title="Grammatical subclass"
              rows={data.pos_detail}
              labels={DETAIL}
            />
          </div>
        </>
      )}
    </div>
  );
}
