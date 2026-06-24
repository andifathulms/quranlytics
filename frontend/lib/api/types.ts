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
  root_arabic: string;
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

export interface RootTree {
  root: string;
  root_transliteration?: string;
  meaning: string;
  derivatives: {
    lemma: string;
    forms: string[];
    total_count: number;
    sample_verses: string[];
  }[];
}
