import { withTransaction } from "@/lib/db/client";
import { requireExamConfig } from "@/lib/exam/guard";
import { getQuestionsBySubject, getQuestionsForGrading } from "@/lib/db/queries/questions";
import { createMockSession, completeMockSession } from "@/lib/db/queries/mocks";
import { applyAttemptTx } from "@/lib/services/attempt";
import { scoreMock, perQuestionMs, type PacingPoint, type MockScore } from "@/lib/scoring";
import { MOCK_SECONDS_PER_QUESTION } from "@/lib/config";
import type { MockType, PracticeQuestion, SubjectKey } from "@/lib/db/types";

export interface StartedMock {
  sessionId: number;
  questions: PracticeQuestion[];
  timeLimitS: number;
  negRatio: number;
}

// D1/D2 — assemble a mock from verified questions per the exam config. Each
// section carries an explicit subject_key (migration 0011), so the brittle
// keyword-sniffing subjectForSection is gone.
export async function startMock(input: {
  type: MockType;
  subject?: SubjectKey;
}): Promise<StartedMock> {
  const exam = await requireExamConfig();

  const wanted: { subject: SubjectKey; count: number; timeS: number }[] = [];

  if (input.type === "sectional") {
    if (!input.subject) throw new Error("Sectional mock requires a subject.");
    const section = exam.sections.find((s) => s.subject_key === input.subject);
    wanted.push({
      subject: input.subject,
      count: section?.questions ?? 30,
      timeS: section?.time_s ?? 0,
    });
  } else {
    for (const s of exam.sections) {
      if (s.subject_key) wanted.push({ subject: s.subject_key, count: s.questions, timeS: s.time_s });
    }
    if (wanted.length === 0) {
      throw new Error("No sections are mapped to subjects — configure the exam sections first.");
    }
  }

  const groups = await Promise.all(wanted.map((w) => getQuestionsBySubject(w.subject, w.count)));
  const questions = groups.flat();
  if (questions.length === 0) {
    throw new Error("No verified questions available — ingest PYQs first.");
  }

  const configuredTime = wanted.reduce((sum, w) => sum + w.timeS, 0);
  const timeLimitS = configuredTime > 0 ? configuredTime : questions.length * MOCK_SECONDS_PER_QUESTION;

  const sessionId = await createMockSession({
    type: input.type,
    total_questions: questions.length,
    time_limit_s: timeLimitS,
  });

  return { sessionId, questions, timeLimitS, negRatio: exam.negative_mark_ratio };
}

export interface TopicBreakdown {
  topic: string;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
}

export interface MockAnalysis extends MockScore {
  byTopic: TopicBreakdown[];
  perQuestionMs: number[];
}

// D3/D4/D5 — grade server-side, log every attempt (skips first-class), persist
// the session, and return the breakdown.
export async function submitMock(input: {
  sessionId: number;
  answers: { questionId: number; selectedOption: number | null }[];
  pacing: PacingPoint[];
}): Promise<MockAnalysis> {
  const exam = await requireExamConfig();
  const negRatio = exam.negative_mark_ratio;

  const grading = await getQuestionsForGrading(input.answers.map((a) => a.questionId));
  const byId = new Map(grading.map((g) => [g.id, g]));

  const scored = input.answers.map((a) => {
    const g = byId.get(a.questionId);
    if (!g) throw new Error(`Question ${a.questionId} not found or not verified`);
    return {
      ...a,
      conceptId: g.concept_id,
      topic: g.topic,
      isCorrect: a.selectedOption === null ? null : a.selectedOption === g.correct_option,
    };
  });

  const score = scoreMock(
    scored.map((s) => ({ selectedOption: s.selectedOption, isCorrect: s.isCorrect === true })),
    negRatio
  );

  await withTransaction(async (tx) => {
    for (const s of scored) {
      await applyAttemptTx(tx, {
        questionId: s.questionId,
        conceptId: s.conceptId,
        mockSessionId: input.sessionId,
        selectedOption: s.selectedOption,
        isCorrect: s.isCorrect,
        confidence: null,
        timeMs: null,
        context: "mock",
      });
    }
    await completeMockSession(
      input.sessionId,
      {
        attempted_count: score.attempted,
        score: score.score,
        accuracy: score.accuracy,
        pacing_data: input.pacing,
      },
      tx
    );
  });

  return { ...score, byTopic: breakdownByTopic(scored), perQuestionMs: perQuestionMs(input.pacing) };
}

function breakdownByTopic(
  scored: { topic: string; selectedOption: number | null; isCorrect: boolean | null }[]
): TopicBreakdown[] {
  const map = new Map<string, TopicBreakdown>();
  for (const s of scored) {
    const t = map.get(s.topic) ?? { topic: s.topic, correct: 0, wrong: 0, skipped: 0, accuracy: 0 };
    if (s.selectedOption === null) t.skipped++;
    else if (s.isCorrect) t.correct++;
    else t.wrong++;
    map.set(s.topic, t);
  }
  for (const t of map.values()) {
    const attempted = t.correct + t.wrong;
    t.accuracy = attempted === 0 ? 0 : t.correct / attempted;
  }
  return [...map.values()].sort((a, b) => a.accuracy - b.accuracy); // weakest first
}
