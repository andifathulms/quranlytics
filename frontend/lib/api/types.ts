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
