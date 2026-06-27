// Shared API types mirroring the Django/DRF serializers.

export interface Envelope<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: ApiError[];
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

export interface Surah {
  id: number;
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_en: string;
  name_id: string;
  revelation_type: "Meccan" | "Medinan";
  verse_count: number;
  revelation_order: number;
  stats?: SurahStats | null;
}

export interface SurahStats {
  verse_count: number;
  word_count: number;
  letter_count: number;
  unique_word_count: number;
  unique_root_count: number;
}

export interface Translation {
  language: "en" | "id";
  translator: string;
  text: string;
}

export interface WordRoot {
  root_arabic: string; // normalized lookup key
  root_display: string; // proper orthography (hamza preserved)
  root_transliteration: string;
  meaning_en: string;
  meaning_id: string;
}

export interface Word {
  id: number;
  position: number;
  arabic: string;
  transliteration: string;
  translation_en: string;
  lemma: string;
  root: WordRoot | null;
  morphology_tag: string;
  is_stopword: boolean;
}

export interface Verse {
  id: number;
  surah_number: number;
  number: number;
  verse_key: string;
  text_uthmani: string;
  juz_number: number;
  page_number: number;
  revelation_order: number;
  translations: Translation[];
  words?: Word[];
}

export interface WordFrequency {
  query: string;
  total: number;
  per_surah: { surah_id: number; surah_name: string; count: number }[];
}

export interface NumericClaim {
  word: string;
  claimed: number;
  actual: number;
  verified: boolean;
  verses: string[];
}

export type DiscoveryCategory =
  | "Numerical"
  | "Linguistic"
  | "Structural"
  | "Thematic"
  | "Other";

