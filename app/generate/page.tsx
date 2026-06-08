import { listConcepts } from "@/lib/db/queries/concepts";
import { listSubjects } from "@/lib/db/queries/subjects";
import { groundedKeys } from "@/lib/exam/subjects";
import { MathGenerateForm, GaGenerateForm } from "@/components/generate/GenerateForms";

export const dynamic = "force-dynamic";

// C3 / C4 — on-demand question generation behind the verify gate. Verified-free
// subjects are generated freely + re-solved; grounded subjects are grounded in a
// pasted passage.
export default async function GeneratePage() {
  const [concepts, subjects] = await Promise.all([listConcepts(), listSubjects()]);
  const grounded = new Set(groundedKeys(subjects));
  const mathConcepts = concepts.filter((c) => !grounded.has(c.subject));
  const gaConcepts = concepts.filter((c) => grounded.has(c.subject));

  return (
    <div className="mx-auto max-w-shell px-6 py-8 md:px-8">
      <h1 className="text-h1 mb-2">Generate questions</h1>
      <p className="text-secondary text-small mb-6">
        Everything here passes the verify gate before it can be practised — only verified items are served.
      </p>
      <div className="grid gap-6">
        <MathGenerateForm concepts={mathConcepts} />
        <GaGenerateForm concepts={gaConcepts} />
      </div>
    </div>
  );
}
