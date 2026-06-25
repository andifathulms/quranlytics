"use client";

import { useState } from "react";

import { auth } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthContext";

// Up/down voting for a discovery. Optimistic-ish: posts then trusts the
// server's returned score. Voting again with the same value toggles it off.
export function VoteButtons({
  discoveryId,
  initialScore,
  initialMyVote,
}: {
  discoveryId: number;
  initialScore: number;
  initialMyVote: number;
}) {
  const { token } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState(initialMyVote);
  const [busy, setBusy] = useState(false);

  async function cast(value: -1 | 1) {
    if (!token || busy) return;
    const next = myVote === value ? 0 : value;
    setBusy(true);
    try {
      const res = await auth.voteDiscovery(token, discoveryId, next);
      setScore(res.vote_score);
      setMyVote(next);
    } finally {
      setBusy(false);
    }
  }

  const base = "flex h-7 w-7 items-center justify-center rounded text-sm";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => cast(1)}
        disabled={!token || busy}
        aria-label="Upvote"
        className={`${base} ${myVote === 1 ? "bg-emerald/20 text-emerald" : "text-lapis/50 hover:bg-sand/40 dark:text-parchment/50"} disabled:opacity-40`}
      >
        ▲
      </button>
      <span className="font-mono text-sm text-waraq">{score}</span>
      <button
        onClick={() => cast(-1)}
        disabled={!token || busy}
        aria-label="Downvote"
        className={`${base} ${myVote === -1 ? "bg-red-100 text-red-600" : "text-lapis/50 hover:bg-sand/40 dark:text-parchment/50"} disabled:opacity-40`}
      >
        ▼
      </button>
    </div>
  );
}
