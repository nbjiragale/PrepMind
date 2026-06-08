import { getExamConfig } from "@/lib/db/queries/examConfig";
import { listSubjects } from "@/lib/db/queries/subjects";
import { EXAM_PRESETS } from "@/lib/exam/presets";
import { ExamConfigForm } from "@/components/exam/ExamConfigForm";
import { ExamSwitchForm } from "@/components/exam/ExamSwitchForm";

export const dynamic = "force-dynamic";

// Exam parameterisation (CLAUDE.md §5) — subjects, sections, negative marking,
// option count, qualifying band, exam date. Read by mocks, the planner backstop,
// the EV trainer, and readiness.
export default async function ExamPage() {
  const [config, subjects] = await Promise.all([getExamConfig(), listSubjects()]);

  return (
    <div className="mx-auto max-w-shell px-6 py-8 md:px-8">
      <h1 className="text-h1 mb-2">Exam setup</h1>
      <p className="text-secondary text-body mb-6">
        Define your exam&apos;s subjects, sections, negative marking, and date. Mocks, the study
        planner, and your readiness estimate all read this.
      </p>
      <ExamConfigForm config={config} subjects={subjects} />

      <div className="mt-12">
        <h2 className="text-h2 mb-2">Switch exam</h2>
        <p className="text-secondary text-body mb-4">
          Reconfigure the platform for a different exam from a bundled preset. This is destructive —
          read the warning before confirming.
        </p>
        <ExamSwitchForm presets={[...EXAM_PRESETS]} />
      </div>
    </div>
  );
}
