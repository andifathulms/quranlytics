"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";

const CATEGORIES = ["Numerical", "Linguistic", "Structural", "Thematic", "Other"];

export default function NewDiscoveryPage() {
  // useSearchParams must sit under a Suspense boundary for static export.
  return (
    <Suspense fallback={<p className="text-lapis/50">Loading…</p>}>
      <NewDiscoveryForm />
    </Suspense>
  );
}

function NewDiscoveryForm() {
  const { user, token, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  // Pre-fill from query params so analysis tools can deep-link "Share this".
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [body, setBody] = useState(params.get("body") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "Numerical");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/account");
  }, [ready, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      let payload: Record<string, unknown> = {};
      const raw = params.get("payload");
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = {};
        }
      }
      const created = await auth.createDiscovery(token, {
        title,
        body,
        category,
        payload,
        is_public: isPublic,
      });
      router.replace(`/discoveries/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-3xl">Share a Discovery</h1>
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            maxLength={200}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-lapis focus:border-khatulistiwa focus:outline-none"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe what you found — present the data and let readers conclude."
            required
            rows={6}
            className="w-full rounded-lg border border-sand bg-white px-3 py-2 text-lapis focus:border-khatulistiwa focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-sand bg-white px-3 py-1.5 text-lapis focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-khatulistiwa px-5 py-2 text-parchment hover:bg-lapis disabled:opacity-50"
          >
            {busy ? "Saving…" : "Publish"}
          </button>
        </form>
      </Card>
    </div>
  );
}
