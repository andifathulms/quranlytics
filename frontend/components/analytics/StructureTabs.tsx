"use client";

import { useMemo, useState } from "react";

import { OrderToggle } from "@/components/reader/OrderToggle";
import type { Surah } from "@/lib/api/types";
import { sortSurahs, type SurahOrder } from "@/lib/surahOrder";

import { ChiasticView } from "./ChiasticView";
import { PairedSurahs } from "./PairedSurahs";
import { SajdahView } from "./SajdahView";
import { VerseRhythm } from "./VerseRhythm";

const TABS = [
  { key: "rhythm", label: "Verse Rhythm" },
  { key: "paired", label: "Paired Surahs" },
  { key: "chiastic", label: "Chiastic Structure" },
  { key: "sajdah", label: "Prostrations" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StructureTabs({ surahs }: { surahs: Surah[] }) {
  const [tab, setTab] = useState<TabKey>("rhythm");
  const [order, setOrder] = useState<SurahOrder>("mushaf");

  const ordered = useMemo(() => sortSurahs(surahs, order), [surahs, order]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand dark:border-khatulistiwa/40">
        <div className="flex flex-wrap gap-2">
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
        {/* Only the surah-selector tabs are affected by ordering. */}
        {(tab === "rhythm" || tab === "paired") && (
          <div className="pb-2">
            <OrderToggle value={order} onChange={setOrder} />
          </div>
        )}
      </div>

      {tab === "rhythm" && <VerseRhythm surahs={ordered} order={order} />}
      {tab === "paired" && <PairedSurahs surahs={ordered} order={order} />}
      {tab === "chiastic" && <ChiasticView />}
      {tab === "sajdah" && <SajdahView />}
    </div>
  );
}
