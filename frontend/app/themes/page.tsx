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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Theme Clusters</h1>
        <p className="text-lapis/60 dark:text-parchment/60">
          Verses grouped by semantic similarity into {themes.length || ""} themes
          (unsupervised — labels are the top keywords per cluster).
        </p>
      </header>

      {themes.length === 0 ? (
        <Card>
          <p className="text-lapis/70 dark:text-parchment/70">
            No themes yet. Run{" "}
            <code className="font-mono text-sm">
              ingest_embeddings
            </code>{" "}
            then{" "}
            <code className="font-mono text-sm">cluster_themes</code> on the
            backend.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((t) => (
            <Link key={t.cluster_id} href={`/themes/${t.cluster_id}`}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg capitalize">{t.label}</h2>
                  <Badge tone="blue">{t.size}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.keywords.slice(0, 5).map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-sand/40 px-2 py-0.5 text-xs text-lapis/70 dark:bg-lapis/40 dark:text-parchment/70"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <div className="mt-3 font-mono text-xs text-lapis/50 dark:text-parchment/50">
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
