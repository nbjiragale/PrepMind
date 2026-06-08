"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createConcept } from "@/lib/db/queries/concepts";
import { listSubjects } from "@/lib/db/queries/subjects";

const schema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

// A2 — author the concept ontology.
export async function addConcept(formData: FormData) {
  const parsed = schema.parse({
    name: formData.get("name"),
    subject: formData.get("subject"),
    topic: formData.get("topic"),
    subtopic: formData.get("subtopic") || null,
    description: formData.get("description") || null,
  });
  // subject must be a key in the active exam's catalog (the DB FK enforces this
  // too, but fail fast with a clear message at the boundary).
  const subjects = await listSubjects();
  if (!subjects.some((s) => s.key === parsed.subject)) {
    throw new Error(`Unknown subject "${parsed.subject}".`);
  }
  await createConcept(parsed);
  revalidatePath("/concepts");
  revalidatePath("/cards");
}
