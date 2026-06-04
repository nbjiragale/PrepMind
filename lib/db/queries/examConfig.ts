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
  locale: string;
  sections: ExamSection[];
}

// exam_config is a singleton (one row per instance — CLAUDE.md §5). Replace it
// atomically so getExamConfig keeps returning the one current config.
export async function saveExamConfig(input: ExamConfigInput): Promise<ExamConfig> {
  return withTransaction(async (tx) => {
    await query(`DELETE FROM exam_config`, [], tx);
    const row = await queryOne<ExamConfig>(
      `INSERT INTO exam_config
         (exam_name, exam_date, negative_mark_ratio, options_per_question, locale, sections)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        input.exam_name,
        input.exam_date,
        input.negative_mark_ratio,
        input.options_per_question ?? 4,
        input.locale,
        JSON.stringify(input.sections),
      ],
      tx
    );
    return row!;
  });
}
