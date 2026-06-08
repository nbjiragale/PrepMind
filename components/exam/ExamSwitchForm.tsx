"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Label, Input, Select } from "@/components/ui/Field";
import { switchExamAction } from "@/app/onboarding/actions";
import type { ExamPreset } from "@/lib/exam/presets";

interface Props {
  presets: ExamPreset[];
}

export function ExamSwitchForm({ presets }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(presets[0]?.slug ?? "");
  const [confirmation, setConfirmation] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSwitch() {
    setResult(null);
    startTransition(async () => {
      const res = await switchExamAction({ preset_slug: selectedSlug, confirmation });
      if (!res.ok) setResult(res);
    });
  }

  const canSubmit = confirmation.trim() === "switch exam" && !isPending;

  return (
    <div className="grid gap-4 max-w-xl">
      {/* Export-first warning */}
      <Card className="p-4 border-warning/40 bg-warning-subtle shadow-none">
        <p className="text-body font-medium text-warning mb-1">Destructive action</p>
        <p className="text-small text-secondary">
          Switching exam resets the active preset — sections, negative marking, option count, and
          subject catalog — and clears all derived study data (plans, mastery scores,
          misconceptions). Your concepts, cards, questions, and full answer history are preserved.
        </p>
        <p className="mt-2 text-small text-secondary">
          <strong>Export your data first</strong> if you want a backup before switching.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="switch_preset">New exam preset</Label>
          <Select
            id="switch_preset"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="switch_confirm">Type &ldquo;switch exam&rdquo; to confirm</Label>
          <Input
            id="switch_confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="switch exam"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSwitch}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-50 disabled:pointer-events-none bg-surface text-danger border border-danger/40 hover:bg-danger-subtle px-5 py-2.5 text-body"
        >
          {isPending ? "Switching…" : "Switch exam"}
        </button>
        {result && (
          <p className={`text-small ${result.ok ? "text-success" : "text-danger"}`}>
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}
