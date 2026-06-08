import { MockLauncher } from "@/components/mock/MockLauncher";
import { requireExamConfig } from "@/lib/exam/guard";
import { listSubjects } from "@/lib/db/queries/subjects";
import { subjectLabel } from "@/lib/exam/subjects";

export const dynamic = "force-dynamic";

export default async function MockPage() {
  const [exam, subjects] = await Promise.all([requireExamConfig(), listSubjects()]);
  // Sectional options come from configured sections that map to a subject.
  const sections = exam.sections
    .filter((s) => s.subject_key)
    .map((s) => ({ subject: s.subject_key!, label: subjectLabel(subjects, s.subject_key!) }));
  return <MockLauncher sections={sections} />;
}
