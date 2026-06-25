"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth/AuthContext";

// Header auth control: sign-in link when logged out; username + dashboard +
// sign-out when logged in.
export function AuthMenu() {
  const { user, ready, logout } = useAuth();

  if (!ready) {
    return <span className="text-xs text-parchment/40">…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/account"
        className="rounded border border-waraq/60 px-3 py-1 text-sm text-waraq hover:bg-waraq/10"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/dashboard" className="text-parchment/80 hover:text-waraq">
        {user.username}
      </Link>
      <button
        onClick={logout}
        className="text-parchment/50 hover:text-waraq"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}
