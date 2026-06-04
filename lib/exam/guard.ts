import { redirect } from "next/navigation";
import { getExamConfig } from "@/lib/db/queries/examConfig";
import type { ExamConfig } from "@/lib/db/types";

// Server-side guard: loads exam_config and redirects to /onboarding when the
// instance hasn't been configured yet. Eliminates the scattered ?? 1/3 fallbacks
// and the throw in lib/services/mock.ts (config-dependent pages simply never
// render without a config).
//
// Usage in a Server Component or Server Action:
//   const config = await requireExamConfig();
//   // config is guaranteed non-null from here
//
// The redirect() call throws (Next.js convention), so the return type is
// ExamConfig (never null) for call sites that follow the redirect path.

export async function requireExamConfig(): Promise<ExamConfig> {
  const config = await getExamConfig();
  if (!config) {
    redirect("/onboarding");
  }
  return config;
}
