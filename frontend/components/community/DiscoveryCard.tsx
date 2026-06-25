import Link from "next/link";

import { Badge } from "@/components/ui/Card";
import type { Discovery } from "@/lib/api/types";

import { VoteButtons } from "./VoteButtons";

const TONE: Record<string, "gold" | "emerald" | "blue"> = {
  Numerical: "gold",
  Linguistic: "blue",
  Structural: "emerald",
  Thematic: "blue",
  Other: "gold",
};

export function DiscoveryCard({ discovery }: { discovery: Discovery }) {
  return (
    <div className="flex gap-3 rounded-lg border border-sand bg-white/70 p-4 dark:bg-lapis/30">
      <VoteButtons
        discoveryId={discovery.id}
        initialScore={discovery.vote_score}
        initialMyVote={discovery.my_vote}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone={TONE[discovery.category] ?? "gold"}>
            {discovery.category}
          </Badge>
          {!discovery.is_public && <Badge tone="gold">private</Badge>}
        </div>
        <Link href={`/discoveries/${discovery.id}`}>
          <h3 className="mt-1 font-display text-lg hover:text-khatulistiwa">
            {discovery.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-lapis/70 dark:text-parchment/70">
          {discovery.body}
        </p>
        <div className="mt-2 text-xs text-lapis/50 dark:text-parchment/50">
          by{" "}
          <Link
            href={`/u/${discovery.author_username}`}
            className="hover:text-khatulistiwa"
          >
            {discovery.author_username}
          </Link>{" "}
          · {new Date(discovery.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
