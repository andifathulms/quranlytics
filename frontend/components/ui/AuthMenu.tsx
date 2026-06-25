"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth/AuthContext";

// Header auth control: sign-in link when logged out; username + dashboard +
// sign-out when logged in.
//
// `variant` adapts the palette to its container:
//   - "onDark"  → the dark lapis header (parchment/gold text)
//   - "surface" → the light/dark mobile drawer (semantic tokens)
export function AuthMenu({
  variant = "onDark",
}: {
  variant?: "onDark" | "surface";
}) {
  const { user, ready, logout } = useAuth();

  const onDark = variant === "onDark";
  const ring =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    (onDark
      ? "focus-visible:ring-waraq focus-visible:ring-offset-lapis"
      : "focus-visible:ring-accent focus-visible:ring-offset-bg");
  const primaryLink = onDark ? "text-parchment/80 hover:text-waraq" : "text-fg hover:text-accent";
  const mutedLink = onDark ? "text-parchment/50 hover:text-waraq" : "text-muted hover:text-fg";

  if (!ready) {
    return <span className="text-xs text-muted">…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/account"
        className={cn(
          "rounded border px-3 py-1 text-sm",
          ring,
          onDark
            ? "border-waraq/60 text-waraq hover:bg-waraq/10"
            : "border-accent/60 text-accent hover:bg-accent/10",
        )}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/dashboard" className={cn(primaryLink, ring, "rounded")}>
        {user.username}
      </Link>
      <button
        onClick={logout}
        className={cn(mutedLink, ring, "rounded")}
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}
