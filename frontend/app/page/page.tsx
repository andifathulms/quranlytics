import Link from "next/link";

export const metadata = { title: "Mushaf Pages · Quranlytics" };

// The 604 pages of the standard Madani mushaf.
export default function PageIndexPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl">Read by Page</h1>
        <p className="text-muted">
          Jump to any of the 604 pages of the standard mushaf.
        </p>
      </header>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-12">
        {Array.from({ length: 604 }, (_, i) => i + 1).map((n) => (
          <Link
            key={n}
            href={`/page/${n}`}
            className="rounded-lg border border-sand py-2 text-center text-sm text-fg transition-colors hover:border-khatulistiwa hover:bg-sand/30"
          >
            {n}
          </Link>
        ))}
      </div>
    </div>
  );
}
