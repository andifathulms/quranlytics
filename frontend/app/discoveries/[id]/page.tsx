"use client";

import { toPng } from "html-to-image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ShareCard } from "@/components/community/ShareCard";
import { VoteButtons } from "@/components/community/VoteButtons";
import { auth } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Discovery } from "@/lib/api/types";

export default function DiscoveryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { token, user, ready } = useAuth();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    auth
      .getDiscovery(token, id)
      .then((d) => active && setDiscovery(d))
      .catch(() => active && setNotFound(true));
    return () => {
      active = false;
    };
  }, [ready, token, id]);

  async function downloadPng() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `quranlytics-discovery-${id}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function remove() {
    if (!token || !discovery) return;
    if (!confirm("Delete this discovery?")) return;
    await auth.deleteDiscovery(token, discovery.id);
    router.replace("/discoveries");
  }

  if (notFound) {
    return <p className="text-lapis/60 dark:text-parchment/60">Discovery not found.</p>;
  }
  if (!discovery) {
    return <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>;
  }

  const isOwner = user?.username === discovery.author_username;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <nav className="text-sm text-lapis/60 dark:text-parchment/60">
        <Link href="/discoveries" className="hover:text-khatulistiwa">
          ← All discoveries
        </Link>
      </nav>

      <div className="flex items-start gap-3">
        <VoteButtons
          discoveryId={discovery.id}
          initialScore={discovery.vote_score}
          initialMyVote={discovery.my_vote}
        />
        <div ref={cardRef} className="flex-1">
          <ShareCard discovery={discovery} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm print:hidden">
        <button
          onClick={downloadPng}
          className="rounded-lg border border-khatulistiwa px-3 py-1.5 text-khatulistiwa hover:bg-sand/40"
        >
          ⬇ Download PNG
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-khatulistiwa px-3 py-1.5 text-khatulistiwa hover:bg-sand/40"
        >
          🖨 Print / PDF
        </button>
        {isOwner && (
          <button
            onClick={remove}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
