// H4 — likelihood a current-affairs item is asked on the active exam's
// fact-grounded section. Category-based priors keep this deterministic and free
// (no LLM): categories that recur in past papers score higher. Per-exam priors
// live in exam_config.ca_category_priors (seeded from the preset); callers pass
// them in. Pure — unit-tested.

export type CaCategoryPriors = Record<string, number>;

// RRB NTPC default priors, also used as the fallback when no priors are supplied
// (e.g. the unit tests and any pre-config path). Mirrors RRB_NTPC.ca_category_priors.
export const RRB_CATEGORY_PRIORS: CaCategoryPriors = {
  appointments: 0.85,
  schemes: 0.85,
  awards: 0.8,
  defence: 0.75,
  summits: 0.7,
  agreements: 0.7,
  sports: 0.65,
  economy: 0.65,
  science: 0.6,
  technology: 0.6,
  days: 0.55,
  obituaries: 0.5,
  books: 0.45,
};

const DEFAULT_PRIOR = 0.5;

// When `priors` is omitted, falls back to the RRB default map (backward-compatible
// and sensible pre-config). When an explicit (possibly empty) map is passed, any
// category not in it resolves to the neutral 0.5 prior.
export function caExamProbability(
  category: string | null | undefined,
  priors: CaCategoryPriors = RRB_CATEGORY_PRIORS
): number {
  if (!category) return DEFAULT_PRIOR;
  return priors[category.trim().toLowerCase()] ?? DEFAULT_PRIOR;
}
