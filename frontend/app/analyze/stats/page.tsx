import { StatsDashboard } from "@/components/analytics/StatsDashboard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolIntro } from "@/components/ui/ToolIntro";
import { api } from "@/lib/api/client";
import type { SurahStatRow } from "@/lib/api/types";

export const metadata = { title: "Statistics · Quranlytics" };
export const revalidate = 3600;

async function getStats(): Promise<SurahStatRow[]> {
  try {
    const res = await api.allSurahStats();
    return res.data.surahs;
  } catch {
    return [];
  }
}

export default async function StatsPage() {
  const rows = await getStats();

  return (
    <div className="space-y-6">
      <ToolIntro
        title="Surah Statistics"
        description="Word, letter, verse, and unique-form counts across all 114 surahs — computed from the materialized stats table."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No stats available yet"
          description={
            <>
              Run{" "}
              <code className="font-mono">python manage.py compute_stats</code>{" "}
              on the backend.
            </>
          }
        />
      ) : (
        <StatsDashboard rows={rows} />
      )}
    </div>
  );
}
