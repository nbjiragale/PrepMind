"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input, Select } from "@/components/ui/Field";
import { saveExamConfigAction } from "@/app/exam/actions";
import type { ExamConfig, GenerationMode, SubjectRow } from "@/lib/db/types";

interface SubjectDraft {
  key: string;
  label: string;
  generation_mode: GenerationMode;
  position: number;
}

interface SectionDraft {
  name: string;
  questions: number;
  marks: number;
  time_s: number;
  subject_key: string;
}

// Subjects and sections are exam data, not code (CLAUDE.md §5). The form edits
// the subject catalog (key/label/generation_mode) and maps each section to a
// subject via subject_key — no keyword sniffing, no hardcoded RRB taxonomy.
export function ExamConfigForm({
  config,
  subjects: initialSubjects,
}: {
  config: ExamConfig | null;
  subjects: SubjectRow[];
}) {
  const [examName, setExamName] = useState(config?.exam_name ?? "");
  const [examDate, setExamDate] = useState(config?.exam_date ?? "");
  const [negRatio, setNegRatio] = useState(config?.negative_mark_ratio ?? 0.3333);
  const [optionsPerQuestion, setOptionsPerQuestion] = useState(config?.options_per_question ?? 4);
  const [qualifyingFraction, setQualifyingFraction] = useState(config?.qualifying_fraction ?? 0.45);
  const [subjects, setSubjects] = useState<SubjectDraft[]>(
    initialSubjects.length
      ? initialSubjects.map((s) => ({ ...s }))
      : [{ key: "", label: "", generation_mode: "verified_free", position: 0 }]
  );
  const [sections, setSections] = useState<SectionDraft[]>(
    config?.sections?.length
      ? config.sections.map((s) => ({
          name: s.name,
          questions: s.questions,
          marks: s.marks,
          time_s: s.time_s,
          subject_key: s.subject_key ?? "",
        }))
      : [{ name: "", questions: 30, marks: 30, time_s: 0, subject_key: "" }]
  );
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function updateSubject(i: number, patch: Partial<SubjectDraft>) {
    setSubjects((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }
  function addSubject() {
    setSubjects((prev) => [
      ...prev,
      { key: "", label: "", generation_mode: "verified_free", position: prev.length },
    ]);
  }
  function removeSubject(i: number) {
    setSubjects((prev) => prev.filter((_, j) => j !== i));
  }

  function updateSection(i: number, patch: Partial<SectionDraft>) {
    setSections((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }
  function addSection() {
    setSections((prev) => [
      ...prev,
      { name: "", questions: 30, marks: 30, time_s: 0, subject_key: subjects[0]?.key ?? "" },
    ]);
  }
  function removeSection(i: number) {
    setSections((prev) => prev.filter((_, j) => j !== i));
  }

  const subjectKeys = subjects.map((s) => s.key).filter(Boolean);

  async function save() {
    setPending(true);
    setMsg(null);
    const res = await saveExamConfigAction({
      exam_name: examName,
      exam_date: examDate,
      negative_mark_ratio: negRatio,
      options_per_question: optionsPerQuestion,
      qualifying_fraction: qualifyingFraction,
      locale: config?.locale ?? "en",
      subjects,
      sections,
    });
    setMsg({ ok: res.ok, text: res.message });
    setPending(false);
  }

  return (
    <div className="grid gap-6">
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="exam_name">Exam name</Label>
            <Input id="exam_name" value={examName} onChange={(e) => setExamName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="exam_date">Exam date</Label>
            <Input
              id="exam_date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="neg_ratio">Negative mark ratio</Label>
            <Input
              id="neg_ratio"
              type="number"
              step="0.0001"
              min={0}
              max={1}
              value={negRatio}
              onChange={(e) => setNegRatio(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="opts">Options per question</Label>
            <Input
              id="opts"
              type="number"
              min={2}
              value={optionsPerQuestion}
              onChange={(e) => setOptionsPerQuestion(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="qual">Qualifying fraction</Label>
            <Input
              id="qual"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={qualifyingFraction}
              onChange={(e) => setQualifyingFraction(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="mt-2 text-small text-muted">
          The negative mark ratio is the fraction deducted per wrong answer (e.g. 1/3 ≈ 0.3333).
          Options-per-question sets the guess baseline. Leave the date blank if you haven&apos;t fixed
          it — the planner&apos;s exam backstop only kicks in within 21 days of a set date.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-h3 mb-1">Subjects</h2>
        <p className="text-small text-muted mb-4">
          Each subject has a stable key, a display label, and a generation mode.{" "}
          <strong>Grounded</strong> subjects (e.g. General Awareness) generate only from supplied
          source text; <strong>verified-free</strong> subjects generate freely then re-solve to verify.
        </p>
        <div className="grid gap-3">
          {subjects.map((s, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[8rem,1fr,11rem,5rem,auto]">
              <div>
                <Label htmlFor={`sub-key-${i}`}>Key</Label>
                <Input
                  id={`sub-key-${i}`}
                  value={s.key}
                  onChange={(e) => updateSubject(i, { key: e.target.value })}
                  placeholder="math"
                />
              </div>
              <div>
                <Label htmlFor={`sub-label-${i}`}>Label</Label>
                <Input
                  id={`sub-label-${i}`}
                  value={s.label}
                  onChange={(e) => updateSubject(i, { label: e.target.value })}
                  placeholder="Mathematics"
                />
              </div>
              <div>
                <Label htmlFor={`sub-mode-${i}`}>Generation mode</Label>
                <Select
                  id={`sub-mode-${i}`}
                  value={s.generation_mode}
                  onChange={(e) =>
                    updateSubject(i, { generation_mode: e.target.value as GenerationMode })
                  }
                >
                  <option value="verified_free">verified-free</option>
                  <option value="grounded">grounded</option>
                </Select>
              </div>
              <div>
                <Label htmlFor={`sub-pos-${i}`}>Order</Label>
                <Input
                  id={`sub-pos-${i}`}
                  type="number"
                  min={0}
                  value={s.position}
                  onChange={(e) => updateSubject(i, { position: Number(e.target.value) })}
                />
              </div>
              <Button
                variant="ghost"
                onClick={() => removeSubject(i)}
                disabled={subjects.length === 1}
                className="text-danger"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={addSubject}>
            Add subject
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-h3 mb-1">Sections</h2>
        <p className="text-small text-muted mb-4">
          Mocks build from these. Each section maps to one subject. Time 0 = auto (~54s per question).
        </p>
        <div className="grid gap-3">
          {sections.map((s, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr,9rem,4rem,4rem,5rem,auto]">
              <div>
                <Label htmlFor={`s-name-${i}`}>Name</Label>
                <Input
                  id={`s-name-${i}`}
                  value={s.name}
                  onChange={(e) => updateSection(i, { name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`s-subj-${i}`}>Subject</Label>
                <Select
                  id={`s-subj-${i}`}
                  value={s.subject_key}
                  onChange={(e) => updateSection(i, { subject_key: e.target.value })}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {subjects.map((sub) => (
                    <option key={sub.key} value={sub.key}>
                      {sub.label || sub.key}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor={`s-q-${i}`}>Qs</Label>
                <Input
                  id={`s-q-${i}`}
                  type="number"
                  min={1}
                  value={s.questions}
                  onChange={(e) => updateSection(i, { questions: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`s-m-${i}`}>Marks</Label>
                <Input
                  id={`s-m-${i}`}
                  type="number"
                  min={0}
                  value={s.marks}
                  onChange={(e) => updateSection(i, { marks: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`s-t-${i}`}>Time (s)</Label>
                <Input
                  id={`s-t-${i}`}
                  type="number"
                  min={0}
                  value={s.time_s}
                  onChange={(e) => updateSection(i, { time_s: Number(e.target.value) })}
                />
              </div>
              <Button
                variant="ghost"
                onClick={() => removeSection(i)}
                disabled={sections.length === 1}
                className="text-danger"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        {sections.some((s) => s.subject_key && !subjectKeys.includes(s.subject_key)) && (
          <p className="mt-3 text-small text-danger">
            A section references a subject key that isn&apos;t in the catalog above.
          </p>
        )}
        <div className="mt-4">
          <Button variant="secondary" onClick={addSection}>
            Add section
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save exam configuration"}
        </Button>
        {msg && <p className={`text-small ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
