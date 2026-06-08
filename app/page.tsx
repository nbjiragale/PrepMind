import { redirect } from "next/navigation";
import { getExamConfig } from "@/lib/db/queries/examConfig";

export const dynamic = "force-dynamic";

// Route /: gate unconfigured instances to /onboarding; configured ones go straight to /review.
export default async function Home() {
  const config = await getExamConfig();
  redirect(config ? "/review" : "/onboarding");
}
