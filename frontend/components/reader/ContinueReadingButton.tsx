"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth/AuthContext";

// Hero CTA: resume from the reader's last position. Renders nothing until a
// signed-in reader has a saved position.
export function ContinueReadingButton() {
  const { progress } = useAuth();
  if (!progress?.last_verse_key) return null;

  return (
    <Link
      href={`/${progress.last_surah}`}
      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-waraq px-4 py-2 text-sm font-medium text-lapis hover:opacity-90"
    >
      ▶ Continue reading — Surah {progress.last_surah}, ayah{" "}
      {progress.last_verse}
    </Link>
  );
}
