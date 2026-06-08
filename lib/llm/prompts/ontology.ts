// Pure prompt construction for the LLM-assisted ontology STRUCTURE generator
// (mx). The model maps out a syllabus — the topics/concepts to study and how they
// relate (prerequisite/contrast) — NOT exam facts, questions, or answers. The
// proposal is reviewed before it's seeded, and grounded subjects still only ever
// get questions/cards from source text elsewhere, so Hard Rule §1 is untouched.

export interface OntologySubject {
  key: string;
  label: string;
  generation_mode: "grounded" | "verified_free";
}

export function buildOntologySystemPrompt(examName: string): string {
  return [
    `You are a curriculum architect mapping the syllabus STRUCTURE for the ${examName} exam.`,
    "Produce a concept ontology: the discrete topics a learner should master, organised under each subject, plus how they relate.",
    "STRUCTURE ONLY — do NOT write exam facts, questions, answers, dates, names, or numeric values. Each concept is a topic/skill to study, not a fact to memorise.",
    "For a concept, `description` (optional) is a one-line SCOPE of the topic (what it covers), never a specific fact or claim.",
    "Relations:",
    '- "prerequisites": pairs [dependent, foundation] where the first concept genuinely requires the second first (e.g. ["Percentages","Fractions"]).',
    '- "contrasts": pairs [a, b] of commonly-confused concepts worth disambiguating.',
    "Every name used in a relation MUST exactly match a concept `name` you defined. Keep names short and canonical; no duplicates.",
    "Return ONLY a JSON object with keys:",
    '- "concepts": array of { "name", "subject", "topic", "subtopic"?, "description"? }',
    '- "prerequisites": array of [dependent, foundation] pairs',
    '- "contrasts": array of [a, b] pairs',
    "`subject` MUST be exactly one of the provided subject keys. No prose outside the JSON.",
  ].join("\n");
}

export function buildOntologyUserPrompt(input: {
  examName: string;
  subjects: OntologySubject[];
  conceptsPerSubject: number;
}): string {
  const subjectLines = input.subjects.map(
    (s) =>
      `- key="${s.key}" — ${s.label} (${
        s.generation_mode === "grounded"
          ? "fact-grounded subject: list topic areas/themes, not individual facts"
          : "skill subject: list techniques, rules, and problem types"
      })`
  );
  return [
    `Build the concept ontology for ${input.examName}.`,
    `Subjects (use the exact key on each concept's "subject"):`,
    ...subjectLines,
    `Aim for roughly ${input.conceptsPerSubject} well-chosen concepts per subject, grouped into sensible topics.`,
    "Add prerequisite and contrast relations where they genuinely help a learner; omit them where they don't.",
  ].join("\n");
}
