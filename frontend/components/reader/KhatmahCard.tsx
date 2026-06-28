"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import type { ReadingProgress } from "@/lib/api/types";

// Total ayahs in the muṣḥaf — denominator for completion (khatmah) progress.
const QURAN_AYAHS = 6236;
const KEY = "quranlytics:khatmah";

const DURATIONS = [
  { label: "Ramadan (30d)", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

interface Plan {
  days: number;
  startISO: string; // date the plan began (YYYY-MM-DD)
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (fromISO: string, toISO: string) =>
  Math.round(
    (Date.parse(toISO) - Date.parse(fromISO)) / 86_400_000,
  );

// A lightweight Qur'an-completion (khatmah) tracker. It estimates how much of
// the muṣḥaf has been read from the per-surah furthest-ayah progress, and paces
// it against a chosen duration. Persisted locally — it's a personal goal, not
// shared state.
export function KhatmahCard({ progress }: { progress: ReadingProgress }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setPlan(JSON.parse(raw) as Plan);
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  function start(days: number) {
    const p: Plan = { days, startISO: todayISO() };
    setPlan(p);
    window.localStorage.setItem(KEY, JSON.stringify(p));
  }
  function reset() {
    setPlan(null);
    window.localStorage.removeItem(KEY);
  }

  // Estimate ayahs read: the furthest ayah reached in each surah is how far into
  // that surah the reader has gone, so the sum approximates total ayahs covered.
  const read = Math.min(
    QURAN_AYAHS,
    Object.values(progress.progress ?? {}).reduce((a, b) => a + b, 0),
  );
  const pctRead = Math.round((read / QURAN_AYAHS) * 100);

  if (!loaded) return null;

  if (!plan) {
    return (
      <Card>
        <h2 className="font-display text-xl">Khatmah — finish the Qur'an</h2>
        <p className="mt-1 text-sm text-muted">
          Pick a pace and we'll track your completion. You're {pctRead}% through
          the muṣḥaf so far.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.days}
              onClick={() => start(d.days)}
              className="rounded-lg border border-sand px-3 py-1.5 text-sm text-muted hover:text-fg"
            >
              {d.label}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const perDay = Math.ceil(QURAN_AYAHS / plan.days);
  const dayNo = Math.min(plan.days, daysBetween(plan.startISO, todayISO()) + 1);
  const expected = Math.min(QURAN_AYAHS, perDay * dayNo);
  const onTrack = read >= expected;
  const behind = Math.max(0, expected - read);
  const remaining = QURAN_AYAHS - read;
  const daysLeft = Math.max(0, plan.days - dayNo);
  const neededPerDay = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining;
  const done = read >= QURAN_AYAHS;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl">Khatmah plan</h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>
            Day {dayNo} of {plan.days}
          </span>
          <button onClick={reset} className="hover:text-khatulistiwa">
            reset
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all ${
            done ? "bg-emerald" : onTrack ? "bg-waraq" : "bg-danger"
          }`}
          style={{ width: `${pctRead}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-muted">
        {done ? (
          <span className="text-[#1e7e44] dark:text-emerald">
            ✓ Khatmah complete — taqabbal Allāh! {read.toLocaleString()} ayahs.
          </span>
        ) : (
          <>
            {read.toLocaleString()} / {QURAN_AYAHS.toLocaleString()} ayahs (
            {pctRead}%).{" "}
            {onTrack ? (
              <span className="text-[#1e7e44] dark:text-emerald">
                On track ✓
              </span>
            ) : (
              <span className="text-danger">
                Behind by ~{behind.toLocaleString()} ayahs
              </span>
            )}{" "}
            · ~{neededPerDay}/day to finish on time.
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-muted">
        Estimated from your reading position; pace is a guide, not a ruling.
      </p>
    </Card>
  );
}
