"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTransaction } from "@/lib/db/client";
import { upsertSubject } from "@/lib/db/queries/subjects";
import { saveExamConfig } from "@/lib/db/queries/examConfig";

const subjectSchema = z.object({
  key: z.string().trim().min(1, "Subject key is required."),
  label: z.string().trim().min(1, "Subject label is required."),
  generation_mode: z.enum(["grounded", "verified_free"]),
  position: z.coerce.number().int().min(0).default(0),
});

const sectionSchema = z.object({
  name: z.string().trim().min(1, "Section name is required."),
  questions: z.coerce.number().int().min(1),
  marks: z.coerce.number().min(0),
  time_s: z.coerce.number().int().min(0),
  subject_key: z.string().trim().min(1, "Each section must have a subject."),
});

const schema = z.object({
  exam_name: z.string().trim().min(1, "Exam name is required."),
  // Empty string → null (no exam date set).
  exam_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  negative_mark_ratio: z.coerce.number().min(0).max(1),
  options_per_question: z.coerce.number().int().min(2).default(4),
  locale: z.string().trim().min(1).default("en"),
  subjects: z.array(subjectSchema).min(1, "Add at least one subject."),
  sections: z.array(sectionSchema).min(1, "Add at least one section."),
});

export type ExamConfigState = { ok: boolean; message: string };

export async function saveExamConfigAction(input: unknown): Promise<ExamConfigState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { subjects, sections, exam_date, ...configFields } = parsed.data;

  // Cross-validate: every section.subject_key must exist in the submitted subjects catalog.
  const subjectKeys = new Set(subjects.map((s) => s.key));
  const badSection = sections.find((sec) => !subjectKeys.has(sec.subject_key));
  if (badSection) {
    return {
      ok: false,
      message: `Section "${badSection.name}" references unknown subject "${badSection.subject_key}".`,
    };
  }

  try {
    await withTransaction(async (tx) => {
      // Upsert subjects non-destructively (existing rows not in the form stay,
      // preserving concept FK references).
      for (const s of subjects) {
        await upsertSubject(s, tx);
      }
      await saveExamConfig(
        { ...configFields, exam_date: exam_date ?? null, sections },
        tx
      );
    });
    revalidatePath("/mock");
    revalidatePath("/planner");
    revalidatePath("/dashboard");
    revalidatePath("/exam");
    return { ok: true, message: "Exam configuration saved." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Save failed." };
  }
}
