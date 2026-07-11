// Friendly labels for the Quranic Arabic Corpus's terse feature codes, shared
// by the Morphology analytics tool and the reader's word tooltip.
import type { WordSegment } from "@/lib/api/types";

export const POS_COARSE: Record<string, string> = {
  N: "Noun",
  V: "Verb",
  P: "Particle",
};

export const MOOD_LABEL: Record<string, string> = {
  IND: "Indicative",
  SUBJ: "Subjunctive",
  JUS: "Jussive",
};

export const VOICE_LABEL: Record<string, string> = {
  ACT: "Active",
  PASS: "Passive",
};

export const POS_DETAIL_LABEL: Record<string, string> = {
  PRON: "Pronoun",
  P: "Preposition",
  CONJ: "Conjunction",
  REM: "Resumption particle",
  DET: "Determiner (al-)",
  PERF: "Perfect verb",
  IMPF: "Imperfect verb",
  IMPV: "Imperative verb",
  PN: "Proper noun",
  REL: "Relative pronoun",
  ACT_PCPL: "Active participle",
  PASS_PCPL: "Passive participle",
  ADJ: "Adjective",
  VN: "Verbal noun",
  NEG: "Negative particle",
  DEM: "Demonstrative",
  EMPH: "Emphatic",
  COND: "Conditional",
  INTG: "Interrogative",
  T: "Time adverb",
  LOC: "Location adverb",
  VOC: "Vocative",
  SUB: "Subordinating conjunction",
  CERT: "Particle of certainty",
  RES: "Restriction particle",
  FUT: "Future particle",
};

export function labelOf(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

// A compact human description of one segment, e.g.
// "imperfect verb · form I · indicative · active" or "preposition".
export function describeSegment(seg: WordSegment): string {
  const parts: string[] = [];
  parts.push(
    seg.pos_detail
      ? labelOf(POS_DETAIL_LABEL, seg.pos_detail)
      : labelOf(POS_COARSE, seg.pos_tag),
  );
  if (seg.verb_form) parts.push(`form ${seg.verb_form}`);
  if (seg.mood) parts.push(labelOf(MOOD_LABEL, seg.mood).toLowerCase());
  if (seg.voice) parts.push(labelOf(VOICE_LABEL, seg.voice).toLowerCase());
  return parts.join(" · ");
}
