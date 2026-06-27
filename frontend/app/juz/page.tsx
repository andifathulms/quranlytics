import Link from "next/link";

import { Card } from "@/components/ui/Card";

export const metadata = { title: "Juzʾ Index · Quranlytics" };

// The 30 ajzāʾ (equal parts) the Quran is traditionally divided into.
export default function JuzIndexPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Read by Juzʾ</h1>
        <p className="text-muted">
          The Quran in its 30 equal parts (ajzāʾ) — handy for a daily portion.
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
          <Link key={n} href={`/juz/${n}`}>
            <Card variant="interactive" className="text-center">
              <div className="text-xs uppercase tracking-wide text-muted">
                Juzʾ
              </div>
              <div className="font-display text-3xl text-khatulistiwa">{n}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
