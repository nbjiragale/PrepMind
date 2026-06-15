import type { Config } from "tailwindcss";

// Tokens: soft lavender canvas, one violet accent, pastel category tiles.
// See CLAUDE.md §6 / UIdesignspec.md §10.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F2FC",
        subtle: "#EFEDFA",
        surface: "#FFFFFF",
        hover: "#F3F1FC",
        active: "#ECE9FB",
        hero: "#2A2740",
        primary: "#211D38",
        secondary: "#6B6781",
        muted: "#9C99AE",
        "on-accent": "#FFFFFF",
        "on-dark": "#F4F2FC",
        border: "#ECEAF6",
        "border-strong": "#DCD8EE",
        "border-subtle": "#F2F0FA",
        accent: {
          DEFAULT: "#6C5CE7",
          hover: "#5B4BD4",
          strong: "#5546C7",
          light: "#9D8DF1",
          subtle: "#EEEBFC",
          border: "#D7D0F7",
        },
        success: { DEFAULT: "#1FA971", subtle: "#E4F6EE" },
        warning: { DEFAULT: "#B9831F", subtle: "#FBEFD2" },
        danger: { DEFAULT: "#E15858", subtle: "#FBE7E7" },
        info: { DEFAULT: "#3E92E0", subtle: "#E2EFFB" },
        pastel: {
          yellow: "#FCE9C7",
          "yellow-ink": "#8A5E0F",
          mint: "#DDF3E7",
          "mint-ink": "#1F8A5B",
          blue: "#DEECFB",
          "blue-ink": "#2E78C6",
          purple: "#E7E2FB",
          "purple-ink": "#5546C7",
          pink: "#FBE2EE",
          "pink-ink": "#C13B7A",
          peach: "#FCE4DA",
          "peach-ink": "#C75E3B",
        },
        mastery: {
          0: "#ECEAF6",
          1: "#E0D9F8",
          2: "#FBE6C3",
          3: "#CDEBD8",
          4: "#86CFA8",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", '"Inter"', "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Arial", "sans-serif"],
        serif: ["var(--font-jakarta)", '"Tiempos Text"', '"Source Serif 4"', "Georgia", "serif"],
        mono: ["ui-monospace", '"SF Mono"', '"JetBrains Mono"', "Menlo", "monospace"],
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.45", fontWeight: "500" }],
        small: ["13px", { lineHeight: "1.5" }],
        body: ["15px", { lineHeight: "1.55" }],
        "body-lg": ["17px", { lineHeight: "1.6" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        h2: ["22px", { lineHeight: "1.3", fontWeight: "700" }],
        h1: ["28px", { lineHeight: "1.25", fontWeight: "700" }],
        display: ["36px", { lineHeight: "1.15", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "26px",
        "2xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(76,67,120,0.05)",
        sm: "0 2px 10px rgba(76,67,120,0.06)",
        md: "0 10px 30px rgba(76,67,120,0.10)",
        lg: "0 20px 48px rgba(76,67,120,0.16)",
        accent: "0 10px 24px rgba(108,92,231,0.30)",
      },
      ringColor: { focus: "rgba(108,92,231,0.35)" },
      maxWidth: { read: "72ch", shell: "1200px", column: "720px" },
    },
  },
  plugins: [],
};

export default config;
