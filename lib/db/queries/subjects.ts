import { query, queryOne } from "@/lib/db/client";
import type { SubjectKey, SubjectRow, GenerationMode } from "@/lib/db/types";

// Query layer for the `subject` catalog table (migration 0011).
// Subjects belong to the active exam and are the single source of truth for
// generation_mode — replacing every subject === 'ga' guard in the codebase.

export async function listSubjects(): Promise<SubjectRow[]> {
  return query<SubjectRow>(
    `SELECT key, label, generation_mode, position
     FROM subject
     ORDER BY position, key`
  );
}

export async function getSubject(key: SubjectKey): Promise<SubjectRow | null> {
  return queryOne<SubjectRow>(
    `SELECT key, label, generation_mode, position
     FROM subject WHERE key = $1`,
    [key]
  );
}

export interface SubjectInput {
  key: SubjectKey;
  label: string;
  generation_mode: GenerationMode;
  position?: number;
}

// Upsert — idempotent for seeding exam presets. ON CONFLICT updates label and
// generation_mode so re-seeding an existing instance doesn't leave stale rows.
export async function upsertSubject(input: SubjectInput): Promise<SubjectRow> {
  const row = await queryOne<SubjectRow>(
    `INSERT INTO subject (key, label, generation_mode, position)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO UPDATE
       SET label           = EXCLUDED.label,
           generation_mode = EXCLUDED.generation_mode,
           position        = EXCLUDED.position
     RETURNING *`,
    [input.key, input.label, input.generation_mode, input.position ?? 0]
  );
  return row!;
}

// Bulk replace — used by the onboarding exam-switch flow. Clears existing
// subject rows and inserts the new set inside the caller's transaction; caller
// is responsible for the FK-safe concept clear that must precede this.
export async function replaceSubjects(subjects: SubjectInput[]): Promise<SubjectRow[]> {
  await query(`DELETE FROM subject`);
  const rows: SubjectRow[] = [];
  for (const s of subjects) {
    rows.push(await upsertSubject(s));
  }
  return rows;
}

// Resolve the generation_mode for a concept's subject key. Returns null when
// the key is not in the catalog (shouldn't happen post-migration, but graceful).
export async function getGenerationMode(
  subjectKey: SubjectKey
): Promise<GenerationMode | null> {
  const row = await getSubject(subjectKey);
  return row?.generation_mode ?? null;
}
