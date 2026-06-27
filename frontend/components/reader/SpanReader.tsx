"use client";

import { RECITERS } from "@/lib/audio";
import { usePersistentToggle } from "@/lib/hooks/usePersistentToggle";
import type { Verse } from "@/lib/api/types";

import { ReaderAudioProvider, useReaderAudio } from "./ReaderAudio";
import { READING_MODE_KEY, ReadingFlow } from "./ReadingFlow";
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
  const [reading, toggleReading] = usePersistentToggle(READING_MODE_KEY);

  return (
    <ReaderAudioProvider verses={verses}>
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-sand pb-3 dark:border-khatulistiwa/30">
        <AudioControls label={label} />
        <button
          onClick={toggleReading}
          aria-pressed={reading}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            reading
              ? "border-waraq bg-waraq/15 text-waraq"
              : "border-sand text-lapis/70 hover:text-lapis dark:text-parchment/70"
          }`}
        >
          📖 Reading mode {reading ? "on" : "off"}
        </button>
      </div>
      {reading ? (
        <ReadingFlow verses={verses} />
      ) : (
        <section>
          {verses.map((v) => (
            <VerseRow key={v.id} verse={v} />
          ))}
        </section>
      )}
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
