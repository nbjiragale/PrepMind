import Link from "next/link";
import { listConcepts } from "@/lib/db/queries/concepts";
import { Card } from "@/components/ui/Card";
import { IngestForm } from "@/components/ingest/IngestForm";
import { BulkIngestForm } from "@/components/ingest/BulkIngestForm";
import { requireExamConfig } from "@/lib/exam/guard";

export const dynamic = "force-dynamic";

export default async function IngestPage() {
  const [concepts, config] = await Promise.all([listConcepts(), requireExamConfig()]);

  return (
    <div className="mx-auto max-w-column px-6 py-8 md:px-8">
      <h1 className="text-h1 mb-6">Ingest PYQs</h1>
      {concepts.length === 0 ? (
        <Card className="p-6">
          <p className="text-body-lg">
            Add a concept first —{" "}
            <Link href="/concepts" className="text-accent-strong underline">
              go to Concepts
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <BulkIngestForm />
          <IngestForm concepts={concepts} optionsPerQuestion={config.options_per_question} />
        </div>
      )}
    </div>
  );
}
