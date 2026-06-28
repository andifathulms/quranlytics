"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import type { Surah } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";

// Surah index with a quick filter by number, transliteration, or English name.
export function SurahBrowser({ surahs }: { surahs: Surah[] }) {
  const [query, setQuery] = useState("");
  const { progress } = useAuth();
  const furthestOf = (n: number) => progress?.progress?.[String(n)] ?? 0;

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
      {progress?.last_verse_key && (
        <Link
          href={`/${progress.last_surah}#${progress.last_surah}-${progress.last_verse}`}
        >
          <Card
            variant="interactive"
            className="flex items-center justify-between bg-khatulistiwa/5"
          >
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">
                Continue reading
              </div>
              <div className="font-medium text-khatulistiwa">
                Surah {progress.last_surah} · ayah {progress.last_verse}
              </div>
            </div>
            <span className="text-2xl text-khatulistiwa">▶</span>
          </Card>
        </Link>
      )}

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
          {filtered.map((s) => {
            const furthest = furthestOf(s.number);
            const completed = furthest >= s.verse_count;
            const pct = furthest
              ? Math.min(100, Math.round((furthest / s.verse_count) * 100))
              : 0;
            return (
              <Link key={s.number} href={`/${s.number}`}>
                <Card variant="interactive">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gold">{s.number}</span>
                        <span className="font-medium">
                          {s.name_transliteration}
                        </span>
                        {completed && (
                          <span
                            className="text-[#1e7e44] dark:text-emerald"
                            title="Completed"
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted">
                        {s.name_en} · {s.verse_count} verses
                      </div>
                      <Badge
                        tone={s.revelation_type === "Meccan" ? "gold" : "blue"}
                      >
                        {s.revelation_type}
                      </Badge>
                    </div>
                    <ArabicText className="text-2xl text-accent">
                      {s.name_arabic}
                    </ArabicText>
                  </div>
                  {furthest > 0 && !completed && (
                    <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-waraq"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
