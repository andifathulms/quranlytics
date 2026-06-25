import Link from "next/link";

import { VerseList } from "@/components/analytics/VerseList";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Verse } from "@/lib/api/types";

export const revalidate = 3600;

async function getThemeVerses(id: number): Promise<Verse[]> {
  try {
    return (await api.themeVerses(id)).data;
  } catch {
    return [];
  }
}

export default async function ThemeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const verses = await getThemeVerses(id);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-lapis/60 dark:text-parchment/60">
        <Link href="/themes" className="hover:text-khatulistiwa">
          ← All themes
        </Link>
      </nav>
      <header>
        <h1 className="font-display text-3xl">Theme #{id}</h1>
        <p className="text-lapis/60 dark:text-parchment/60">
          Verses in this cluster (first page).
        </p>
      </header>
      {verses.length === 0 ? (
        <Card>
          <p className="text-lapis/70 dark:text-parchment/70">
            No verses found for this theme.
          </p>
        </Card>
      ) : (
        <VerseList verses={verses} />
      )}
    </div>
  );
}
