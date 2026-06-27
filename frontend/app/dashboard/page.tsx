"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Badge, Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthContext";

export default function DashboardPage() {
  const { user, ready, bookmarks, notes, progress, setReadingGoal } = useAuth();
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
            href="/saved"
            className="rounded-lg border border-khatulistiwa px-3 py-1.5 text-khatulistiwa hover:bg-sand/40"
          >
            Manage saved
          </Link>
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

      {progress && (progress.last_verse_key || progress.streak_count > 0) && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="sm:col-span-1">
            <div className="text-xs uppercase tracking-wide text-muted">
              Continue reading
            </div>
            {progress.last_verse_key ? (
              <Link
                href={`/${progress.last_surah}`}
                className="mt-1 inline-block font-display text-2xl text-khatulistiwa hover:underline"
              >
                Surah {progress.last_surah} · ayah {progress.last_verse} →
              </Link>
            ) : (
              <p className="mt-1 text-sm text-muted">Start reading any surah.</p>
            )}
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted">
              Reading streak
            </div>
            <div className="mt-1 font-display text-2xl">
              🔥 {progress.streak_count}{" "}
              <span className="text-base text-muted">
                day{progress.streak_count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="text-xs text-muted">
              Longest: {progress.longest_streak}
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted">
              Surahs
            </div>
            <div className="mt-1 font-display text-2xl">
              {progress.completed_count}
              <span className="text-base text-muted">
                {" "}
                completed
              </span>
            </div>
            <div className="text-xs text-muted">
              {progress.started_count} started
            </div>
          </Card>
        </section>
      )}

      {progress && (
        <GoalCard
          goal={progress.daily_goal}
          today={progress.today_ayahs}
          met={progress.goal_met}
          onSet={setReadingGoal}
        />
      )}

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

const GOAL_OPTIONS = [0, 5, 10, 20, 50];

function GoalCard({
  goal,
  today,
  met,
  onSet,
}: {
  goal: number;
  today: number;
  met: boolean;
  onSet: (goal: number) => Promise<void>;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((today / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - today);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl">Daily reading goal</h2>
        <div className="flex gap-1 text-xs">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g}
              onClick={() => onSet(g)}
              className={`rounded px-2 py-1 transition-colors ${
                goal === g
                  ? "bg-khatulistiwa text-parchment"
                  : "border border-sand text-muted hover:text-fg"
              }`}
            >
              {g === 0 ? "Off" : `${g}/day`}
            </button>
          ))}
        </div>
      </div>

      {goal === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Set a daily target of new ayahs to build a habit — reading in the
          reader counts automatically.
        </p>
      ) : (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all ${
                met ? "bg-emerald" : "bg-waraq"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {met ? (
              <span className="text-[#1e7e44] dark:text-emerald">
                ✓ Goal met — {today} new ayahs today. Baarak Allāhu fīk!
              </span>
            ) : (
              <>
                {today} / {goal} new ayahs today — {remaining} to go.
              </>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
