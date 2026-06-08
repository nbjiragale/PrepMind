"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTransaction } from "@/lib/db/client";
import { generateOntology, type OntologyProposal } from "@/lib/exam/ontologyGen";
import { validateOntology } from "@/lib/exam/ontologyValidate";
import { seedOntology, type OntologyData } from "@/lib/db/queries/ontology";
import { listSubjects } from "@/lib/db/queries/subjects";

export type ProposeState =
  | { ok: true; proposal: OntologyProposal }
  | { ok: false; message: string };

const proposeSchema = z.object({
  conceptsPerSubject: z.coerce.number().int().min(4).max(40).optional(),
});

// Step 1 (review-before-seed): generate a proposal and hand it back for review.
// Nothing is written to the DB here.
export async function proposeOntologyAction(input: unknown): Promise<ProposeState> {
  const parsed = proposeSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  try {
    const proposal = await generateOntology({ conceptsPerSubject: parsed.data.conceptsPerSubject });
    return { ok: true, proposal };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Generation failed." };
  }
}

export type SeedState = { ok: boolean; message: string };

const conceptSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string().optional(),
  description: z.string().optional(),
});
const pairSchema = z.tuple([z.string(), z.string()]);
const dataSchema = z.object({
  concepts: z.array(conceptSchema),
  prerequisites: z.array(pairSchema),
  contrasts: z.array(pairSchema),
});

// Step 2: seed a reviewed proposal. Re-validates against the CURRENT subject
// catalog server-side (never trust the client payload) before writing, then
// seeds idempotently in one transaction.
export async function seedProposedOntologyAction(data: OntologyData): Promise<SeedState> {
  const parsed = dataSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid ontology payload." };
  }

  const subjects = await listSubjects();
  const { data: clean, warnings } = validateOntology(
    {
      concepts: parsed.data.concepts,
      prerequisites: parsed.data.prerequisites,
      contrasts: parsed.data.contrasts,
    },
    subjects.map((s) => s.key)
  );
  if (clean.concepts.length === 0) {
    return { ok: false, message: "Nothing valid to seed after re-validation." };
  }

  try {
    const report = await withTransaction((tx) => seedOntology(clean, tx));
    revalidatePath("/concepts");
    revalidatePath("/graph");
    const note = warnings.length ? ` (${warnings.length} item(s) dropped on re-check)` : "";
    return {
      ok: true,
      message: `Seeded ${report.conceptsInserted} new concept(s) and ${report.edgesInserted} edge(s)${note}.`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Seeding failed." };
  }
}
