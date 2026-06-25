import { StructureTabs } from "@/components/analytics/StructureTabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolIntro } from "@/components/ui/ToolIntro";
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
      <ToolIntro
        title="Structural Patterns"
        description="Verse rhythm, paired-surah symmetry, and proposed chiastic (ring) structures."
      />
      {surahs.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No surah data available"
          description="Run the ingestion commands on the backend."
        />
      ) : (
        <StructureTabs surahs={surahs} />
      )}
    </div>
  );
}
