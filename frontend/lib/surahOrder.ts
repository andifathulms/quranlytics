import type { Surah } from "@/lib/api/types";

export type SurahOrder = "mushaf" | "revelation";

// Re-sort an already-loaded surah list. Mushaf order is the API's default sort
// by number; revelation order uses the chronological rank stored on each surah
// (ingested from quran.com's `revelation_order`). Pure client-side — no request.
export function sortSurahs(surahs: Surah[], order: SurahOrder): Surah[] {
  return order === "revelation"
    ? [...surahs].sort((a, b) => a.revelation_order - b.revelation_order)
    : surahs;
}
