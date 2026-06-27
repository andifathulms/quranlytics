"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DiscoveryCard } from "@/components/community/DiscoveryCard";
import { Badge } from "@/components/ui/Card";
import { auth } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Profile } from "@/lib/api/types";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { token, ready } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    auth
      .profile(token, username)
      .then((p) => active && setProfile(p))
      .catch(() => active && setNotFound(true));
    return () => {
      active = false;
    };
  }, [ready, token, username]);

  if (notFound) {
    return <p className="text-lapis/60 dark:text-parchment/60">User not found.</p>;
  }
  if (!profile) {
    return <p className="text-lapis/50 dark:text-parchment/50">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-xl bg-lapis px-6 py-8 text-parchment">
        <h1 className="font-display text-3xl text-waraq">{profile.username}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="emerald">{profile.discovery_count} discoveries</Badge>
          <Badge tone="gold">▲ {profile.total_score} total</Badge>
          {profile.reading && (
            <>
              <Badge tone="gold">🔥 {profile.reading.streak}-day streak</Badge>
              <Badge tone="blue">
                {profile.reading.completed_count} surahs completed
              </Badge>
            </>
          )}
        </div>
      </header>

      {profile.discoveries.length === 0 ? (
        <p className="text-lapis/50 dark:text-parchment/50">
          No public discoveries yet.
        </p>
      ) : (
        <div className="space-y-3">
          {profile.discoveries.map((d) => (
            <DiscoveryCard key={d.id} discovery={d} />
          ))}
        </div>
      )}
    </div>
  );
}
