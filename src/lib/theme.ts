"use client";

// Theme choice lives on the client only. "system" means follow the OS.
export type ThemeChoice = "light" | "dark" | "system";

export const THEME_KEY = "scm.theme";

export function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // Storage blocked — fall through to the OS preference.
  }
  return "system";
}

export function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolve(choice: ThemeChoice): boolean {
  return choice === "dark" || (choice === "system" && prefersDark());
}

/** Apply a choice to the document and remember it. */
export function applyChoice(choice: ThemeChoice): void {
  document.documentElement.classList.toggle("dark", resolve(choice));
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Not persisted; the current page still reflects the choice.
  }
}
