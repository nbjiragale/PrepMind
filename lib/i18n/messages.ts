import type { Locale } from "./config";

// Message catalog. `en` is the source of truth; `kn` (Kannada) mirrors its keys.
// Keep keys grouped by area. Screens are converted incrementally — add keys here
// as each screen is localized.

const en = {
  // Common
  "common.loading": "Loading…",
  "common.error": "Something went wrong.",
  "common.back": "Back",

  // App shell
  "shell.footerTitle": "Track your readiness",
  "shell.footerSub": "See where you stand →",

  // Language picker
  "language.label": "Study language",
  "language.help": "Everything — questions, the tutor, explanations — appears in this language. Choose carefully; changing it later means resetting your exam.",

  // Onboarding
  "onboarding.tagline": "Choose your exam to get started.",
  "onboarding.details": "Details",
  "onboarding.totalQuestions": "Total questions",
  "onboarding.optionsPerQuestion": "Options per question",
  "onboarding.negativeMarking": "Negative marking",
  "onboarding.noPenalty": "No penalty",
  "onboarding.setup": "Set up {exam}",
  "onboarding.settingUp": "Setting up…",

  // Review loop
  "review.allClear": "All clear",
  "review.nothingDue": "Nothing is due right now. Add cards or check back later.",
  "review.reviewedToday": "You reviewed {count} {cards} today. Nice work.",
  "review.cardSingular": "card",
  "review.cardPlural": "cards",
  "review.remainingToday": "{count} remaining today",
  "review.reveal": "Reveal answer",
  "review.again": "Again",
  "review.hard": "Hard",
  "review.good": "Good",
  "review.easy": "Easy",
} as const;

export type UiKey = keyof typeof en;

const kn: Record<UiKey, string> = {
  "common.loading": "ಲೋಡ್ ಆಗುತ್ತಿದೆ…",
  "common.error": "ಏನೋ ತಪ್ಪಾಯಿತು.",
  "common.back": "ಹಿಂದೆ",

  "shell.footerTitle": "ನಿಮ್ಮ ಸಿದ್ಧತೆಯನ್ನು ಗಮನಿಸಿ",
  "shell.footerSub": "ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ನೋಡಿ →",

  "language.label": "ಅಧ್ಯಯನ ಭಾಷೆ",
  "language.help":
    "ಎಲ್ಲವೂ — ಪ್ರಶ್ನೆಗಳು, ಬೋಧಕ, ವಿವರಣೆಗಳು — ಈ ಭಾಷೆಯಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ. ಎಚ್ಚರಿಕೆಯಿಂದ ಆರಿಸಿ; ನಂತರ ಬದಲಾಯಿಸಲು ನಿಮ್ಮ ಪರೀಕ್ಷೆಯನ್ನು ಮರುಹೊಂದಿಸಬೇಕಾಗುತ್ತದೆ.",

  "onboarding.tagline": "ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಪರೀಕ್ಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
  "onboarding.details": "ವಿವರಗಳು",
  "onboarding.totalQuestions": "ಒಟ್ಟು ಪ್ರಶ್ನೆಗಳು",
  "onboarding.optionsPerQuestion": "ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಆಯ್ಕೆಗಳು",
  "onboarding.negativeMarking": "ಋಣಾತ್ಮಕ ಅಂಕನ",
  "onboarding.noPenalty": "ದಂಡವಿಲ್ಲ",
  "onboarding.setup": "{exam} ಸಜ್ಜುಗೊಳಿಸಿ",
  "onboarding.settingUp": "ಸಜ್ಜುಗೊಳಿಸಲಾಗುತ್ತಿದೆ…",

  "review.allClear": "ಎಲ್ಲವೂ ಮುಗಿದಿದೆ",
  "review.nothingDue": "ಈಗ ಯಾವುದೂ ಬಾಕಿ ಇಲ್ಲ. ಕಾರ್ಡ್‌ಗಳನ್ನು ಸೇರಿಸಿ ಅಥವಾ ನಂತರ ಪರಿಶೀಲಿಸಿ.",
  "review.reviewedToday": "ನೀವು ಇಂದು {count} {cards} ಪುನರಾವರ್ತಿಸಿದ್ದೀರಿ. ಒಳ್ಳೆಯ ಕೆಲಸ.",
  "review.cardSingular": "ಕಾರ್ಡ್",
  "review.cardPlural": "ಕಾರ್ಡ್‌ಗಳು",
  "review.remainingToday": "ಇಂದು {count} ಬಾಕಿ",
  "review.reveal": "ಉತ್ತರ ತೋರಿಸಿ",
  "review.again": "ಮತ್ತೆ",
  "review.hard": "ಕಷ್ಟ",
  "review.good": "ಚೆನ್ನಾಗಿದೆ",
  "review.easy": "ಸುಲಭ",
};

