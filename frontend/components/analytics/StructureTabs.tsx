"use client";

import { useState } from "react";

import type { Surah } from "@/lib/api/types";

import { ChiasticView } from "./ChiasticView";
import { PairedSurahs } from "./PairedSurahs";
import { VerseRhythm } from "./VerseRhythm";

const TABS = [
  { key: "rhythm", label: "Verse Rhythm" },
  { key: "paired", label: "Paired Surahs" },
  { key: "chiastic", label: "Chiastic Structure" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StructureTabs({ surahs }: { surahs: Surah[] }) {
  const [tab, setTab] = useState<TabKey>("rhythm");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-sand dark:border-khatulistiwa/40">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-waraq text-waraq"
                : "border-transparent text-lapis/60 hover:text-lapis dark:text-parchment/60 dark:hover:text-parchment"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rhythm" && <VerseRhythm surahs={surahs} />}
      {tab === "paired" && <PairedSurahs surahs={surahs} />}
      {tab === "chiastic" && <ChiasticView />}
    </div>
  );
}
