import next from "eslint-config-next/core-web-vitals";

// Flat config — Next.js 16 removed `next lint`, so linting now runs the ESLint
// CLI (`eslint .`) directly against this config.
const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "extension/**", "public/**"],
  },
  {
    // eslint-plugin-react-hooks v6 ships the React Compiler's purity /
    // set-state-in-effect rules. They flag intentional, documented patterns in
    // this app (SSR-safe localStorage hydration, the mock auto-submit-at-time-up
    // effect) and `Date.now()` calls inside event handlers. Surface them as
    // warnings for review rather than hard build-breaking errors.
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
