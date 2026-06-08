import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EXAM_PRESETS, findPreset, RRB_NTPC } from "./presets.ts";

// Structural validation that holds for every bundled preset, so a new exam can't
// ship with a broken catalog/section mapping or out-of-range priors.
describe("exam presets", () => {
  for (const preset of EXAM_PRESETS) {
    describe(preset.name, () => {
      const subjectKeys = new Set(preset.subjects.map((s) => s.key));

      it("has at least one subject and section", () => {
        assert.ok(preset.subjects.length >= 1);
        assert.ok(preset.sections.length >= 1);
      });

      it("every section maps to a known subject", () => {
        for (const section of preset.sections) {
          assert.ok(
            section.subject_key && subjectKeys.has(section.subject_key),
            `section "${section.name}" → unknown subject "${section.subject_key}"`
          );
        }
      });

      it("every ontology concept uses a known subject", () => {
        for (const c of preset.ontology.concepts) {
          assert.ok(subjectKeys.has(c.subject), `concept "${c.name}" → unknown subject "${c.subject}"`);
        }
      });

      it("ontology edges reference defined concepts", () => {
        const names = new Set(preset.ontology.concepts.map((c) => c.name));
        for (const [a, b] of [...preset.ontology.prerequisites, ...preset.ontology.contrasts]) {
          assert.ok(names.has(a), `edge references unknown concept "${a}"`);
          assert.ok(names.has(b), `edge references unknown concept "${b}"`);
        }
      });

      it("has sane numeric parameters", () => {
        assert.ok(preset.negative_mark_ratio >= 0 && preset.negative_mark_ratio <= 1);
        assert.ok(preset.options_per_question >= 2);
        assert.ok(preset.qualifying_fraction > 0 && preset.qualifying_fraction <= 1);
      });

      it("CA category priors are probabilities", () => {
        for (const [cat, p] of Object.entries(preset.ca_category_priors)) {
          assert.ok(p >= 0 && p <= 1, `prior for "${cat}" out of [0,1]: ${p}`);
        }
      });
    });
  }

  it("findPreset resolves by slug and returns undefined otherwise", () => {
    assert.equal(findPreset(RRB_NTPC.slug)?.name, RRB_NTPC.name);
    assert.equal(findPreset("does-not-exist"), undefined);
  });
});
