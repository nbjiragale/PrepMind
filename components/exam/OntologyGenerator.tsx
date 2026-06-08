"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input } from "@/components/ui/Field";
import {
  proposeOntologyAction,
  seedProposedOntologyAction,
  type ProposeState,
} from "@/app/exam/ontology/actions";
import type { OntologyData } from "@/lib/db/queries/ontology";
import type { ConceptSeed } from "@/lib/exam/ontology/rrb-ntpc";
import { Sparkles, AlertTriangle } from "lucide-react";

type Phase =
  | { name: "idle" }
  | { name: "generating" }
  | { name: "review"; examName: string; data: OntologyData; warnings: string[] }
  | { name: "seeding"; examName: string; data: OntologyData; warnings: string[] }
  | { name: "done"; ok: boolean; message: string };

// LLM-assisted ontology STRUCTURE generator with review-before-seed (mx). The
// model proposes a syllabus taxonomy for the active exam; nothing is written
// until you review and click Seed. It generates structure, not exam facts.
export function OntologyGenerator() {
  const [count, setCount] = useState(12);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setPhase({ name: "generating" });
    const res: ProposeState = await proposeOntologyAction({ conceptsPerSubject: count });
    if (!res.ok) {
      setError(res.message);
      setPhase({ name: "idle" });
      return;
    }
    const { examName, data, warnings } = res.proposal;
    setPhase({ name: "review", examName, data, warnings });
  }

  async function seed() {
    if (phase.name !== "review") return;
    const { examName, data, warnings } = phase;
    setPhase({ name: "seeding", examName, data, warnings });
    const res = await seedProposedOntologyAction(data);
    setPhase({ name: "done", ok: res.ok, message: res.message });
  }

  const busy = phase.name === "generating" || phase.name === "seeding";

  return (
    <Card className="p-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={18} strokeWidth={1.5} className="text-accent-strong" />
        <h2 className="text-h3">Generate a starter ontology with AI</h2>
      </div>
      <p className="mb-4 max-w-read text-small text-muted">
        Proposes a syllabus <strong>structure</strong> (topics to study + prerequisite/contrast links)
        for this exam&apos;s subjects. It generates structure, not exam facts — review the proposal
        before anything is saved. Existing concepts are kept; seeding is idempotent.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Label htmlFor="cps">Concepts per subject</Label>
          <Input
            id="cps"
            type="number"
            min={4}
            max={40}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={busy}
          />
        </div>
        <Button onClick={generate} disabled={busy}>
          {phase.name === "generating" ? "Generating…" : "Generate proposal"}
        </Button>
      </div>

      {error && <p className="mt-3 text-small text-danger">{error}</p>}

      {(phase.name === "review" || phase.name === "seeding") && (
        <ProposalReview
          examName={phase.examName}
          data={phase.data}
          warnings={phase.warnings}
          seeding={phase.name === "seeding"}
          onSeed={seed}
          onDiscard={() => setPhase({ name: "idle" })}
        />
      )}

      {phase.name === "done" && (
        <div className="mt-4">
          <p className={`text-small ${phase.ok ? "text-success" : "text-danger"}`}>{phase.message}</p>
          <Button variant="secondary" className="mt-3" onClick={() => setPhase({ name: "idle" })}>
            Generate another
          </Button>
        </div>
      )}
    </Card>
  );
}

function ProposalReview({
  examName,
  data,
  warnings,
  seeding,
  onSeed,
  onDiscard,
}: {
  examName: string;
  data: OntologyData;
  warnings: string[];
  seeding: boolean;
  onSeed: () => void;
  onDiscard: () => void;
}) {
  const bySubject = new Map<string, ConceptSeed[]>();
  for (const c of data.concepts) {
    const arr = bySubject.get(c.subject) ?? [];
    arr.push(c);
    bySubject.set(c.subject, arr);
  }

  return (
    <div className="mt-5 border-t border-default pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-body font-medium">
          Proposed for {examName}:{" "}
          <span className="font-mono text-primary">{data.concepts.length}</span> concepts,{" "}
          <span className="font-mono text-primary">{data.prerequisites.length}</span> prerequisite +{" "}
          <span className="font-mono text-primary">{data.contrasts.length}</span> contrast links
        </h3>
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle p-3">
          <div className="mb-1 flex items-center gap-2 text-small font-medium text-warning">
            <AlertTriangle size={15} strokeWidth={1.5} />
            {warnings.length} item(s) were cleaned up
          </div>
          <ul className="list-disc pl-5 text-small text-secondary">
            {warnings.slice(0, 8).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {warnings.length > 8 && <li>…and {warnings.length - 8} more.</li>}
          </ul>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {[...bySubject.entries()].map(([subject, concepts]) => (
          <div key={subject} className="rounded-lg border border-default bg-subtle p-3">
            <p className="mb-2 text-caption uppercase tracking-[0.02em] text-muted">
              {subject} · {concepts.length}
            </p>
            <ul className="grid gap-1">
              {concepts.map((c) => (
                <li key={c.name} className="text-small text-secondary">
                  <span className="text-primary">{c.name}</span>
                  <span className="text-muted">
                    {" "}
                    — {c.topic}
                    {c.subtopic ? ` › ${c.subtopic}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={onSeed} disabled={seeding || data.concepts.length === 0}>
          {seeding ? "Seeding…" : "Seed this ontology"}
        </Button>
        <Button variant="secondary" onClick={onDiscard} disabled={seeding}>
          Discard
        </Button>
      </div>
    </div>
  );
}
