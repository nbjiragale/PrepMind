# PrepMind: make the platform multi-exam
Turn the RRB-NTPC-only app into a multi-exam platform. First run (no `exam_config`) shows an onboarding exam-picker; the chosen exam reconfigures subjects, sections, negative-marking, ontology, prompts, and branding. RRB NTPC remains reproducible as one preset. All Hard Rules (`CLAUDE.md §2`) are preserved — `ga`-specific grounding generalizes to a per-subject `generation_mode`, never weakens.
## Architectural decisions (confirmed)
Both confirmed: a dedicated `subject` table (Decision 1) and one active exam per instance (Decision 2).
### Decision 1 — Subjects model: dedicated `subject` table (confirmed)
Today `math|reasoning|ga` is a Postgres `CHECK` (`migrations/0001_v1_init.sql:22`), a TS union (`lib/db/types.ts:3`), Zod enums (`app/concepts/actions.ts:9`, `app/mock/actions.ts:8`), and constants (`lib/services/mock.ts:10`, `components/graph/GraphCanvas.tsx:31`).
Chosen: create a `subject` table (`key` PK, `label`, `generation_mode` CHECK in `('grounded','verified_free')`, `position` for ordering). Drop `concept_subject_check` and add FK `concept.subject -> subject(key)`. `generation_mode` replaces every `subject === 'ga'`: `grounded` = generate only from supplied source text (today's GA — Hard Rule §1 holds for any grounded subject); `verified_free` = free generation + independent re-solve (today's math/reasoning). `sections` gain an explicit `subject_key` referencing `subject.key`, deleting the keyword-sniffing `subjectForSection`.
Benefit: SQL can JOIN `concept`→`subject` and filter on `generation_mode` directly (e.g. `getConceptsNeedingQuestions`), so the catalog is one DB-enforced source of truth with no drift. Cost: a new query module and FK-safe ordering on reseed.
### Decision 2 — Data scoping on exam switch: one active exam per instance (confirmed)
No table has `exam_id`; `exam_config` is a singleton (`lib/db/queries/examConfig.ts` delete-then-insert). Keep one active exam, no `exam_id` columns. First run seeds the chosen exam's `subject` rows + sections + ontology + negative-marking. Switching later is an explicit destructive reseed: export-first (Hard Rule §5), typed confirmation, then an FK-safe clear of exam-scoped data (concept dependents → `concept` → `subject`) and seed of the new exam.
## Current state (what's coupled)
* Subject enum: `migrations/0001_v1_init.sql:22`, `lib/db/types.ts:3`, `app/concepts/actions.ts:9`, `app/mock/actions.ts:8`, `lib/services/mock.ts:10`, `components/graph/GraphCanvas.tsx:31`, `app/concepts/page.tsx (25-30)`.
* GA special-casing: `lib/services/cardGeneration.ts:38`, `lib/services/cardGeneration.ts:77`, `lib/services/generation.ts:63`, `lib/services/generation.ts:109`, `lib/services/generation.ts:289`, `lib/services/currentAffairs.ts:243`, `lib/db/queries/questions.ts:85`, `app/cards/page.tsx (18-19)`, `app/generate/page.tsx (10-11)`, `app/current-affairs/actions.ts:51`.
* Mock section-to-subject mapping: fragile keyword match `subjectForSection` in `lib/services/mock.ts (12-18)`.
* Hardcoded constants: `GUESS=0.25` in `lib/readiness.ts:10`; neg-ratio fallbacks in `lib/services/calibration.ts:14`, `lib/services/mock.ts:95`, `app/dashboard/page.tsx:36`, `app/calibration/page.tsx:26`; 4-option assumption in `lib/llm/questionChecks.ts:29`, `lib/llm/questionChecks.ts:33`, `lib/services/generation.ts (37-38)`, `lib/services/generation.ts (148-149)`, `app/mock/actions.ts:23`, `lib/llm/prompts/generate.ts (8-9)`; default target band in `app/dashboard/page.tsx:38`. `breakEvenP(negRatio)` in `lib/calibration.ts:77` is already general.
* Prompts hardcode `RRB NTPC`: `lib/llm/prompts/tutor.ts:25`, `lib/llm/prompts/tutor.ts:29`, `lib/llm/prompts/generate.ts:18`, `lib/llm/prompts/generate.ts:41`, `lib/llm/prompts/generate.ts:99`, `lib/llm/prompts/generate.ts:145`, `lib/llm/prompts/generate.ts:179`, `lib/llm/prompts/generate.ts:213`, `lib/llm/prompts/generate.ts:233`, `lib/llm/prompts/generate.ts:261`, `lib/llm/prompts/generate.ts:294`, `lib/llm/prompts/generate.ts:311`, `lib/llm/prompts/diagnose.ts:18`, `lib/llm/prompts/profile.ts:19`, `lib/llm/prompts/verify.ts:78`, `lib/llm/prompts/feynman.ts:6`.
* RRB content and integrations: `scripts/seed-ontology.ts`, `scripts/seed.ts`, `lib/caRanking.ts`, `lib/testbook/*`, `lib/services/testbookImport.ts:156`.
* Branding: `app/manifest.ts (6-7)`, `app/layout.tsx (7-10)`, `components/Sidebar.tsx:59`.
* Onboarding/config absence: `app/page.tsx` always redirects to `/review`; no first-run gate; `lib/services/mock.ts:33` throws while other code falls back to RRB defaults.
* Runner facts: migrations are numbered SQL via `scripts/migrate.ts`; next migration is `0011`; validation commands are `npm test`, `npm run lint`, `npm run build`; the constraint to drop is `concept_subject_check`.
## Phased plan (runnable end-to-end at every boundary)
### Phase 0 — Foundation: data model and shared contract (sequential; unblocks all)
* Add `migrations/0011_multi_exam.sql`: create `subject` (`key` PK, `label`, `generation_mode` CHECK `('grounded','verified_free')`, `position`); seed RRB rows (`math`,`reasoning` = verified_free; `ga` = grounded); drop `concept_subject_check`; add FK `concept.subject -> subject(key)` (NOT VALID then VALIDATE so a legacy bad value surfaces); keep `idx_concept_subject`; add `exam_config.options_per_question INT NOT NULL DEFAULT 4`; backfill any existing `exam_config` row's `sections[*].subject_key` via today's keyword map.
* Update `lib/db/types.ts`: introduce `SubjectKey = string` (the `concept.subject` value) and a `Subject` row interface (`key`, `label`, `generation_mode`, `position`); add `GenerationMode`; add `subject_key` to `ExamConfig.sections`; add `options_per_question`. Migrate existing `Subject` union usages to `SubjectKey`.
* Add `lib/db/queries/subjects.ts`: `listSubjects`, `getSubject`, and create/update/reorder, used by onboarding, exam config, services, and the graph.
* Add `lib/exam/presets.ts`: `ExamPreset` type and the `RRB_NTPC` preset (subjects with modes, sections with `subject_key`, negative-marking, option count, qualifying fraction, CA category priors).
* Move the RRB ontology data out of `scripts/seed-ontology.ts` into `lib/exam/ontology/rrb-ntpc.ts`.
* Add `lib/exam/subjects.ts` with pure, unit-tested helpers over already-loaded subject rows: `generationModeFor(subjects, key)`, `verifiedFreeKeys(subjects)`, `groundedKeys(subjects)`, `subjectLabel(subjects, key)`, plus `guessProbability(optionCount)`.
* Add `lib/exam/guard.ts`: server helper `requireExamConfig()` redirects to `/onboarding` when config is absent.
* Update `lib/db/queries/examConfig.ts` to persist/read `options_per_question` and section `subject_key` while keeping singleton semantics.
Boundary check: the app still runs on a backfilled RRB instance; widening the union is backward-compatible with existing literals.
### Phase 1 — Onboarding gate, exam config, and switch flow
* Add `app/onboarding/page.tsx` and `app/onboarding/actions.ts`: exam-picker (RRB NTPC preset) that seeds `subject` rows + `exam_config` + ontology in one transaction. Design-system compliant (warm ivory canvas, single coral action, hairlines, light mode only).
* Update `app/page.tsx`: redirect to `/onboarding` when unconfigured, otherwise `/review`; `/onboarding` redirects to `/review` when already configured.
* Update `components/exam/ExamConfigForm.tsx` and `app/exam/actions.ts`: manage `subject` rows (`key`, `label`, `generation_mode`, `position`) and per-section `subject_key`; remove hardcoded RRB copy; validate section `subject_key`s against existing subjects.
* Add explicit switch flow per Decision 2: export-first guidance, typed confirmation, then one transaction that clears exam-scoped data FK-safe (dependents → `concept` → `subject`) and seeds the selected exam.
* Apply `requireExamConfig()` to config-dependent entry pages/actions (replaces the throw at `lib/services/mock.ts:33` and the silent fallbacks).
### Phase 2 — Generalize GA to `generation_mode`
* Services: update `lib/services/cardGeneration.ts`, `lib/services/generation.ts`, and `lib/services/currentAffairs.ts` to resolve a concept's `generation_mode` (load rows via `lib/db/queries/subjects.ts`, judge with `generationModeFor`) instead of `subject === 'ga'`/`!== 'ga'`.
* Mocks: update `lib/services/mock.ts` to assemble from section `subject_key`; delete `subjectForSection` and `SUBJECTS`.
* Questions query: rewrite `getConceptsNeedingQuestions` to JOIN `subject` and filter `WHERE s.generation_mode = 'verified_free'`, replacing `WHERE c.subject <> 'ga'`.
* UI/actions: update `app/cards/page.tsx`, `app/generate/page.tsx`, `app/current-affairs/actions.ts`, `app/concepts/page.tsx`, `app/concepts/actions.ts`, and `components/graph/GraphCanvas.tsx` to read the `subject` table (catalog, labels, `position` ordering) and split by `generation_mode`; Zod validates `subject` against existing keys.
### Phase 3 — Prompts: inject exam context
* Add an `ExamContext` prompt input containing exam name, subject labels, and per-mode generation guidance.
* Update `lib/llm/prompts/*` builders to accept context instead of hardcoding `RRB NTPC` and the RRB subject taxonomy.
* Update service call sites to load config and pass context into tutor, diagnosis, generation, verification, profile, and Feynman prompts.
* Keep grounding language keyed to `generation_mode: 'grounded'`, not the word `GA`.
### Phase 4 — Exam constants from config
* Update `lib/readiness.ts`: replace fixed `GUESS` with `guessProbability(options_per_question)` passed in by callers; update `lib/readiness.test.ts`.
* Remove `?? 1/3` fallbacks in `lib/services/calibration.ts`, `lib/services/mock.ts`, `app/dashboard/page.tsx`, and `app/calibration/page.tsx`; config is guaranteed by the gate.
* Generalize option count through `lib/llm/questionChecks.ts`, `lib/services/generation.ts`, `app/mock/actions.ts`, and `lib/llm/prompts/generate.ts`.
* Replace dashboard target fallback with the preset/config qualifying fraction.
### Phase 5 — Presets, ontology authoring, and external integrations
* Generalize `scripts/seed-ontology.ts` to seed any preset's ontology; use the extracted RRB ontology for the default CLI path.
* Add `lib/exam/ontologyGen.ts`: LLM-assisted ontology structure generator for arbitrary exams, with review-before-seed. This generates structure, not factual content, so Hard Rule §1 remains intact.
* Update `lib/caRanking.ts` to read per-exam category priors from the active preset/config, with neutral `0.5` default.
* Update `lib/services/testbookImport.ts` so full-vs-sectional classification derives from configured section totals, not the NTPC 100-question literal.
* Keep `scripts/seed.ts` as a generalized or clearly labeled RRB demo seed.
### Phase 6 — Branding from config
* Update `app/manifest.ts` and `app/layout.tsx` to derive the title from config (`PrepMind` plus active exam name) where available.
* Update `components/Sidebar.tsx` to receive the display name from server layout instead of hardcoding `RRB NTPC`.
### Phase 7 — Docs
* Update `CLAUDE.md`, `RRBNTPCbuildbrief.md`, `learnermemoryarchitecture.md`, `userstoriesplan.md`, and `README.md` to document multi-exam behavior, subject `generation_mode`, onboarding, and one-active-exam switch semantics.
* Preserve the Hard Rules unchanged except for the wording that generalizes GA/GK to any fact-grounded subject.
### Phase 8 — Validation
* Run `npm test`; update readiness/calibration tests and add tests for `lib/exam/subjects.ts` plus preset validation.
* Run `npm run lint` and `npm run build`.
* Manual validation: fresh DB → onboarding → RRB preset → review/practice/mock/generate work; second preset proves generalization; switching flow requires explicit confirmation.
## Invariants preserved
No ungrounded fact generation; every AI question clears the verify gate before display; no fine-tuning; append-only logs; selective retrieval; cost caps; design system on new screens.
## Orchestration
* **Decision**: Use child agents after Phase 0. The foundation must land first; after that, engine, UI, content, and docs are mostly file-disjoint and parallelize cleanly.
* **Dependencies and ordering**: Phase 0 is sequential and owned by the orchestrator. After it is stable, four children fan out in git worktrees. The orchestrator integrates, validates, commits, pushes, and opens one draft PR.
* **Launch config**: Use the plan-attached orchestration config as the source of truth. All children share one batch and local execution unless you change the config.
* **Child agents**:
    * **engine — lib generalization**: owns `lib/services/*`, `lib/db/queries/questions.ts`, `lib/llm/prompts/*`, `lib/readiness.ts`, `lib/caRanking.ts`, `lib/services/testbookImport.ts`, `lib/llm/questionChecks.ts`, and related tests. Local worktree `../pm-engine`, branch `oz/mx-engine`, output branch plus validation results.
    * **experience — onboarding and UI**: owns `app/**` and `components/**` for onboarding, exam form/switching, mode-based filters, subject selects, graph ordering, branding, and neg-ratio pages. Local worktree `../pm-experience`, branch `oz/mx-experience`, output branch plus validation results.
    * **content — presets and ontology**: owns `scripts/**`, `lib/exam/ontology/**`, and `lib/exam/ontologyGen.ts`. Local worktree `../pm-content`, branch `oz/mx-content`, output branch plus validation results.
    * **docs — documentation**: owns the five root docs. Local worktree `../pm-docs`, branch `oz/mx-docs`, output branch plus changed-doc summary.
* **Merge strategy**: Orchestrator merges engine, experience, content, and docs into one integration branch; resolves contract seams; runs full validation; commits with `Co-Authored-By: Oz <oz-agent@warp.dev>`; pushes and opens one draft PR.
* **Diagram**:
```mermaid
flowchart LR
  F([Phase 0 foundation]) --> L["Launch child agents"]
  L --> E["engine — lib"]
  L --> X["experience — app/components"]
  L --> C["content — presets/ontology"]
  L --> D["docs — markdown"]
  E --> M["integrate"]
  X --> M
  C --> M
  D --> M
  M --> V["test / lint / build"]
  V --> PR([draft PR])
```
