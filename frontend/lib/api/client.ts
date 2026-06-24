// Thin fetch wrapper that unwraps the {data, meta, errors} envelope.
import type {
  Envelope,
  NumericClaim,
  RootTree,
  Surah,
  Verse,
  WordFrequency,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<Envelope<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    // Quran data is static — let Next cache server-side fetches.
    next: { revalidate: 3600 },
  });

  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`Invalid response from ${path}`, res.status);
  }

  if (!res.ok) {
    const message = body?.errors?.[0]?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body;
}

export const api = {
  listSurahs: (order: "mushaf" | "revelation" = "mushaf") =>
    request<Surah[]>(`/surahs/${order === "revelation" ? "?order=revelation" : ""}`),

  getSurah: (number: number) => request<Surah>(`/surahs/${number}/`),

  getSurahVerses: (number: number, order: "mushaf" | "revelation" = "mushaf") =>
    request<Verse[]>(
      `/surahs/${number}/verses/${order === "revelation" ? "?order=revelation" : ""}`,
    ),

  getVerse: (id: number) => request<Verse>(`/verses/${id}/`),

  search: (q: string, lang: "ar" | "en" | "id" = "ar") =>
    request<Verse[]>(`/search/?q=${encodeURIComponent(q)}&lang=${lang}`),

  wordFrequency: (params: { word?: string; root?: string }) => {
    const qs = new URLSearchParams();
    if (params.word) qs.set("word", params.word);
    if (params.root) qs.set("root", params.root);
    return request<WordFrequency>(`/analytics/word-frequency/?${qs.toString()}`);
  },

  rootTree: (root: string) =>
    request<RootTree>(`/analytics/root-tree/?root=${encodeURIComponent(root)}`),

  surahStats: (surahId: number) =>
    request<Record<string, unknown>>(`/analytics/surah-stats/${surahId}/`),

  verifyClaim: (word: string, expected: number) =>
    request<NumericClaim>(
      `/analytics/verify-claim/?word=${encodeURIComponent(word)}&expected=${expected}`,
    ),
};
