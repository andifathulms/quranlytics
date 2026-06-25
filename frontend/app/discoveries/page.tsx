"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DiscoveryCard } from "@/components/community/DiscoveryCard";
import { auth } from "@/lib/api/auth";
import type { Discovery } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";

const CATEGORIES = ["", "Numerical", "Linguistic", "Structural", "Thematic", "Other"];

export default function DiscoveriesPage() {
  const { token, user, ready } = useAuth();
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    setLoading(true);
    auth
      .listDiscoveries(token, { sort, category: category || undefined })
      .then((data) => active && setItems(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ready, token, sort, category]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Community Discoveries</h1>
          <p className="text-lapis/60 dark:text-parchment/60">
            Patterns and findings shared by readers. Vote what resonates.
          </p>
        </div>
        {user ? (
          <Link
            href="/discoveries/new"
            className="rounded-lg bg-khatulistiwa px-4 py-2 text-sm text-parchment hover:bg-lapis"
          >
            + Share a discovery
          </Link>
        ) : (
          <Link href="/account" className="text-sm text-khatulistiwa hover:underline">
            Sign in to share →
          </Link>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex gap-1">
          {(["recent", "top"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-full px-3 py-1 ${sort === s ? "bg-khatulistiwa text-parchment" : "border border-sand text-lapis/70 dark:text-parchment/70"}`}
            >
              {s === "recent" ? "Recent" : "Top"}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-sand bg-white px-3 py-1.5 text-lapis focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c || "All categories"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-lapis/50 dark:text-parchment/50">
          No discoveries yet. Be the first to share one.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <DiscoveryCard key={d.id} discovery={d} />
          ))}
        </div>
      )}
    </div>
  );
}
