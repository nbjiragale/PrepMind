// Exam presets — the single source of truth for the default configuration of a
// supported exam. A preset is applied once at onboarding (or on exam switch) to
// seed the `subject` table, `exam_config`, and the concept ontology. Presets are
// pure data — no DB I/O here.

import type { SubjectInput } from "@/lib/db/queries/subjects";
import type { ExamSection } from "@/lib/db/types";
import type { OntologyData } from "@/lib/db/queries/ontology";
import {
  RRB_NTPC_CONCEPTS,
  RRB_NTPC_PREREQUISITES,
  RRB_NTPC_CONTRASTS,
} from "./ontology/rrb-ntpc.ts";

// CA category priors: probability a news item of that category appears on the
// exam, used by caRanking.ts (H4). Keyed to the category strings the scraper and
// Gemini pipeline produce.
export type CaCategoryPriors = Record<string, number>;

export interface ExamPreset {
  /** Human-readable exam name, also stored as exam_config.exam_name. */
  readonly name: string;
  /** Short slug used in URLs / logs; keep URL-safe. */
  readonly slug: string;
  /** Subjects for this exam. Inserted into the `subject` table on seed. */
  readonly subjects: readonly SubjectInput[];
  /** Sections with subject_key mappings. */
  readonly sections: readonly ExamSection[];
  /** Negative-marking penalty per wrong answer (0 = no penalty). */
  readonly negative_mark_ratio: number;
  /** MCQ option count; drives guess-probability and option-count validation. */
  readonly options_per_question: number;
  /** Conventional qualifying fraction (0–1), e.g. 0.45 = 45% qualifying band. */
  readonly qualifying_fraction: number;
  /** Per-category exam probability priors for current-affairs ranking. */
  readonly ca_category_priors: CaCategoryPriors;
  /** Concept ontology (concepts + prerequisite/contrast edges) seeded at onboarding. */
  readonly ontology: OntologyData;
}

// ─── RRB NTPC ────────────────────────────────────────────────────────────────
// Reproduces the original single-exam configuration exactly so switching to
// RRB NTPC from the onboarding picker yields identical behaviour to the v1–v6
// build (CLAUDE.md §11).

export const RRB_NTPC: ExamPreset = {
  name: "RRB NTPC",
  slug: "rrb-ntpc",
  subjects: [
    { key: "math",      label: "Mathematics",                       generation_mode: "verified_free", position: 0 },
    { key: "reasoning", label: "General Intelligence & Reasoning",  generation_mode: "verified_free", position: 1 },
    { key: "ga",        label: "General Awareness",                 generation_mode: "grounded",      position: 2 },
  ],
  sections: [
    { name: "Mathematics",                      questions: 30, marks: 30, time_s: 0, subject_key: "math"      },
    { name: "General Intelligence & Reasoning", questions: 30, marks: 30, time_s: 0, subject_key: "reasoning" },
    { name: "General Awareness",                questions: 40, marks: 40, time_s: 0, subject_key: "ga"        },
  ],
  negative_mark_ratio: 1 / 3,
  options_per_question: 4,
  qualifying_fraction: 0.45,
  ca_category_priors: {
    appointments: 0.85,
    schemes:      0.85,
    awards:       0.80,
    defence:      0.75,
    summits:      0.70,
    agreements:   0.70,
    sports:       0.65,
    economy:      0.65,
    science:      0.60,
    technology:   0.60,
    days:         0.55,
    obituaries:   0.50,
    books:        0.45,
  },
  ontology: {
    concepts: RRB_NTPC_CONCEPTS,
    prerequisites: RRB_NTPC_PREREQUISITES,
    contrasts: RRB_NTPC_CONTRASTS,
  },
};

// Lean presets ship without a hand-authored ontology: onboarding seeds subjects
// + exam_config, and the learner drafts the concept tree in-app via the AI
// ontology generator (/exam → "Generate a starter ontology"). Keeps new exams
// cheap to add and accurate where it matters (structure/marking), while concepts
// stay reviewable-before-seed.
const EMPTY_ONTOLOGY: OntologyData = { concepts: [], prerequisites: [], contrasts: [] };

