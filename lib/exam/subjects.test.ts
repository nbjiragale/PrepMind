import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generationModeFor,
  verifiedFreeKeys,
  groundedKeys,
  subjectLabel,
  guessProbability,
  sortedSubjects,
} from "./subjects.ts";
import type { SubjectRow } from "../db/types.ts";

const SUBJECTS: SubjectRow[] = [
  { key: "math",      label: "Mathematics",                      generation_mode: "verified_free", position: 0 },
  { key: "reasoning", label: "General Intelligence & Reasoning", generation_mode: "verified_free", position: 1 },
  { key: "ga",        label: "General Awareness",                generation_mode: "grounded",      position: 2 },
];

describe("generationModeFor", () => {
  it("returns verified_free for math", () => {
    assert.equal(generationModeFor(SUBJECTS, "math"), "verified_free");
  });
  it("returns grounded for ga", () => {
    assert.equal(generationModeFor(SUBJECTS, "ga"), "grounded");
  });
  it("returns null for unknown key", () => {
    assert.equal(generationModeFor(SUBJECTS, "unknown"), null);
  });
});

describe("verifiedFreeKeys", () => {
  it("returns math and reasoning only", () => {
    const keys = verifiedFreeKeys(SUBJECTS);
    assert.deepEqual(keys.sort(), ["math", "reasoning"].sort());
  });
});

describe("groundedKeys", () => {
  it("returns ga only", () => {
    assert.deepEqual(groundedKeys(SUBJECTS), ["ga"]);
  });
});

describe("subjectLabel", () => {
  it("returns the label for a known key", () => {
    assert.equal(subjectLabel(SUBJECTS, "ga"), "General Awareness");
  });
  it("falls back to key for unknown subject", () => {
    assert.equal(subjectLabel(SUBJECTS, "civics"), "civics");
  });
});

describe("guessProbability", () => {
  it("returns 0.25 for 4 options (RRB NTPC default)", () => {
    assert.equal(guessProbability(4), 0.25);
  });
  it("returns 0.2 for 5 options", () => {
    assert.equal(guessProbability(5), 0.2);
  });
  it("returns 0.5 for 2 options", () => {
    assert.equal(guessProbability(2), 0.5);
  });
  it("returns 0 for fewer than 2 options", () => {
    assert.equal(guessProbability(1), 0);
  });
});

describe("sortedSubjects", () => {
  it("preserves position ordering", () => {
    const shuffled: SubjectRow[] = [
      { key: "ga",        label: "General Awareness",                generation_mode: "grounded",      position: 2 },
      { key: "math",      label: "Mathematics",                      generation_mode: "verified_free", position: 0 },
      { key: "reasoning", label: "General Intelligence & Reasoning", generation_mode: "verified_free", position: 1 },
    ];
    const sorted = sortedSubjects(shuffled);
    assert.deepEqual(sorted.map((s) => s.key), ["math", "reasoning", "ga"]);
  });
});
