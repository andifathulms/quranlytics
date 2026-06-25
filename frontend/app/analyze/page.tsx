import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { NAV_GROUPS } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Analyze — Quranlytics",
  description:
    "Analytical tools: word frequency, root morphology, co-occurrence, rare words, structure, and statistics.",
};

const ANALYZE = NAV_GROUPS.find((g) => g.label === "Analyze");

export default function AnalyzeHubPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Analyze</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Six tools for going beneath the surface of the text — counting words,
          tracing roots, and surfacing numerical and structural patterns. Every
          result is computed from the real corpus.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ANALYZE?.items.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card variant="interactive" className="h-full">
              <h2 className="font-display text-lg text-accent">{item.label}</h2>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
