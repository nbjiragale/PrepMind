"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTransaction, query } from "@/lib/db/client";
import { upsertSubject } from "@/lib/db/queries/subjects";
import { saveExamConfig } from "@/lib/db/queries/examConfig";
import { seedOntology } from "@/lib/db/queries/ontology";
import { findPreset } from "@/lib/exam/presets";

export type SeedPresetState = { ok: boolean; message: string };

const seedSchema = z.object({ preset_slug: z.string().trim().min(1) });

// First-run: seed subjects + exam_config from the chosen preset then go to /review.
// Safe to call on a fresh instance (no existing data to break).
export async function seedExamPresetAction(input: unknown): Promise<SeedPresetState> {
  const parsed = seedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const preset = findPreset(parsed.data.preset_slug);
  if (!preset) return { ok: false, message: "Unknown exam preset." };

  try {
    await withTransaction(async (tx) => {
      for (const s of preset.subjects) {
        await upsertSubject(s, tx);
      }
      await saveExamConfig(
        {
          exam_name: preset.name,
          exam_date: null,
          negative_mark_ratio: preset.negative_mark_ratio,
          options_per_question: preset.options_per_question,
          qualifying_fraction: preset.qualifying_fraction,
          ca_category_priors: preset.ca_category_priors,
          locale: "en",
          sections: [...preset.sections],
        },
        tx
      );
      // Seed the concept ontology so a fresh instance is usable immediately.
      await seedOntology(preset.ontology, tx);
    });
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Setup failed." };
  }
  redirect("/review");
}

export type SwitchExamState = { ok: boolean; message: string };

const switchSchema = z.object({
  preset_slug: z.string().trim().min(1),
  confirmation: z.string().trim(),
});

// Exam switch (destructive reseed — Decision 2). Clears exam-scoped derived data,
// upserts subjects, replaces exam_config. Preserves concepts, cards, questions,
// and the append-only logs (attempt/review/interaction — CLAUDE.md §6).
// Subjects are upserted (not replaced) to keep concept FK references intact.
export async function switchExamAction(input: unknown): Promise<SwitchExamState> {
  const parsed = switchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  if (parsed.data.confirmation !== "switch exam") {
    return { ok: false, message: 'Type exactly "switch exam" to confirm.' };
  }

  const preset = findPreset(parsed.data.preset_slug);
  if (!preset) return { ok: false, message: "Unknown exam preset." };

  try {
    await withTransaction(async (tx) => {
      // Clear exam-scoped derived data. Append-only logs are never touched.
      await query(`DELETE FROM study_plan`, [], tx);
      await query(`DELETE FROM misconception_hit`, [], tx);
      await query(`DELETE FROM misconception`, [], tx);
      await query(`DELETE FROM concept_mastery`, [], tx);

      // Upsert subjects — preserves concept FK refs for shared keys.
      for (const s of preset.subjects) {
        await upsertSubject(s, tx);
      }

      await saveExamConfig(
        {
          exam_name: preset.name,
          exam_date: null,
          negative_mark_ratio: preset.negative_mark_ratio,
          options_per_question: preset.options_per_question,
          qualifying_fraction: preset.qualifying_fraction,
          ca_category_priors: preset.ca_category_priors,
          locale: "en",
          sections: [...preset.sections],
        },
        tx
      );
      // Seed the new exam's ontology (idempotent — existing concepts are kept).
      await seedOntology(preset.ontology, tx);
    });
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Exam switch failed." };
  }

  revalidatePath("/", "layout");
  redirect("/review");
}
