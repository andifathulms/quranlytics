import Link from "next/link";

import { Badge, Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { ThemeSummary } from "@/lib/api/types";

export const metadata = { title: "Themes · Quranlytics" };
export const revalidate = 3600;

async function getThemes(): Promise<ThemeSummary[]> {
  try {
    return (await api.themes()).data.themes;
  } catch {
    return [];
  }
}

export default async function ThemesPage() {
  const themes = await getThemes();
  const totalVerses = themes.reduce((sum, t) => sum + t.size, 0);
  const sorted = [...themes].sort((a, b) => b.size - a.size);
  const maxSize = Math.max(1, ...themes.map((t) => t.size));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-fg">Theme Clusters</h1>
        <p className="text-muted">
          Verses grouped by semantic similarity (unsupervised — labels are the
          top keywords per cluster).
        </p>
        {themes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Badge tone="emerald">{themes.length} themes</Badge>
            <Badge tone="gold">
              {totalVerses.toLocaleString()} verses clustered
            </Badge>
          </div>
        )}
      </header>

      {themes.length === 0 ? (
        <Card>
          <p className="text-muted">
            No themes yet. Run{" "}
            <code className="font-mono text-sm">ingest_embeddings</code> then{" "}
            <code className="font-mono text-sm">cluster_themes</code> on the
            backend.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((t) => (
            <Link key={t.cluster_id} href={`/themes/${t.cluster_id}`}>
              <Card variant="interactive" className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg capitalize text-fg">
                    {t.label}
                  </h2>
                  <Badge tone="blue">{t.size}</Badge>
                </div>
                {/* relative size bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-khatulistiwa dark:bg-[#5b8fb0]"
                    style={{ width: `${(t.size / maxSize) * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.keywords.slice(0, 5).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <div className="mt-3 font-mono text-xs text-muted">
                  {t.sample_verses.map((s) => s.verse_key).join(" · ")}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
