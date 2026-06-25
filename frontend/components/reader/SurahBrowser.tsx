"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { Surah } from "@/lib/api/types";

// Surah index with a quick filter by number, transliteration, or English name.
export function SurahBrowser({ surahs }: { surahs: Surah[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === q ||
        s.name_transliteration.toLowerCase().includes(q) ||
        s.name_en.toLowerCase().includes(q) ||
        s.name_arabic.includes(query.trim()),
    );
  }, [surahs, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Surahs</h2>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to a surah…"
          aria-label="Filter surahs"
          className="w-full sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No surahs match"
          description={`Nothing matches “${query}”. Try a number (1–114) or a name.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.number} href={`/${s.number}`}>
              <Card
                variant="interactive"
                className="flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gold">{s.number}</span>
                    <span className="font-medium">{s.name_transliteration}</span>
                  </div>
                  <div className="text-sm text-muted">
                    {s.name_en} · {s.verse_count} verses
                  </div>
                  <Badge tone={s.revelation_type === "Meccan" ? "gold" : "blue"}>
                    {s.revelation_type}
                  </Badge>
                </div>
                <ArabicText className="text-2xl text-accent">
                  {s.name_arabic}
                </ArabicText>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
