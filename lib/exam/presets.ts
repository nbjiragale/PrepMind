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

// Registry of all bundled presets. The onboarding picker shows these.
export const EXAM_PRESETS: readonly ExamPreset[] = [RRB_NTPC];

/** Look up a preset by its slug. Returns undefined when not found. */
export function findPreset(slug: string): ExamPreset | undefined {
  return EXAM_PRESETS.find((p) => p.slug === slug);
}
