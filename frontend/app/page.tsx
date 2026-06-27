import Link from "next/link";

import { ContinueReadingButton } from "@/components/reader/ContinueReadingButton";
import { SurahBrowser } from "@/components/reader/SurahBrowser";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api/client";
import type { Surah } from "@/lib/api/types";

export const revalidate = 3600;

// Researcher entry points. Teasers describe the capability — never assert a
// count, in keeping with the project's "present data, let users conclude" rule.
const TOOLS: { href: string; title: string; teaser: string }[] = [
  {
    href: "/analyze/word",
    title: "Word Frequency",
    teaser: "Count any word and map it across all 114 surahs →",
  },
  {
    href: "/analyze/root",
    title: "Root Explorer",
    teaser: "Trace a trilateral root through its derived forms →",
  },
  {
    href: "/analyze/cooccurrence",
    title: "Co-occurrence",
    teaser: "Find verses where two words appear together →",
  },
  {
    href: "/analyze/stats",
    title: "Statistics",
    teaser: "Compare word, letter, and unique-form counts →",
  },
];

async function getSurahs(): Promise<Surah[]> {
  try {
    const res = await api.listSurahs();
    return res.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const surahs = await getSurahs();

  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-lapis px-6 py-10 text-parchment">
        <h1 className="font-display text-3xl text-waraq text-shadow-gold">
          Read the Quran. Understand its patterns. Discover its miracles.
        </h1>
        <p className="mt-3 max-w-2xl text-parchment/80">
          Browse all 114 surahs with English and Indonesian translations, then
          dive into word frequencies, root morphology, and numerical patterns.
        </p>
        <p className="mt-4 text-sm text-parchment/60">
          Press <kbd className="rounded bg-parchment/10 px-1.5 py-0.5">/</kbd> anywhere
          to search a verse, word, or concept.
        </p>
        <ContinueReadingButton />
      </section>

      {/* Researcher lane — entry points into the analytical layer. */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">Analyze the text</h2>
          <Link
            href="/analyze"
            className="text-sm text-accent hover:underline"
          >
            All tools →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="block">
              <Card variant="interactive" className="h-full">
                <h3 className="font-display text-lg text-accent">{t.title}</h3>
                <p className="mt-1 text-sm text-muted">{t.teaser}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Reader lane — the surah index with quick filter. */}
      {surahs.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No surahs loaded yet"
          description={
            <>
              Run the ingestion commands on the backend to populate the text:{" "}
              <code className="font-mono">python manage.py ingest_surahs</code>
            </>
          }
        />
      ) : (
        <SurahBrowser surahs={surahs} />
      )}
    </div>
  );
}
