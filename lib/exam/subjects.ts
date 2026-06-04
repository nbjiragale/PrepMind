// Pure helpers that operate on already-loaded SubjectRow arrays (no DB I/O).
// All functions are deterministic and side-effect-free — unit-testable in
// isolation from the database.

import type { SubjectKey, SubjectRow, GenerationMode } from "../db/types.js";

/**
 * Returns the generation_mode for the given subject key, or null when the
 * subject is not in the catalog (caller should treat unknown as an error at
 * validation boundaries, but null is graceful for read paths).
 */
export function generationModeFor(
  subjects: SubjectRow[],
  key: SubjectKey
): GenerationMode | null {
  return subjects.find((s) => s.key === key)?.generation_mode ?? null;
}

/**
 * Keys of subjects that use free generation + independent verification
 * (math/reasoning-style). These subjects do NOT need a source passage.
 */
export function verifiedFreeKeys(subjects: SubjectRow[]): SubjectKey[] {
  return subjects.filter((s) => s.generation_mode === "verified_free").map((s) => s.key);
}

/**
 * Keys of subjects that require a grounded source text before generation
 * (GA-style). Ungrounded generation for these subjects must be impossible by
 * construction (Hard Rule §1).
 */
export function groundedKeys(subjects: SubjectRow[]): SubjectKey[] {
  return subjects.filter((s) => s.generation_mode === "grounded").map((s) => s.key);
}

/**
 * Human-readable label for a subject key, falling back to the key itself when
 * not found (safe for display even if the catalog hasn't loaded yet).
 */
export function subjectLabel(subjects: SubjectRow[], key: SubjectKey): string {
  return subjects.find((s) => s.key === key)?.label ?? key;
}

/**
 * BKT guess-probability = 1 / options_per_question.
 * Replaces the hardcoded GUESS = 0.25 (4 options) in lib/readiness.ts.
 * For RRB NTPC: guessProbability(4) === 0.25.
 */
export function guessProbability(optionsPerQuestion: number): number {
  if (optionsPerQuestion < 2) return 0;
  return 1 / optionsPerQuestion;
}

/**
 * Returns subject rows sorted for display (ascending position, then key).
 * Useful for the graph canvas column order and concept/form selects.
 */
export function sortedSubjects(subjects: SubjectRow[]): SubjectRow[] {
  return [...subjects].sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
}
