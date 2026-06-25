"use client";

import { useEffect, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { ChiasticLevel, ChiasticStructure } from "@/lib/api/types";

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
}: {
  level: ChiasticLevel;
  indent: number;
  pivot: boolean;
}) {
  return (
    <div style={{ paddingInlineStart: `${indent}rem` }}>
      <div
        className={`rounded-lg border p-3 ${
          pivot
            ? "border-waraq bg-waraq/10"
            : "border-sand bg-white/60 dark:bg-lapis/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 min-w-6 items-center justify-center rounded px-1 font-mono text-xs ${
              pivot ? "bg-waraq text-lapis" : "bg-khatulistiwa text-parchment"
            }`}
          >
            {level.label}
          </span>
          <span className="font-mono text-xs text-khatulistiwa">
            {level.verse_key}
          </span>
          <span className="text-xs text-lapis/60 dark:text-parchment/60">
            {level.theme}
          </span>
        </div>
        <div dir="rtl" className="mt-2 text-right">
          <ArabicText className="text-xl leading-loose">
            {level.text_uthmani}
          </ArabicText>
        </div>
        {level.translation_en && (
          <p className="mt-1 text-xs text-lapis/70 dark:text-parchment/60">
            {level.translation_en}
          </p>
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
    return <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <p className="rounded-lg bg-sand/30 p-3 text-xs text-lapis/70 dark:bg-lapis/30 dark:text-parchment/60">
        Chiastic (ring) structures are scholarly <em>proposals</em>. Quranlytics
        shows the verses and the suggested symmetry — the pairings are
        interpretive, and you are invited to examine them yourself.
      </p>

      {structures.map((s) => {
        const center = (s.levels.length - 1) / 2;
        return (
          <Card key={s.id}>
            <h3 className="font-display text-xl">{s.title}</h3>
            <p className="mt-1 text-xs text-lapis/60 dark:text-parchment/60">
              {s.attribution}
            </p>
            <div className="mt-4 space-y-2">
              {s.levels.map((lvl, i) => (
                <Level
                  key={lvl.verse_key + lvl.label}
                  level={lvl}
                  indent={indentFor(s.levels, i)}
                  pivot={i === center}
                />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