export interface Discovery {
  id: number;
  author_username: string;
  title: string;
  body: string;
  category: DiscoveryCategory;
  payload: Record<string, unknown>;
  is_public: boolean;
  vote_score: number;
  my_vote: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileReading {
  streak: number;
  longest_streak: number;
  completed_count: number;
}

export interface Profile {
  username: string;
  discovery_count: number;
  total_score: number;
  reading: ProfileReading | null;
  discoveries: Discovery[];
}

export type ScoredVerse = Verse & { similarity: number };

export interface SemanticResult {
  query: string;
  count: number;
  verses: ScoredVerse[];
}

export interface CrossReferences {
  verse_id: number;
  available: boolean;
  count: number;
  verses: ScoredVerse[];
}

export interface ThemeSummary {
  cluster_id: number;
  label: string;
  keywords: string[];
  size: number;
  sample_verses: { verse_key: string }[];
}

export interface Tafsir {
  verse_key: string;
  language: string;
  resource_name: string;
  text: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Bookmark {
  id: number;
  verse: number;
  verse_key: string;
  created_at: string;
}

export interface Note {
  id: number;
  verse: number;
  verse_key: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Cooccurrence {
  word1: string;
  word2: string;
  count: number;
  verses: Verse[];
}

export interface ProphetSummary {
  id: string;
  order: number;
  arabic: string;
  transliteration: string;
  name_en: string;
  name_id: string;
  blurb_en: string;
  direct_count: number;
  epithet_count: number;
}

export interface Prophets {
  prophets: ProphetSummary[];
  methodology: string;
}

export interface ProphetReference {
  label_en: string;
  arabic: string;
  count: number;
  verses: Verse[];
}

export interface ProphetDetail {
  available: boolean;
  id: string;
  order: number;
  arabic: string;
  transliteration: string;
  name_en: string;
  name_id: string;
  blurb_en: string;
  methodology: string;
  direct_total: number;
  direct_per_surah: { surah_id: number; surah_name: string; count: number }[];
  direct_verses: Verse[];
  references: ProphetReference[];
}

export interface ReadingProgress {
  last_surah: number | null;
  last_verse: number | null;
  last_verse_key: string | null;
  progress: Record<string, number>;
  streak_count: number;
  longest_streak: number;
  last_read_date: string | null;
  started_count: number;
  completed_count: number;
  daily_goal: number;
  today_ayahs: number;
  goal_met: boolean;
  reading_days: string[]; // ISO dates with reading activity
  updated_at: string;
}

export interface TajwidSegment {
  text: string;
  rule: string | null;
}

export interface TajwidVerse {
  verse_key: string;
  segments: TajwidSegment[];
}

export interface TajwidLegendItem {
  id: string;
  label_en: string;
  color: string;
}

export interface SurahTajwid {
  available: boolean;
  surah_id: number;
  legend: TajwidLegendItem[];
  verses: TajwidVerse[];
}

export interface LemmaLink {
  id: string;
  label: string;
}

export interface LemmaLinks {
  // Keyed by normalized Arabic lemma.
  names: Record<string, LemmaLink>;
  prophets: Record<string, LemmaLink>;
}

export type ClaimVerdict = "verified" | "disputed" | "refuted";

export interface ClaimTerm {
  label: string;
  lemma: string;
  count: number;
}

export interface NumericClaimSummary {
  id: string;
  category: string;
  title: string;
  claim_en: string;
  claimed_display: string;
  verdict: ClaimVerdict;
  note_en: string;
  terms: ClaimTerm[];
}

export interface NumericClaims {
  claims: NumericClaimSummary[];
  categories: string[];
  methodology: string;
}

export interface ClaimTermDetail extends ClaimTerm {
  verse_total: number;
  verses: Verse[];
}

export interface NumericClaimDetail {
  available: boolean;
  id: string;
  category: string;
  title: string;
  claim_en: string;
  claimed_display: string;
  verdict: ClaimVerdict;
  note_en: string;
  methodology: string;
  terms: ClaimTermDetail[];
}

export interface PhraseSearch {
  phrase: string;
  count: number;
  verses: Verse[];
}

export interface RepeatedVerse {
  count: number;
  word_count: number;
  verse_keys: string[];
  verse: Verse;
}

export interface RepeatedVerses {
  refrains: RepeatedVerse[];
}

export interface DivineNameSummary {
  id: string;
  number: number;
  arabic: string;
  transliteration: string;
  meaning_en: string;
  meaning_id: string;
  root: string | null;
  count: number | null;
}

export interface DivineNames {
  names: DivineNameSummary[];
  methodology: string;
}

export interface DivineNameDetail {
  available: boolean;
  id: string;
  number: number;
  arabic: string;
  transliteration: string;
  meaning_en: string;
  meaning_id: string;
  root: string | null;
  lemma: string | null;
  methodology: string;
  total: number | null;
  per_surah: { surah_id: number; surah_name: string; count: number }[];
  verse_total: number;
  verses: Verse[];
}

export interface SurahStatRow {
  surah_id: number;
  surah_name: string;
  revelation_type: "Meccan" | "Medinan";
  verse_count: number;
  word_count: number;
  letter_count: number;
  unique_word_count: number;
  unique_root_count: number;
}

export interface RareWord {
  lemma: string;
  count: number;
  verse_key: string | null;
}

export interface VerseLength {
  number: number;
  verse_key: string;
  word_count: number;
  letter_count: number;
}

export interface VerseLengths {
  surah_id: number;
  surah_name: string;
  available: boolean;
  verses: VerseLength[];
  summary: { max: number; min: number; avg: number; verse_count: number };
}

export interface SurahBrief {
  surah_id: number;
  name: string;
  name_arabic: string;
  revelation_type: "Meccan" | "Medinan";
  verse_count: number;
  word_count: number | null;
  letter_count: number | null;
  first_verse: Verse | null;
  last_verse: Verse | null;
}

export interface SurahPair {
  available: boolean;
  a: SurahBrief;
  b: SurahBrief;
  symmetry: {
    same_verse_count: boolean;
    verse_count_diff: number;
    word_count_diff: number;
  };
}

export interface ChiasticLevel {
  label: string;
  verse_key: string;
  theme: string;
  text_uthmani: string;
  translation_en: string;
}

export interface ChiasticStructure {
  id: string;
  title: string;
  surah: number;
  attribution: string;
  levels: ChiasticLevel[];
}

export interface RootTree {
  root: string; // display form (proper orthography)
  root_key?: string; // normalized lookup key
  root_transliteration?: string;
  meaning: string;
  derivatives: {
    lemma: string;
    forms: string[];
    total_count: number;
    sample_verses: string[];
  }[];
}
