import Link from "next/link";
import { notFound } from "next/navigation";

import { JuzReader } from "@/components/reader/JuzReader";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api/client";
import type { Verse } from "@/lib/api/types";

export const revalidate = 3600;

export function generateMetadata({ params }: { params: { n: string } }) {
  return { title: `Juzʾ ${params.n} · Quranlytics` };
}

async function getVerses(n: number): Promise<Verse[]> {
  try {
    return (await api.getJuzVerses(n)).data;
  } catch {
    return [];
  }
}

export default async function JuzPage({ params }: { params: { n: string } }) {
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1 || n > 30) notFound();

  const verses = await getVerses(n);
  const first = verses[0];
  const last = verses[verses.length - 1];

  return (
    <div>
      <nav className="mb-4 text-sm text-muted">
        <Link href="/juz" className="hover:text-khatulistiwa">
          ← All ajzāʾ
        </Link>
      </nav>
      <header className="mb-6 rounded-xl bg-lapis px-6 py-8 text-center text-parchment">
        <h1 className="font-display text-3xl text-waraq">Juzʾ {n}</h1>
        {first && last && (
          <p className="mt-2 text-parchment/70">
            {first.verse_key} — {last.verse_key} · {verses.length} verses
          </p>
        )}
      </header>

      {verses.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No verses available"
          description="Run the ingestion commands on the backend, then reload."
        />
      ) : (
        <JuzReader verses={verses} />
      )}
    </div>
  );
}
