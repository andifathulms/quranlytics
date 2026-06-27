"use client";

import { RECITERS } from "@/lib/audio";
import type { Verse } from "@/lib/api/types";

import { ReaderAudioProvider, useReaderAudio } from "./ReaderAudio";
import { VerseRow } from "./VerseRow";

// A reader for an arbitrary span of verses (a juzʾ or a mushaf page), which may
// cross surah boundaries — so it's lighter than the surah page: continuous
// recitation + word tooltips + progress recording, but no surah-scoped tajwīd.
export function SpanReader({
  verses,
  label = "span",
}: {
  verses: Verse[];
  label?: string;
}) {
  return (
    <ReaderAudioProvider verses={verses}>
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-sand pb-3 dark:border-khatulistiwa/30">
        <AudioControls label={label} />
      </div>
      <section>
        {verses.map((v) => (
          <VerseRow key={v.id} verse={v} />
        ))}
      </section>
    </ReaderAudioProvider>
  );
}

function AudioControls({ label }: { label: string }) {
  const { playing, currentId, playSurah, pause, reciterId, setReciterId } =
    useReaderAudio();
  const active = currentId !== null && playing;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (active ? pause() : playSurah())}
        className="rounded-lg border border-khatulistiwa px-3 py-1.5 text-sm text-khatulistiwa hover:bg-sand/40"
        title={active ? "Pause recitation" : `Play the whole ${label}`}
      >
        {active ? "❚❚ Pause" : `▶ Play ${label}`}
      </button>
      <select
        value={reciterId}
        onChange={(e) => setReciterId(e.target.value)}
        aria-label="Reciter"
        className="rounded-lg border border-sand bg-surface px-2 py-1.5 text-xs text-fg focus:border-khatulistiwa focus:outline-none"
      >
        {RECITERS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
