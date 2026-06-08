// Pure validation/normalisation for an LLM-proposed concept ontology. No I/O —
// the service (ontologyGen.ts) calls the model and this judges the result, so the
// review-before-seed gate is fully unit-testable with fixtures.
//
// The generator produces STRUCTURE (a syllabus taxonomy + prerequisite/contrast
// relations), never exam facts/questions/answers — so Hard Rule §1 is untouched:
// grounded subjects still only ever get questions/cards from source text via the
// gated generation paths. This module just cleans the proposed map of topics.

import type { OntologyData } from "@/lib/db/queries/ontology";
import type { ConceptSeed, PrereqPair, ContrastPair } from "@/lib/exam/ontology/rrb-ntpc";

// Loosely-typed shape as parsed from the model (the service's Zod schema keeps it
// this permissive on purpose; the real cleaning happens here).
export interface RawOntologyConcept {
  name: string;
  subject: string;
  topic: string;
  subtopic?: string | null;
  description?: string | null;
}
export interface RawOntology {
  concepts: RawOntologyConcept[];
  prerequisites?: [string, string][];
  contrasts?: [string, string][];
}

export interface ValidatedOntology {
  data: OntologyData;
  warnings: string[];
}

const norm = (s: string) => s.trim().toLowerCase();

// Cleans and cross-checks a proposed ontology against the active subject catalog.
// Drops anything malformed (unknown subject, duplicate concept, edge to an
// unknown/duplicate concept, self-edge) and records a warning for each drop so a
// human can review before seeding. Never throws on content issues — it degrades
// to the valid subset.
export function validateOntology(
  raw: RawOntology,
  validSubjectKeys: string[]
): ValidatedOntology {
  const warnings: string[] = [];
  const validKeys = new Set(validSubjectKeys);

  const concepts: ConceptSeed[] = [];
  const seen = new Set<string>(); // normalised concept name → dedupe
  for (const c of raw.concepts ?? []) {
    const name = (c.name ?? "").trim();
    const topic = (c.topic ?? "").trim();
    const subject = (c.subject ?? "").trim();
    if (!name || !topic) {
      warnings.push(`Skipped a concept with a missing name or topic${name ? ` ("${name}")` : ""}.`);
      continue;
    }
    if (!validKeys.has(subject)) {
      warnings.push(`Skipped "${name}" — subject "${subject}" is not in the exam's catalog.`);
      continue;
    }
    if (seen.has(norm(name))) {
      warnings.push(`Skipped duplicate concept "${name}".`);
      continue;
    }
    seen.add(norm(name));
    const subtopic = c.subtopic?.trim() || undefined;
    const description = c.description?.trim() || undefined;
    concepts.push({ name, subject, topic, subtopic, description });
  }

  const known = new Set(concepts.map((c) => norm(c.name)));
  const cleanEdges = (pairs: [string, string][] | undefined, kind: string): [string, string][] => {
    const out: [string, string][] = [];
    const taken = new Set<string>();
    for (const pair of pairs ?? []) {
      const a = (pair?.[0] ?? "").trim();
      const b = (pair?.[1] ?? "").trim();
      if (!a || !b) {
        warnings.push(`Skipped a malformed ${kind} edge.`);
        continue;
      }
      if (norm(a) === norm(b)) {
        warnings.push(`Skipped self-referential ${kind} edge on "${a}".`);
        continue;
      }
      if (!known.has(norm(a)) || !known.has(norm(b))) {
        warnings.push(`Skipped ${kind} edge "${a}" ↔ "${b}" — references an unknown concept.`);
        continue;
      }
      const key = `${norm(a)}|${norm(b)}`;
      if (taken.has(key)) continue; // silent de-dup of exact repeats
      taken.add(key);
      out.push([a, b]);
    }
    return out;
  };

  const prerequisites = cleanEdges(raw.prerequisites, "prerequisite") as PrereqPair[];
  const contrasts = cleanEdges(raw.contrasts, "contrast") as ContrastPair[];

  if (concepts.length === 0) {
    warnings.push("No valid concepts were produced — nothing to seed.");
  }

  return { data: { concepts, prerequisites, contrasts }, warnings };
}
