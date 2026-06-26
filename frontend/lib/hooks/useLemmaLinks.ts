"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api/client";
import type { LemmaLinks } from "@/lib/api/types";

// The lemma→name/prophet map is small and static. Fetch it once per session and
// share the promise across every word tooltip so taps don't each hit the API.
let cache: Promise<LemmaLinks> | null = null;

function load(): Promise<LemmaLinks> {
  if (!cache) {
    cache = api
      .lemmaLinks()
      .then((res) => res.data)
      .catch((e) => {
        cache = null; // allow a retry on the next mount
        throw e;
      });
  }
  return cache;
}

export function useLemmaLinks(): LemmaLinks | null {
  const [links, setLinks] = useState<LemmaLinks | null>(null);

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setLinks(data))
      .catch(() => alive && setLinks(null));
    return () => {
      alive = false;
    };
  }, []);

  return links;
}
