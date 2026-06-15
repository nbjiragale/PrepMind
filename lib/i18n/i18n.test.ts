import { test } from "node:test";
import assert from "node:assert/strict";
import { t, tNav, tGroup } from "./index.ts";
import { coerceLocale, languageName, isLocale } from "./config.ts";

test("t returns the locale string and interpolates vars", () => {
  assert.equal(t("en", "review.reveal"), "Reveal answer");
  assert.equal(t("kn", "review.reveal"), "ಉತ್ತರ ತೋರಿಸಿ");
  assert.equal(t("en", "review.remainingToday", { count: 3 }), "3 remaining today");
  assert.equal(t("kn", "onboarding.setup", { exam: "SSC CGL" }), "SSC CGL ಸಜ್ಜುಗೊಳಿಸಿ");
});

test("tNav / tGroup translate by href / group key with English fallback", () => {
  assert.equal(tNav("en", "/review", "Review"), "Review");
  assert.equal(tNav("kn", "/review", "Review"), "ಪುನರಾವರ್ತನೆ");
  // Unknown href falls back to the supplied label.
  assert.equal(tNav("kn", "/unknown", "Fallback"), "Fallback");
  assert.equal(tGroup("kn", "insights", "Insights"), "ಒಳನೋಟಗಳು");
});

test("locale coercion + language name", () => {
  assert.equal(coerceLocale("kn"), "kn");
  assert.equal(coerceLocale("xx"), "en");
  assert.equal(coerceLocale(null), "en");
  assert.equal(languageName("kn"), "Kannada");
  assert.equal(languageName("en"), "English");
  assert.ok(isLocale("kn"));
  assert.ok(!isLocale("fr"));
});