// ─── SSC CGL (Tier-1) ─────────────────────────────────────────────────────────
// Combined Graduate Level, Tier-1 CBT: 4 sections × 25 Q × 2 marks = 100 Q / 200
// marks in 60 min. Wrong answers lose 0.5 marks; normalised against the 2-mark
// reward that is 0.25 per question (scoreMock works in per-question units). 4
// options. Tier-1 is screening/qualifying; 0.50 is a soft readiness target, not
// an official cutoff. GA is grounded (Hard Rule §1); the rest are verified-free.
export const SSC_CGL: ExamPreset = {
  name: "SSC CGL",
  slug: "ssc-cgl",
  subjects: [
    { key: "reasoning", label: "General Intelligence & Reasoning", generation_mode: "verified_free", position: 0 },
    { key: "quant",     label: "Quantitative Aptitude",            generation_mode: "verified_free", position: 1 },
    { key: "english",   label: "English Comprehension",            generation_mode: "verified_free", position: 2 },
    { key: "ga",        label: "General Awareness",                generation_mode: "grounded",      position: 3 },
  ],
  sections: [
    { name: "General Intelligence & Reasoning", questions: 25, marks: 50, time_s: 0, subject_key: "reasoning" },
    { name: "Quantitative Aptitude",            questions: 25, marks: 50, time_s: 0, subject_key: "quant"     },
    { name: "English Comprehension",            questions: 25, marks: 50, time_s: 0, subject_key: "english"   },
    { name: "General Awareness",                questions: 25, marks: 50, time_s: 0, subject_key: "ga"        },
  ],
  negative_mark_ratio: 0.25, // −0.5 marks per wrong on a 2-mark question
  options_per_question: 4,
  qualifying_fraction: 0.5,
  ca_category_priors: {
    science:      0.80,
    schemes:      0.75,
    appointments: 0.70,
    awards:       0.70,
    sports:       0.65,
    technology:   0.65,
    economy:      0.60,
    summits:      0.60,
    days:         0.60,
    defence:      0.60,
    agreements:   0.55,
    books:        0.55,
    obituaries:   0.45,
  },
  ontology: EMPTY_ONTOLOGY,
};

// ─── Karnataka State Police — Civil Police Constable ──────────────────────────
// KSP CPC written test: a single combined objective paper of 100 MCQs × 1 mark =
// 100 marks (~90 min), 0.25 negative per wrong, 30% qualifying, bilingual
// (Kannada + English). The official paper isn't formally sub-sectioned; the
// section split below is an app-side study breakdown of the published syllabus so
// practice/mocks/planner are useful (counts sum to 100). Factual domains (GS,
// science, language) are grounded (Hard Rule §1); ability domains are verified-free.
export const KSP_CONSTABLE: ExamPreset = {
  name: "Karnataka Police Constable",
  slug: "ksp-constable",
  subjects: [
    { key: "gs",        label: "General Studies & Current Affairs", generation_mode: "grounded",      position: 0 },
    { key: "science",   label: "General Science",                   generation_mode: "grounded",      position: 1 },
    { key: "reasoning", label: "Mental Ability & Reasoning",        generation_mode: "verified_free", position: 2 },
    { key: "quant",     label: "Numerical Ability",                 generation_mode: "verified_free", position: 3 },
    { key: "kannada",   label: "Kannada Language",                  generation_mode: "grounded",      position: 4 },
  ],
  sections: [
    { name: "General Studies & Current Affairs", questions: 35, marks: 35, time_s: 0, subject_key: "gs"        },
    { name: "General Science",                   questions: 15, marks: 15, time_s: 0, subject_key: "science"   },
    { name: "Mental Ability & Reasoning",        questions: 20, marks: 20, time_s: 0, subject_key: "reasoning" },
    { name: "Numerical Ability",                 questions: 20, marks: 20, time_s: 0, subject_key: "quant"     },
    { name: "Kannada Language",                  questions: 10, marks: 10, time_s: 0, subject_key: "kannada"   },
  ],
  negative_mark_ratio: 0.25, // −0.25 marks per wrong on a 1-mark question
  options_per_question: 4,
  qualifying_fraction: 0.3, // official minimum qualifying is 30%
  // Note: the exam is bilingual (Kannada + English); the UI stays English
  // (schema is language-agnostic via exam_config.locale, defaulted to 'en').
  ca_category_priors: {
    science:      0.75,
    schemes:      0.70,
    days:         0.65,
    awards:       0.65,
    appointments: 0.60,
    sports:       0.60,
    defence:      0.60,
    economy:      0.55,
    technology:   0.55,
    summits:      0.50,
    obituaries:   0.50,
    books:        0.50,
    agreements:   0.45,
  },
  ontology: EMPTY_ONTOLOGY,
};

// Registry of all bundled presets. The onboarding picker shows these in order.
export const EXAM_PRESETS: readonly ExamPreset[] = [RRB_NTPC, SSC_CGL, KSP_CONSTABLE];

/** Look up a preset by its slug. Returns undefined when not found. */
export function findPreset(slug: string): ExamPreset | undefined {
  return EXAM_PRESETS.find((p) => p.slug === slug);
}
