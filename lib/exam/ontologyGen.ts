import { z } from "zod";
import { complete, isLlmConfigured } from "@/lib/llm/router";
import { parseJson } from "@/lib/llm/json";
import { genTokens } from "@/lib/config";
import {
  buildOntologySystemPrompt,
  buildOntologyUserPrompt,
} from "@/lib/llm/prompts/ontology";
import { listSubjects } from "@/lib/db/queries/subjects";
import { getExamConfig } from "@/lib/db/queries/examConfig";
import { withLanguage } from "@/lib/llm/language";
import { coerceLocale, languageName } from "@/lib/i18n/config";
import { validateOntology, type RawOntology } from "@/lib/exam/ontologyValidate";
import type { OntologyData } from "@/lib/db/queries/ontology";

// LLM-assisted ontology STRUCTURE generator (mx). Proposes a syllabus taxonomy
// for the active exam that a human reviews before seeding (review-before-seed) —
// it never writes to the DB. Generates structure, not facts, so Hard Rule §1 is
// intact (see lib/llm/prompts/ontology.ts).

export interface OntologyProposal {
  examName: string;
  data: OntologyData;
  warnings: string[];
}

// Permissive on purpose — validateOntology() does the real cleaning/cross-checks.
const rawSchema: z.ZodType<RawOntology> = z.object({
  concepts: z.array(
    z.object({
      name: z.string(),
      subject: z.string(),
      topic: z.string(),
      subtopic: z.string().nullish(),
      description: z.string().nullish(),
    })
  ),
  prerequisites: z.array(z.tuple([z.string(), z.string()])).optional().default([]),
  contrasts: z.array(z.tuple([z.string(), z.string()])).optional().default([]),
});

const MIN_PER_SUBJECT = 4;
const MAX_PER_SUBJECT = 40;

export async function generateOntology(input?: {
  conceptsPerSubject?: number;
}): Promise<OntologyProposal> {
  if (!isLlmConfigured()) {
    throw new Error("LLM not configured — ontology generation needs LLM_BASE_URL / LLM_API_KEY.");
  }
  const [config, subjects] = await Promise.all([getExamConfig(), listSubjects()]);
  if (subjects.length === 0) {
    throw new Error("No subjects configured — set up the exam before generating an ontology.");
  }
  const examName = config?.exam_name ?? "the exam";
  const conceptsPerSubject = Math.min(
    MAX_PER_SUBJECT,
    Math.max(MIN_PER_SUBJECT, input?.conceptsPerSubject ?? 12)
  );

  const raw = await complete({
    system: withLanguage(buildOntologySystemPrompt(examName), languageName(coerceLocale(config?.locale))),
    messages: [
      {
        role: "user",
        content: buildOntologyUserPrompt({
          examName,
          subjects: subjects.map((s) => ({
            key: s.key,
            label: s.label,
            generation_mode: s.generation_mode,
          })),
          conceptsPerSubject,
        }),
      },
    ],
    task: "generate",
    // One concept per ~120 tokens + edges; scale with the requested size.
    maxTokens: genTokens(subjects.length * conceptsPerSubject, 120),
    reasoning: { enabled: false },
  });

  const parsed = parseJson(raw, rawSchema);
  const { data, warnings } = validateOntology(
    parsed,
    subjects.map((s) => s.key)
  );
  return { examName, data, warnings };
}
