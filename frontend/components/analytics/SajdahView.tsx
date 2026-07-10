"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { SajdahVerses } from "@/lib/api/types";

import { VerseList } from "./VerseList";

// The verses of prostration (sujud at-tilawa), read from the ingested
// sajdah markers. We surface the data and its count rather than asserting a
// number, per the project's "present data, let users conclude" rule.
export function SajdahView() {
  const [data, setData] = useState<SajdahVerses | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.sajdahVerses();
      setData(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load sajdah verses");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={load} />;

  if (!data || data.count === 0) {
    return (
      <EmptyState
        icon="🕌"
        title="No sajdah verses loaded"
        description="Re-run the verse ingestion on the backend to load prostration markers, then reload."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Verses carrying a prostration marker (sajdah at-tilāwa), in the order
        they occur in the Mushaf.{" "}
        <Badge tone="emerald">{data.count} marked</Badge>
      </p>
      <VerseList verses={data.verses} />
    </div>
  );
}
