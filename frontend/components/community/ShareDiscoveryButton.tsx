"use client";

import Link from "next/link";

import type { DiscoveryCategory } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthContext";

// Deep-links to the discovery composer with the finding prefilled. The composer
// reads these query params (title/body/category/payload). Shown to everyone —
// signed-out users land on /account first (the composer redirects).
export function ShareDiscoveryButton({
  title,
  body,
  category = "Other",
  payload,
  className = "",
}: {
  title: string;
  body: string;
  category?: DiscoveryCategory;
  payload?: Record<string, unknown>;
  className?: string;
}) {
  const { user } = useAuth();
  const qs = new URLSearchParams({ title, body, category });
  if (payload) qs.set("payload", JSON.stringify(payload));

  const href = user
    ? `/discoveries/new?${qs.toString()}`
    : `/account`;

  return (
    <Link
      href={href}
      title={user ? "Share this as a discovery" : "Sign in to share"}
      className={`inline-flex items-center gap-1 rounded-lg border border-khatulistiwa px-3 py-1.5 text-xs text-khatulistiwa hover:bg-sand/40 ${className}`}
    >
      ✦ Share as discovery
    </Link>
  );
}
