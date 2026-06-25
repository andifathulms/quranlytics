import { StructureTabs } from "@/components/analytics/StructureTabs";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Surah } from "@/lib/api/types";

export const metadata = { title: "Structural Patterns · Quranlytics" };
export const revalidate = 3600;

async function getSurahs(): Promise<Surah[]> {
  try {
    return (await api.listSurahs()).data;
  } catch {
    return [];
  }
}

export default async function StructurePage() {
  const surahs = await getSurahs();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Structural Patterns</h1>
        <p className="text-lapis/60 dark:text-parchment/60">
          Verse rhythm, paired-surah symmetry, and proposed chiastic (ring)
          structures.
        </p>
      </header>
      {surahs.length === 0 ? (
        <Card>
          <p className="text-lapis/70 dark:text-parchment/70">
            No surah data available. Run the ingestion commands on the backend.
          </p>
        </Card>
      ) : (
        <StructureTabs surahs={surahs} />
      )}
    </div>
  );
}
