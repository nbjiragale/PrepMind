import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOntology, type RawOntology } from "./ontologyValidate.ts";

const KEYS = ["math", "ga"];

const base = (over: Partial<RawOntology> = {}): RawOntology => ({
  concepts: [
    { name: "Percentages", subject: "math", topic: "Arithmetic" },
    { name: "Fractions", subject: "math", topic: "Arithmetic", description: "Parts of a whole." },
    { name: "Indian Polity", subject: "ga", topic: "Polity" },
  ],
  prerequisites: [["Percentages", "Fractions"]],
  contrasts: [],
  ...over,
});

describe("validateOntology", () => {
  it("passes a clean ontology through unchanged", () => {
    const { data, warnings } = validateOntology(base(), KEYS);
    assert.equal(data.concepts.length, 3);
    assert.equal(data.prerequisites.length, 1);
    assert.equal(warnings.length, 0);
  });

  it("drops a concept with an unknown subject and warns", () => {
    const { data, warnings } = validateOntology(
      base({
        concepts: [
          { name: "Percentages", subject: "math", topic: "Arithmetic" },
          { name: "Mystery", subject: "science", topic: "Unknown" },
        ],
        prerequisites: [],
      }),
      KEYS
    );
    assert.deepEqual(
      data.concepts.map((c) => c.name),
      ["Percentages"]
    );
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /science/);
  });

  it("drops a concept missing a name or topic", () => {
    const { data, warnings } = validateOntology(
      base({ concepts: [{ name: "", subject: "math", topic: "Arithmetic" }], prerequisites: [] }),
      KEYS
    );
    assert.equal(data.concepts.length, 0);
    assert.ok(warnings.some((w) => /missing name or topic/.test(w)));
    assert.ok(warnings.some((w) => /nothing to seed/i.test(w)));
  });

  it("deduplicates concepts case-insensitively", () => {
    const { data, warnings } = validateOntology(
      base({
        concepts: [
          { name: "Percentages", subject: "math", topic: "Arithmetic" },
          { name: "percentages", subject: "math", topic: "Arithmetic" },
        ],
        prerequisites: [],
      }),
      KEYS
    );
    assert.equal(data.concepts.length, 1);
    assert.ok(warnings.some((w) => /duplicate/i.test(w)));
  });

  it("drops edges referencing unknown concepts", () => {
    const { data, warnings } = validateOntology(
      base({ prerequisites: [["Percentages", "Algebra"]] }),
      KEYS
    );
    assert.equal(data.prerequisites.length, 0);
    assert.ok(warnings.some((w) => /unknown concept/.test(w)));
  });

  it("drops self-referential edges", () => {
    const { data, warnings } = validateOntology(
      base({ contrasts: [["Fractions", "Fractions"]] }),
      KEYS
    );
    assert.equal(data.contrasts.length, 0);
    assert.ok(warnings.some((w) => /self-referential/.test(w)));
  });

  it("silently de-duplicates identical edges", () => {
    const { data, warnings } = validateOntology(
      base({
        prerequisites: [
          ["Percentages", "Fractions"],
          ["Percentages", "Fractions"],
        ],
      }),
      KEYS
    );
    assert.equal(data.prerequisites.length, 1);
    assert.equal(warnings.length, 0);
  });

  it("trims whitespace and normalises empty optional fields to undefined", () => {
    const { data } = validateOntology(
      {
        concepts: [
          { name: "  Ratio  ", subject: "math", topic: "  Arithmetic ", subtopic: "  ", description: "" },
        ],
        prerequisites: [],
        contrasts: [],
      },
      KEYS
    );
    assert.equal(data.concepts[0].name, "Ratio");
    assert.equal(data.concepts[0].topic, "Arithmetic");
    assert.equal(data.concepts[0].subtopic, undefined);
    assert.equal(data.concepts[0].description, undefined);
  });
});
