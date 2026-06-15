// i18n core — the app is single-instance, so the active language lives on
// exam_config.locale (chosen at onboarding). 'en' is the default and keeps the
// app exactly as it was; 'kn' (Kannada) switches the whole experience.

export type Locale = "en" | "kn";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
];

export function isLocale(x: unknown): x is Locale {
  return x === "en" || x === "kn";
}

export function coerceLocale(x: unknown): Locale {
  return isLocale(x) ? x : DEFAULT_LOCALE;
}

// The language name handed to the LLM prompts (drives the "respond in X" rule).
export function languageName(locale: Locale): "English" | "Kannada" {
  return locale === "kn" ? "Kannada" : "English";
}
