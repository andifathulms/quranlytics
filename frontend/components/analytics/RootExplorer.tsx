"use client";

import { useState } from "react";

import { ArabicText } from "@/components/ui/ArabicText";
import { Badge, Card } from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api/client";
import type { RootTree } from "@/lib/api/types";

import { ArabicKeyboard } from "./ArabicKeyboard";

// Trilateral root explorer: derived lemmas, their surface forms, and counts.
export function RootExplorer({ initialRoot = "" }: { initialRoot?: string }) {
  const [root, setRoot] = useState(initialRoot);
  const [tree, setTree] = useState<RootTree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(value: string) {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.rootTree(value.trim());
      setTree(res.data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Lookup failed");
      setTree(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(root);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          dir="rtl"
          placeholder="مثال: كتب"
          className="flex-1 rounded-lg border border-sand bg-white px-4 py-2 text-xl font-quran focus:border-khatulistiwa focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-khatulistiwa px-5 py-2 text-parchment hover:bg-lapis disabled:opacity-50"
        >
          {loading ? "…" : "Explore"}
        </button>
      </form>

      <ArabicKeyboard onInsert={(ch) => setRoot((r) => r + ch)} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tree && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ArabicText className="text-3xl text-khatulistiwa">
              {tree.root}
            </ArabicText>
            {tree.meaning && <span className="text-lapis/70">{tree.meaning}</span>}
            <Badge tone="emerald">{tree.derivatives.length} forms</Badge>
          </div>

          {tree.derivatives.length === 0 ? (
            <p className="text-lapis/60">No derivatives found for this root.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tree.derivatives.map((d) => (
                <Card key={d.lemma}>
                  <div className="flex items-center justify-between">
                    <ArabicText className="text-2xl">{d.lemma}</ArabicText>
                    <Badge tone="gold">{d.total_count}×</Badge>
                  </div>
                  <div dir="rtl" className="mt-2 flex flex-wrap gap-1">
                    {d.forms.map((f) => (
                      <ArabicText
                        key={f}
                        className="rounded bg-sand/40 px-2 py-0.5 text-lg"
                      >
                        {f}
                      </ArabicText>
                    ))}
                  </div>
                  <div className="mt-2 font-mono text-xs text-lapis/50">
                    {d.sample_verses.join(" · ")}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