export const ui: Record<Locale, Record<UiKey, string>> = { en, kn };

// Nav labels keyed by href (matches lib/nav.ts), so localization needs no change
// to the nav structure. Missing entries fall back to the English label.
const navEn: Record<string, string> = {
  "/review": "Review",
  "/practice": "Practice",
  "/planner": "Planner",
  "/digest": "Digest",
  "/mock": "Take a mock",
  "/exam": "Exam setup",
  "/tutor": "Tutor",
  "/feynman": "Feynman",
  "/recall": "Recall",
  "/dashboard": "Overview",
  "/diagnosis": "Mistakes",
  "/calibration": "Calibration",
  "/ingest": "Ingest",
  "/import/testbook": "Testbook import",
  "/generate": "Generate",
  "/current-affairs": "Current affairs",
  "/concepts": "Concepts",
  "/cards": "Cards",
  "/graph": "Graph",
};

const navKn: Record<string, string> = {
  "/review": "ಪುನರಾವರ್ತನೆ",
  "/practice": "ಅಭ್ಯಾಸ",
  "/planner": "ಯೋಜಕ",
  "/digest": "ಸಾರಾಂಶ",
  "/mock": "ಅಣಕು ಪರೀಕ್ಷೆ ಮಾಡಿ",
  "/exam": "ಪರೀಕ್ಷೆ ಸಜ್ಜಿಕೆ",
  "/tutor": "ಬೋಧಕ",
  "/feynman": "ಫೈನ್‌ಮನ್",
  "/recall": "ಮರುಸ್ಮರಣೆ",
  "/dashboard": "ಅವಲೋಕನ",
  "/diagnosis": "ತಪ್ಪುಗಳು",
  "/calibration": "ಕ್ಯಾಲಿಬ್ರೇಶನ್",
  "/ingest": "ಸೇರ್ಪಡೆ",
  "/import/testbook": "ಟೆಸ್ಟ್‌ಬುಕ್ ಆಮದು",
  "/generate": "ರಚಿಸಿ",
  "/current-affairs": "ಪ್ರಚಲಿತ ವಿದ್ಯಮಾನ",
  "/concepts": "ಪರಿಕಲ್ಪನೆಗಳು",
  "/cards": "ಕಾರ್ಡ್‌ಗಳು",
  "/graph": "ನಕ್ಷೆ",
};

export const navByHref: Record<Locale, Record<string, string>> = { en: navEn, kn: navKn };

// Group labels keyed by NavGroup.key (lib/nav.ts).
const groupEn: Record<string, string> = {
  mock: "Mock tests",
  "study-aids": "Study aids",
  insights: "Insights",
  content: "Content",
  library: "Library",
};

const groupKn: Record<string, string> = {
  mock: "ಅಣಕು ಪರೀಕ್ಷೆಗಳು",
  "study-aids": "ಅಧ್ಯಯನ ಸಾಧನಗಳು",
  insights: "ಒಳನೋಟಗಳು",
  content: "ವಿಷಯ",
  library: "ಗ್ರಂಥಾಲಯ",
};

export const groupByKey: Record<Locale, Record<string, string>> = { en: groupEn, kn: groupKn };
