// Language directive for LLM system prompts. The app is single-locale per
// instance (exam_config.locale), so every generative call should answer in that
// language. English is the no-op default — appending nothing keeps existing
// prompts (and their output) byte-for-byte unchanged.

export type Language = "English" | "Kannada";

export function languageDirective(language: Language): string {
  if (language === "English") return "";
  return (
    ` Respond entirely in ${language}. Write all explanations, questions, options, and feedback in ${language} script.` +
    " Keep widely-standard proper nouns, established technical/exam terms, and mathematical notation in their conventional form; gloss them in" +
    ` ${language} where it aids understanding. Do not mix in English sentences.`
  );
}

// Append the directive to a system prompt. No-op for English.
export function withLanguage(systemPrompt: string, language: Language): string {
  const directive = languageDirective(language);
  return directive ? `${systemPrompt}${directive}` : systemPrompt;
}
