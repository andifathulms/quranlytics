import type { Discovery } from "@/lib/api/types";

// The visual "discovery card" used for PNG export and printing. Self-contained
// styling (no dark-mode variants) so the exported image looks consistent.
export function ShareCard({ discovery }: { discovery: Discovery }) {
  return (
    <div
      className="share-card relative w-full overflow-hidden rounded-xl p-8 text-parchment"
      style={{
        background: "linear-gradient(135deg, #0D1B2A 0%, #1B4F72 100%)",
      }}
    >
      <div className="text-xs uppercase tracking-[0.2em] text-waraq">
        {discovery.category} · Quranlytics
      </div>
      <h2 className="mt-3 font-display text-2xl text-waraq">{discovery.title}</h2>
      <p className="mt-4 whitespace-pre-wrap leading-relaxed text-parchment/90">
        {discovery.body}
      </p>

      {Object.keys(discovery.payload || {}).length > 0 && (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-black/20 p-3 font-mono text-xs text-parchment/80">
          {JSON.stringify(discovery.payload, null, 2)}
        </pre>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-sm">
        <span className="text-parchment/70">by {discovery.author_username}</span>
        <span className="font-mono text-waraq">▲ {discovery.vote_score}</span>
      </div>
    </div>
  );
}
