"use server";

import { z } from "zod";
import { startMock, submitMock, type StartedMock, type MockAnalysis } from "@/lib/services/mock";
import { requireExamConfig } from "@/lib/exam/guard";

const startSchema = z.object({
  type: z.enum(["full_cbt1", "full_cbt2", "sectional"]),
  // subject is a SubjectKey from the active exam's catalog; startMock resolves
  // it against the configured sections.
  subject: z.string().min(1).optional(),
});

export async function startMockAction(input: {
  type: "full_cbt1" | "full_cbt2" | "sectional";
  subject?: string;
}): Promise<StartedMock> {
  return startMock(startSchema.parse(input));
}

export async function submitMockAction(input: {
  sessionId: number;
  answers: { questionId: number; selectedOption: number | null }[];
  pacing: { q: number; cumulative_ms: number }[];
}): Promise<MockAnalysis> {
  // Option count is exam-driven (not hardcoded to 4): bound selectedOption by
  // the configured options_per_question.
  const { options_per_question } = await requireExamConfig();
  const submitSchema = z.object({
    sessionId: z.number().int().positive(),
    answers: z.array(
      z.object({
        questionId: z.number().int().positive(),
        selectedOption: z.number().int().min(0).max(options_per_question - 1).nullable(),
      })
    ),
    pacing: z.array(
      z.object({ q: z.number().int(), cumulative_ms: z.number().int().nonnegative() })
    ),
  });
  return submitMock(submitSchema.parse(input));
}
