import Link from "next/link";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { api } from "@/lib/api/client";
import type { Surah } from "@/lib/api/types";

export const revalidate = 3600;

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
    <div className="space-y-8">
      <section className="rounded-xl bg-lapis px-6 py-10 text-parchment">
        <h1 className="font-display text-3xl text-waraq text-shadow-gold">
          Read the Quran. Understand its patterns. Discover its miracles.
        </h1>
        <p className="mt-3 max-w-2xl text-parchment/80">
          Browse all 114 surahs with English and Indonesian translations, then
          dive into word frequencies, root morphology, and numerical patterns.
        </p>
      </section>

      {surahs.length === 0 ? (
        <Card>
          <p className="text-lapis/70">
            No surahs loaded yet. Run the ingestion commands on the backend:
            <code className="ml-1 font-mono text-sm">
              python manage.py ingest_surahs
            </code>
          </p>
        </Card>
      ) : (
        <section>
          <h2 className="mb-4 font-display text-2xl">Surahs</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {surahs.map((s) => (
              <Link key={s.number} href={`/${s.number}`}>
                <Card className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-waraq">{s.number}</span>
                      <span className="font-medium">
                        {s.name_transliteration}
                      </span>
                    </div>
                    <div className="text-sm text-lapis/60">
                      {s.name_en} · {s.verse_count} verses
                    </div>
                    <Badge tone={s.revelation_type === "Meccan" ? "gold" : "blue"}>
                      {s.revelation_type}
                    </Badge>
                  </div>
                  <ArabicText className="text-2xl text-khatulistiwa">
                    {s.name_arabic}
                  </ArabicText>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
