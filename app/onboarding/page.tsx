import { redirect } from "next/navigation";
import { getExamConfig } from "@/lib/db/queries/examConfig";
import { EXAM_PRESETS } from "@/lib/exam/presets";
import { OnboardingPicker } from "@/components/exam/OnboardingPicker";

export const dynamic = "force-dynamic";

// First-run gate: show the exam picker when no config exists.
// Bookmarking /onboarding is harmless — already-configured instances land at /review.
export default async function OnboardingPage() {
  const config = await getExamConfig();
  if (config) redirect("/review");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <OnboardingPicker presets={[...EXAM_PRESETS]} />
    </div>
  );
}
