// Thin fetch wrapper that unwraps the {data, meta, errors} envelope.
import type {
  ChiasticStructure,
  Cooccurrence,
  CrossReferences,
  DivineNameDetail,
  DivineNames,
  Envelope,
  LemmaLinks,
  NumericClaim,
  NumericClaimDetail,
  NumericClaims,
  PhraseSearch,
  ProphetDetail,
  Prophets,
  RareWord,
  RepeatedVerses,
  RootTree,
  SemanticResult,
  Surah,
  SurahPair,
  SurahStatRow,
  SurahTajwid,
  Tafsir,
  ThemeSummary,
  Verse,
  VerseLengths,
  WordFrequency,
} from "./types";

// Server-side fetches run inside the container and reach the backend over the
// compose network (API_BASE_INTERNAL); browser fetches use the host-mapped URL.
const API_BASE =
  (typeof window === "undefined"
    ? process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE
    : process.env.NEXT_PUBLIC_API_BASE) || "http://localhost:8010/api/v1";

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

  getJuzVerses: (n: number) => request<Verse[]>(`/juz/${n}/verses/`),

  getPageVerses: (n: number) => request<Verse[]>(`/page/${n}/verses/`),

  search: (q: string, lang: "ar" | "en" | "id" = "ar") =>
    request<Verse[]>(`/search/?q=${encodeURIComponent(q)}&lang=${lang}`),

  tafsir: (key: string, lang: "en" | "id" = "en") =>
    request<Tafsir>(`/tafsir/?key=${encodeURIComponent(key)}&lang=${lang}`),

  wordFrequency: (params: { word?: string; root?: string }) => {
    const qs = new URLSearchParams();
    if (params.word) qs.set("word", params.word);
    if (params.root) qs.set("root", params.root);
    return request<WordFrequency>(`/analytics/word-frequency/?${qs.toString()}`);
  },

  rootTree: (root: string) =>
    request<RootTree>(`/analytics/root-tree/?root=${encodeURIComponent(root)}`),

  cooccurrence: (word1: string, word2: string) =>
    request<Cooccurrence>(
      `/analytics/co-occurrence/?word1=${encodeURIComponent(word1)}&word2=${encodeURIComponent(word2)}`,
    ),

  divineNames: () => request<DivineNames>(`/analytics/divine-names/`),

  divineName: (id: string) =>
    request<DivineNameDetail>(
      `/analytics/divine-names/${encodeURIComponent(id)}/`,
    ),

  lemmaLinks: () => request<LemmaLinks>(`/analytics/lemma-links/`),

  surahTajwid: (surahId: number) =>
    request<SurahTajwid>(`/analytics/tajwid/${surahId}/`),

  prophets: () => request<Prophets>(`/analytics/prophets/`),

  prophet: (id: string) =>
    request<ProphetDetail>(`/analytics/prophets/${encodeURIComponent(id)}/`),

  phraseSearch: (q: string) =>
    request<PhraseSearch>(`/analytics/phrase/?q=${encodeURIComponent(q)}`),

  repeatedVerses: (min = 2) =>
    request<RepeatedVerses>(`/analytics/repeated-verses/?min=${min}`),

  surahStats: (surahId: number) =>
    request<Record<string, unknown>>(`/analytics/surah-stats/${surahId}/`),

  allSurahStats: () =>
    request<{ surahs: SurahStatRow[] }>(`/analytics/surah-stats/`),

  rareWords: (threshold = 1) =>
    request<{ words: RareWord[] }>(
      `/analytics/rare-words/?threshold=${threshold}`,
    ),

  verseLengths: (surahId: number) =>
    request<VerseLengths>(`/analytics/verse-lengths/${surahId}/`),

  surahPair: (a: number, b: number) =>
    request<SurahPair>(`/analytics/surah-pair/?a=${a}&b=${b}`),

  chiastic: () =>
    request<{ structures: ChiasticStructure[] }>(`/analytics/chiastic/`),

  // ── Semantic (Phase 4) ──────────────────────────────
  semanticSearch: (query: string, limit = 20) =>
    request<SemanticResult>(`/semantic/search/`, {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    }),

  crossReferences: (verseId: number, limit = 8) =>
    request<CrossReferences>(
      `/semantic/cross-references/${verseId}/?limit=${limit}`,
    ),

  themes: () => request<{ themes: ThemeSummary[] }>(`/semantic/themes/`),

  themeVerses: (clusterId: number) =>
    request<Verse[]>(`/semantic/themes/${clusterId}/`),

  numericClaims: () => request<NumericClaims>(`/analytics/claims/`),

  numericClaim: (id: string) =>
    request<NumericClaimDetail>(`/analytics/claims/${encodeURIComponent(id)}/`),

  verifyClaim: (word: string, expected: number) =>
    request<NumericClaim>(
      `/analytics/verify-claim/?word=${encodeURIComponent(word)}&expected=${expected}`,
    ),
};
