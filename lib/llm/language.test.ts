import { test } from "node:test";
import assert from "node:assert/strict";
import { languageDirective, withLanguage } from "./language.ts";

test("English is a no-op (existing prompts stay byte-for-byte identical)", () => {
  assert.equal(languageDirective("English"), "");
  assert.equal(withLanguage("SYSTEM PROMPT", "English"), "SYSTEM PROMPT");
});

test("Kannada appends a respond-in-Kannada directive", () => {
  const d = languageDirective("Kannada");
  assert.ok(d.includes("Kannada"));
  const wrapped = withLanguage("SYSTEM PROMPT", "Kannada");
  assert.ok(wrapped.startsWith("SYSTEM PROMPT"));
  assert.ok(wrapped.length > "SYSTEM PROMPT".length);
});
