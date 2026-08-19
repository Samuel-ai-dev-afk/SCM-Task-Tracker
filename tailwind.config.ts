import type { Config } from "tailwindcss";

/*
  Colours are CSS variables defined in globals.css (light values on :root, dark
  overrides under .dark), so toggling the `dark` class on <html> re-themes every
  component without touching a single class name.
*/
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: "var(--c-brand)",
          50: "var(--c-brand-soft)",
          100: "var(--c-brand-soft)",
          400: "var(--c-brand-line)",
          500: "var(--c-brand-line)",
          600: "var(--c-brand)",
          700: "var(--c-brand-hover)",
          800: "var(--c-brand-hover)",
        },
        sidebar: "var(--c-sidebar)",

        surface: "var(--c-surface)",
        card: "var(--c-card)",
        field: "var(--c-field)",
        subtle: "var(--c-subtle)",
        sunken: "var(--c-sunken)",
        rowhover: "var(--c-rowhover)",
        groupbar: "var(--c-groupbar)",

        line: "var(--c-line)",
        line2: "var(--c-line2)",

        ink: "var(--c-ink)",
        ink2: "var(--c-ink2)",
        muted: "var(--c-muted)",
        faint: "var(--c-faint)",

        bar: "var(--c-bar)",
        overlay: "var(--c-overlay)",

        quiet: { bg: "var(--c-quiet-bg)", fg: "var(--c-quiet-fg)" },
        warn: {
          bg: "var(--c-warn-bg)",
          fg: "var(--c-warn-fg)",
          line: "var(--c-warn-line)",
        },
        info: { bg: "var(--c-info-bg)", fg: "var(--c-info-fg)" },
        ok: { bg: "var(--c-ok-bg)", fg: "var(--c-ok-fg)" },
        danger: {
          bg: "var(--c-danger-bg)",
          fg: "var(--c-danger-fg)",
          line: "var(--c-danger-line)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.05), 0 1px 3px rgba(0,0,0,.04)",
        pop: "0 4px 14px rgba(0,0,0,.10)",
        modal: "0 20px 50px rgba(0,0,0,.28)",
      },
    },
  },
  plugins: [],
};

export default config;
