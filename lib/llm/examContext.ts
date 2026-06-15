import { getExamConfig } from "@/lib/db/queries/examConfig";
import { coerceLocale, languageName } from "@/lib/i18n/config";
import type { Language } from "@/lib/llm/language";

// Exam context injected into LLM prompts so persona/wording follow the active
// exam instead of hardcoding "RRB NTPC". Grounding guidance stays keyed to a
// subject's generation_mode (Hard Rule §1), never the word "GA".
export interface ExamContext {
  /** Display name of the active exam, e.g. "RRB NTPC". */
  examName: string;
  /** Language the LLM should answer in, from exam_config.locale ('en' → English). */
  language: Language;
}

// Loads the exam name + language from the singleton exam_config. Falls back to a
// neutral phrase + English when unconfigured (non-interactive callers such as the
// nightly cron may run before a request-scoped gate); interactive pages are gated
// upstream.
export async function loadExamContext(): Promise<ExamContext> {
  const config = await getExamConfig();
  return {
    examName: config?.exam_name ?? "the exam",
    language: languageName(coerceLocale(config?.locale)),
  };
}
