-- 0011_multi_exam.sql
-- Introduces the `subject` catalog table, generalises concept.subject from a
-- hard CHECK to an FK, and adds exam_config.options_per_question so option count
-- is exam-driven (not assumed to be 4). Safe to run against an existing RRB
-- instance: backfills the three standard rows and the sections[*].subject_key
-- before enforcing the FK.
--
-- Hard Rules preserved:
--   §1  generation_mode='grounded' replaces every `subject='ga'` guard.
--   §2  verify gate is unchanged; only the subject-routing logic generalises.

-- ─── Subject catalog ─────────────────────────────────────────────────────────
-- One row per subject for the active exam. key is the stable string stored on
-- concept.subject; generation_mode drives the Hard Rule §1 grounding gate.
CREATE TABLE IF NOT EXISTS subject (
    key             TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('grounded', 'verified_free')),
    position        SMALLINT NOT NULL DEFAULT 0    -- display / column ordering
);

-- RRB NTPC bootstrap rows. Idempotent: ON CONFLICT keeps the existing row if a
-- re-run follows an already-migrated instance.
INSERT INTO subject (key, label, generation_mode, position) VALUES
    ('math',      'Mathematics',                      'verified_free', 0),
    ('reasoning', 'General Intelligence & Reasoning', 'verified_free', 1),
    ('ga',        'General Awareness',                'grounded',      2)
ON CONFLICT (key) DO NOTHING;

-- ─── concept.subject → subject(key) FK ───────────────────────────────────────
-- Drop the old hard enum first. Add the FK as NOT VALID so the migration
-- applies instantly even if (in a future exam) a concept carries a key that
-- isn't in `subject` yet; then VALIDATE makes it structural.
ALTER TABLE concept DROP CONSTRAINT IF EXISTS concept_subject_check;

ALTER TABLE concept
    ADD CONSTRAINT concept_subject_fk
    FOREIGN KEY (subject) REFERENCES subject (key)
    NOT VALID;

ALTER TABLE concept VALIDATE CONSTRAINT concept_subject_fk;

-- ─── exam_config additions ────────────────────────────────────────────────────
-- options_per_question: number of answer choices per MCQ (4 for RRB NTPC; may
-- differ for other exams). Drives guess-probability and option-count validation.
ALTER TABLE exam_config
    ADD COLUMN IF NOT EXISTS options_per_question INT NOT NULL DEFAULT 4;

-- qualifying_fraction: conventional qualifying band as a fraction of total marks
-- (0.45 for RRB NTPC). Drives the dashboard readiness target instead of a
-- hardcoded literal.
ALTER TABLE exam_config
    ADD COLUMN IF NOT EXISTS qualifying_fraction REAL NOT NULL DEFAULT 0.45;

-- sections[*].subject_key: explicit mapping replaces the keyword-sniffing
-- subjectForSection. Backfill the existing row using the same keyword logic so
-- nothing breaks before the application layer is updated.
UPDATE exam_config
SET sections = (
    SELECT jsonb_agg(
        CASE
            WHEN lower(s->>'name') LIKE '%math%'
                THEN s || '{"subject_key":"math"}'::jsonb
            WHEN lower(s->>'name') LIKE '%reason%'
              OR lower(s->>'name') LIKE '%intelligence%'
              OR lower(s->>'name') LIKE '%aptitude%'
                THEN s || '{"subject_key":"reasoning"}'::jsonb
            WHEN lower(s->>'name') LIKE '%aware%'
              OR lower(s->>'name') LIKE '%general%'
                THEN s || '{"subject_key":"ga"}'::jsonb
            ELSE s
        END
    )
    FROM jsonb_array_elements(sections) AS s
)
WHERE sections IS NOT NULL
  AND NOT (sections @> '[{"subject_key":"math"}]'
        OR sections @> '[{"subject_key":"reasoning"}]'
        OR sections @> '[{"subject_key":"ga"}]');
