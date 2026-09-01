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
      // One family — Roboto — in three roles. The old serif/mono fallbacks
      // could render Georgia or Courier whenever Roboto was slow or blocked,
      // which is what made the interface look inconsistent. Every stack now
      // ends in the same sans, so it degrades to something that still fits.
      fontFamily: {
        // Display: page titles and the wordmark.
        serif: ["var(--font-sans)", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["var(--font-sans)", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        // Data and labels: tabular figures, set in globals.css.
        mono: ["var(--font-sans)", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      // Elevation does the work borders used to. Softer and slightly deeper
      // than before, so cards read as surfaces rather than outlined boxes.
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.04), 0 2px 8px -2px rgba(0,0,0,.06)",
        pop: "0 4px 16px -2px rgba(0,0,0,.10)",
        modal: "0 24px 60px -12px rgba(0,0,0,.34)",
      },
    },
  },
  plugins: [],
};

export default config;
