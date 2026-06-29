import Link from "next/link";

import { VerseList } from "@/components/analytics/VerseList";
import { Badge, Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { ThemeSummary, Verse } from "@/lib/api/types";

export const revalidate = 3600;

async function getData(
  id: number,
): Promise<{ verses: Verse[]; theme: ThemeSummary | null }> {
  try {
    const [versesRes, themesRes] = await Promise.all([
      api.themeVerses(id),
      api.themes(),
    ]);
    const theme =
      themesRes.data.themes.find((t) => t.cluster_id === id) ?? null;
    return { verses: versesRes.data, theme };
  } catch {
    return { verses: [], theme: null };
  }
}

export default async function ThemeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const { verses, theme } = await getData(id);
  const title = theme?.label ? theme.label : `Theme #${id}`;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/themes" className="hover:text-khatulistiwa">
          ← All themes
        </Link>
      </nav>
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl capitalize text-fg">{title}</h1>
          {theme && <Badge tone="blue">{theme.size} verses</Badge>}
        </div>
        {theme && theme.keywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {theme.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted"
              >
                {k}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-sm text-muted">
          Verses grouped here by semantic similarity (unsupervised).
          {theme && theme.size > verses.length
            ? ` Showing the first ${verses.length} of ${theme.size}.`
            : ""}
        </p>
      </header>
      {verses.length === 0 ? (
        <Card>
          <p className="text-muted">No verses found for this theme.</p>
        </Card>
      ) : (
        <VerseList verses={verses} />
      )}
    </div>
  );
}
