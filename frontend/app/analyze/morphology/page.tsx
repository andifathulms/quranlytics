import { MorphologyExplorer } from "@/components/analytics/MorphologyExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolIntro } from "@/components/ui/ToolIntro";
import { api } from "@/lib/api/client";
import type { Surah } from "@/lib/api/types";

export const metadata = { title: "Morphology · Quranlytics" };
export const revalidate = 3600;

async function getSurahs(): Promise<Surah[]> {
  try {
    return (await api.listSurahs()).data;
  } catch {
    return [];
  }
}

export default async function MorphologyPage() {
  const surahs = await getSurahs();

  return (
    <div className="space-y-6">
      <ToolIntro
        title="Morphology"
        description="The grammatical make-up of the text, from the segment layer of the Quranic Arabic Corpus — word class, verb form (I–X), mood, and voice — for the whole Quran or a single surah."
      />
      {surahs.length === 0 ? (
        <EmptyState
          icon="🔤"
          title="No surah data available"
          description="Run the ingestion commands on the backend."
        />
      ) : (
        <MorphologyExplorer surahs={surahs} />
      )}
    </div>
  );
}
