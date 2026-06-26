import { ProphetsExplorer } from "@/components/analytics/ProphetsExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolIntro } from "@/components/ui/ToolIntro";
import { api } from "@/lib/api/client";
import type { Prophets } from "@/lib/api/types";

export const metadata = { title: "Prophets in the Quran · Quranlytics" };
export const revalidate = 3600;

async function getProphets(): Promise<Prophets | null> {
  try {
    return (await api.prophets()).data;
  } catch {
    return null;
  }
}

export default async function ProphetsPage({
  searchParams,
}: {
  searchParams: { prophet?: string };
}) {
  const data = await getProphets();

  return (
    <div className="space-y-6">
      <ToolIntro
        title="Prophets of the Quran — The 25"
        description="Choose a prophet to read the verses that name him (direct), and the titles and by-names the Quran uses to refer to him (indirect). The verses are shown in full so you can read each in context."
      />
      {!data || data.prophets.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No data available"
          description="Run the verse ingestion commands on the backend, then reload."
        />
      ) : (
        <ProphetsExplorer
          prophets={data.prophets}
          methodology={data.methodology}
          initialOpenId={searchParams.prophet ?? null}
        />
      )}
    </div>
  );
}
