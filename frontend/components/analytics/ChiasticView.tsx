"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { ChiasticLevel, ChiasticStructure } from "@/lib/api/types";

// Distinct hues for mirrored pairs (A/A' share a colour, B/B' share one, …) so
// the ring symmetry reads at a glance. Cycled if a structure is very deep.
const PAIR_COLORS = ["#1d4ed8", "#0f766e", "#6d28d9", "#be185d", "#b45309"];

// Indent each level toward the central pivot so the A–B–C–✦–C'–B'–A' ring
// reads visually as nested.
function indentFor(levels: ChiasticLevel[], i: number): number {
  const center = (levels.length - 1) / 2;
  return Math.round((center - Math.abs(i - center)) * 1.5);
}

function Level({
  level,
  indent,
  pivot,
  color,
}: {
  level: ChiasticLevel;
  indent: number;
  pivot: boolean;
  color: string;
}) {
  const [surah] = level.verse_key.split(":");
  return (
    <div style={{ paddingInlineStart: `${indent}rem` }}>
      <div
        className={`rounded-lg border bg-surface p-3 ${
          pivot ? "border-waraq bg-waraq/10" : "border-sand"
        }`}
        style={pivot ? undefined : { borderInlineStartWidth: 4, borderInlineStartColor: color }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 min-w-6 items-center justify-center rounded px-1 font-mono text-xs text-white"
            style={{ backgroundColor: pivot ? "#C9A84C" : color }}
          >
            {level.label}
          </span>
          <Link
            href={`/${surah}#${level.verse_key.replace(":", "-")}`}
            className="font-mono text-xs text-khatulistiwa hover:underline"
          >
            {level.verse_key}
          </Link>
          <span className="text-xs text-muted">{level.theme}</span>
        </div>
        <div dir="rtl" className="mt-2 text-right">
          <ArabicText className="text-xl leading-loose">
            {level.text_uthmani}
          </ArabicText>
        </div>
        {level.translation_en && (
          <p className="mt-1 text-xs text-muted">{level.translation_en}</p>
        )}
      </div>
    </div>
  );
}

export function ChiasticView() {
  const [structures, setStructures] = useState<ChiasticStructure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .chiastic()
      .then((res) => active && setStructures(res.data.structures))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-muted">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <p className="rounded-lg bg-sand/30 p-3 text-xs text-muted dark:bg-lapis/30">
        Chiastic (ring) structures are scholarly <em>proposals</em>. Matching
        colours mark the mirrored pairs (A↔A′, B↔B′…) around the central pivot.
        The pairings are interpretive — examine them yourself.
      </p>

      {structures.map((s) => {
        const center = (s.levels.length - 1) / 2;
        return (
          <Card key={s.id}>
            <h3 className="font-display text-xl">{s.title}</h3>
            <p className="mt-1 text-xs text-muted">{s.attribution}</p>
            <div className="mt-4 space-y-2">
              {s.levels.map((lvl, i) => {
                const pairIndex = Math.min(i, s.levels.length - 1 - i);
                return (
                  <Level
                    key={lvl.verse_key + lvl.label}
                    level={lvl}
                    indent={indentFor(s.levels, i)}
                    pivot={i === center}
                    color={PAIR_COLORS[pairIndex % PAIR_COLORS.length]}
                  />
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
