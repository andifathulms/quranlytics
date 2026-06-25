"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Badge, Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthContext";

export default function DashboardPage() {
  const { user, ready, bookmarks, notes } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/account");
  }, [ready, user, router]);

  if (!ready || !user) {
    return <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>;
  }

  const bookmarkList = Array.from(bookmarks.values());
  const noteList = Array.from(notes.values());

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Salam, {user.username}</h1>
          <p className="text-lapis/60 dark:text-parchment/60">
            Your saved verses, notes, and discoveries.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/u/${user.username}`}
            className="rounded-lg border border-khatulistiwa px-3 py-1.5 text-khatulistiwa hover:bg-sand/40"
          >
            My public profile
          </Link>
          <Link
            href="/discoveries/new"
            className="rounded-lg bg-khatulistiwa px-3 py-1.5 text-parchment hover:bg-lapis"
          >
            + Share a discovery
          </Link>
        </div>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          Bookmarks <Badge tone="gold">{bookmarkList.length}</Badge>
        </h2>
        {bookmarkList.length === 0 ? (
          <p className="text-sm text-lapis/50 dark:text-parchment/50">
            No bookmarks yet — tap ☆ on any verse in the reader.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bookmarkList.map((b) => (
              <Link key={b.id} href={`/${b.verse_key.split(":")[0]}`}>
                <Badge tone="blue">{b.verse_key}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl">
          Notes <Badge tone="emerald">{noteList.length}</Badge>
        </h2>
        {noteList.length === 0 ? (
          <p className="text-sm text-lapis/50 dark:text-parchment/50">
            No notes yet — tap ✎ on any verse to write one.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {noteList.map((n) => (
              <Card key={n.id}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-khatulistiwa">
                    {n.verse_key}
                  </span>
                  <span className="text-xs text-lapis/40 dark:text-parchment/40">
                    {new Date(n.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
