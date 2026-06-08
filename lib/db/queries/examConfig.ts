import type { PoolClient } from "pg";
import { query, queryOne, withTransaction } from "@/lib/db/client";
import type { ExamConfig, ExamSection } from "@/lib/db/types";

export async function getExamConfig(): Promise<ExamConfig | null> {
  return queryOne<ExamConfig>(`SELECT * FROM exam_config ORDER BY id LIMIT 1`);
}

export interface ExamConfigInput {
  exam_name: string;
  exam_date: string | null;
  negative_mark_ratio: number;
  /** Number of MCQ answer choices; defaults to 4 when omitted. */
  options_per_question?: number;
  /** Qualifying band as a fraction of total marks; defaults to 0.45 when omitted. */
  qualifying_fraction?: number;
  /** Current-affairs category priors; defaults to empty (neutral) when omitted. */
  ca_category_priors?: Record<string, number>;
  locale: string;
  sections: ExamSection[];
}

// exam_config is a singleton (one row per instance — CLAUDE.md §5). Replace it
// atomically so getExamConfig keeps returning the one current config.
// Pass `tx` to enroll in a caller-managed transaction (e.g. alongside subject upserts);
// omit to open a fresh transaction internally.
export async function saveExamConfig(
  input: ExamConfigInput,
  tx?: PoolClient
): Promise<ExamConfig> {
  const run = async (client: PoolClient): Promise<ExamConfig> => {
    await query(`DELETE FROM exam_config`, [], client);
    const row = await queryOne<ExamConfig>(
      `INSERT INTO exam_config
         (exam_name, exam_date, negative_mark_ratio, options_per_question, qualifying_fraction, ca_category_priors, locale, sections)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb)
       RETURNING *`,
      [
        input.exam_name,
        input.exam_date,
        input.negative_mark_ratio,
        input.options_per_question ?? 4,
        input.qualifying_fraction ?? 0.45,
        JSON.stringify(input.ca_category_priors ?? {}),
        input.locale,
        JSON.stringify(input.sections),
      ],
      client
    );
    return row!;
  };
  return tx ? run(tx) : withTransaction(run);
}
