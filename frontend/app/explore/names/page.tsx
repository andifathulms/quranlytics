import { DivineNamesExplorer } from "@/components/analytics/DivineNamesExplorer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolIntro } from "@/components/ui/ToolIntro";
import { api } from "@/lib/api/client";
import type { DivineNames } from "@/lib/api/types";

export const metadata = { title: "Asmā' al-Ḥusnā · Quranlytics" };
export const revalidate = 3600;

async function getNames(): Promise<DivineNames | null> {
  try {
    return (await api.divineNames()).data;
  } catch {
    return null;
  }
}

export default async function DivineNamesPage() {
  const data = await getNames();

  return (
    <div className="space-y-6">
      <ToolIntro
        title="Asmā' al-Ḥusnā — The 99 Names"
        description="Browse the Beautiful Names of Allah. For each name, see its trilateral root, how often its word-form occurs in the Quran, and the verses themselves — then read the context and draw your own conclusions."
      />
      {!data || data.names.length === 0 ? (
        <EmptyState
          icon="📿"
          title="No data available"
          description="Run the verse + word ingestion commands on the backend, then reload."
        />
      ) : (
        <DivineNamesExplorer
          names={data.names}
          methodology={data.methodology}
        />
      )}
    </div>
  );
}
