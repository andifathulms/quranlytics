import Link from "next/link";
import { notFound } from "next/navigation";

import { SpanReader } from "@/components/reader/SpanReader";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api/client";
import type { Verse } from "@/lib/api/types";

export const revalidate = 3600;

export function generateMetadata({ params }: { params: { n: string } }) {
  return { title: `Mushaf page ${params.n} · Quranlytics` };
}

async function getVerses(n: number): Promise<Verse[]> {
  try {
    return (await api.getPageVerses(n)).data;
  } catch {
    return [];
  }
}

export default async function MushafPage({ params }: { params: { n: string } }) {
  const n = Number(params.n);
  if (!Number.isInteger(n) || n < 1 || n > 604) notFound();

  const verses = await getVerses(n);
  const first = verses[0];
  const last = verses[verses.length - 1];

  return (
    <div>
      <nav className="mb-4 flex items-center gap-4 text-sm text-muted">
        <Link href="/page" className="hover:text-khatulistiwa">
          ← All pages
        </Link>
        <div className="flex gap-3">
          {n > 1 && (
            <Link href={`/page/${n - 1}`} className="hover:text-khatulistiwa">
              ‹ Page {n - 1}
            </Link>
          )}
          {n < 604 && (
            <Link href={`/page/${n + 1}`} className="hover:text-khatulistiwa">
              Page {n + 1} ›
            </Link>
          )}
        </div>
      </nav>
      <header className="mb-6 rounded-xl bg-lapis px-6 py-8 text-center text-parchment">
        <h1 className="font-display text-3xl text-waraq">Page {n}</h1>
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
        <SpanReader verses={verses} label="page" />
      )}
    </div>
  );
}
