import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: "#8B1E2D",
          50: "#FBEDEE",
          100: "#F6DADC",
          400: "#C25A66",
          500: "#A03544",
          600: "#8B1E2D",
          700: "#761826",
          800: "#5E131E",
        },
        surface: "#F5F6F7",
        card: "#FFFFFF",
        line: "#E4E7EB",
        line2: "#EEF0F3",
        ink: "#1A1D23",
        muted: "#6A727E",
        faint: "#98A0AC",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,29,35,.05), 0 1px 3px rgba(26,29,35,.04)",
        pop: "0 4px 14px rgba(26,29,35,.10)",
        modal: "0 20px 50px rgba(26,29,35,.28)",
      },
    },
  },
  plugins: [],
};

export default config;
