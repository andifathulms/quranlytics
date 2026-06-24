import { StatsDashboard } from "@/components/analytics/StatsDashboard";
import { Card } from "@/components/ui/Card";
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
      <header>
        <h1 className="font-display text-3xl">Surah Statistics</h1>
        <p className="text-lapis/60">
          Word, letter, verse, and unique-form counts across all 114 surahs —
          computed from the materialized stats table.
        </p>
      </header>
      {rows.length === 0 ? (
        <Card>
          <p className="text-lapis/70">
            No stats available yet. Run{" "}
            <code className="font-mono text-sm">python manage.py compute_stats</code>{" "}
            on the backend.
          </p>
        </Card>
      ) : (
        <StatsDashboard rows={rows} />
      )}
    </div>
  );
}
