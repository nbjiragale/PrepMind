"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { seedExamPresetAction } from "@/app/onboarding/actions";
import type { ExamPreset } from "@/lib/exam/presets";

interface Props {
  presets: ExamPreset[];
}

function negLabel(ratio: number): string {
  if (ratio === 0) return "No penalty";
  if (Math.abs(ratio - 1 / 3) < 0.001) return "−⅓ per wrong";
  return `−${ratio.toFixed(2)} per wrong`;
}

export function OnboardingPicker({ presets }: Props) {
  const [selected, setSelected] = useState<ExamPreset>(presets[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function choose(preset: ExamPreset) {
    setSelected(preset);
    setError(null);
  }

  function setup() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await seedExamPresetAction({ preset_slug: selected.slug });
      // redirect() in the action navigates away on success; only reach here on error.
      if (!res.ok) setError(res.message);
    });
  }

  const totalQ = selected?.sections.reduce((sum, s) => sum + s.questions, 0) ?? 0;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-h1 font-serif text-primary">PrepMind</h1>
        <p className="mt-2 text-body text-secondary">Choose your exam to get started.</p>
      </div>

      {/* Preset list */}
      <div className="grid gap-3 mb-5">
        {presets.map((preset) => {
          const active = selected?.slug === preset.slug;
          return (
            <button
              key={preset.slug}
              type="button"
              onClick={() => choose(preset)}
              className={`w-full text-left rounded-lg border p-4 transition-colors duration-150 focus:outline-none focus-visible:ring-4 focus-visible:ring-focus ${
                active
                  ? "border-accent-border bg-accent-subtle"
                  : "border-border bg-surface hover:bg-hover"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className={`text-body font-medium ${
                    active ? "text-accent-strong" : "text-primary"
                  }`}
                >
                  {preset.name}
                </span>
                <Badge tone={preset.negative_mark_ratio > 0 ? "warning" : "neutral"}>
                  {negLabel(preset.negative_mark_ratio)}
                </Badge>
              </div>
              <p className="text-small text-muted">
                {preset.sections.map((s) => `${s.name} (${s.questions}Q)`).join(" · ")}
              </p>
            </button>
          );
        })}
      </div>

      {/* Details strip */}
      {selected && (
        <Card className="p-4 mb-5 border-border-subtle bg-subtle shadow-none">
          <p className="text-caption uppercase tracking-[0.02em] text-muted mb-2">Details</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-small">
            <dt className="text-muted">Total questions</dt>
            <dd className="text-primary font-medium">{totalQ}</dd>
            <dt className="text-muted">Options per question</dt>
            <dd className="text-primary font-medium">{selected.options_per_question}</dd>
            <dt className="text-muted">Negative marking</dt>
            <dd className="text-primary font-medium">{negLabel(selected.negative_mark_ratio)}</dd>
          </dl>
        </Card>
      )}

      {error && <p className="mb-3 text-small text-danger">{error}</p>}

      <Button onClick={setup} disabled={isPending || !selected} className="w-full">
        {isPending ? "Setting up…" : `Set up ${selected?.name ?? "exam"}`}
      </Button>
    </div>
  );
}
