"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ShareDiscoveryButton } from "@/components/community/ShareDiscoveryButton";
import { ArabicText } from "@/components/ui/ArabicText";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
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

  // Auto-run when arriving with a prefilled root (deep link / example chip).
  const ranFor = useRef<string | null>(null);
  useEffect(() => {
    if (initialRoot && ranFor.current !== initialRoot) {
      ranFor.current = initialRoot;
      setRoot(initialRoot);
      run(initialRoot);
    }
  }, [initialRoot]);

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(root);
        }}
        className="flex flex-wrap gap-2"
      >
        <Input
          script="arabic"
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          placeholder="مثال: كتب"
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Explore
        </Button>
      </form>

      <ArabicKeyboard onInsert={(ch) => setRoot((r) => r + ch)} />

      {error && <ErrorBanner message={error} onRetry={() => run(root)} />}

      {tree && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <ArabicText className="text-3xl text-khatulistiwa">
              {tree.root}
            </ArabicText>
            {tree.meaning && <span className="text-muted">{tree.meaning}</span>}
            <Badge tone="emerald">{tree.derivatives.length} forms</Badge>
            {tree.derivatives.length > 0 && (
              <ShareDiscoveryButton
                title={`Root ${tree.root} (${tree.root_transliteration ?? ""}) yields ${tree.derivatives.length} forms`}
                body={`The root ${tree.root}${tree.meaning ? ` — "${tree.meaning}"` : ""} appears in ${tree.derivatives.length} derived word-forms across the Quran.`}
                category="Linguistic"
                payload={{ root: tree.root, forms: tree.derivatives.length }}
              />
            )}
          </div>

          {tree.derivatives.length === 0 ? (
            <EmptyState
              icon="∅"
              title="No derivatives found"
              description="No words in the Quran derive from this root. Check the three root letters."
            />
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
                        className="rounded bg-surface-2 px-2 py-0.5 text-lg"
                      >
                        {f}
                      </ArabicText>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 font-mono text-xs">
                    {d.sample_verses.map((key) => (
                      <Link
                        key={key}
                        href={`/${key.split(":")[0]}?hl=${encodeURIComponent(d.lemma)}#${key.replace(":", "-")}`}
                        className="text-khatulistiwa hover:underline"
                      >
                        {key}
                      </Link>
                    ))}
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
