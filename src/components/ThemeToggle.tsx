"use client";

import { useEffect, useState } from "react";
import { applyChoice, readChoice, resolve } from "@/lib/theme";

/**
 * Quick light/dark switch for the sidebar. The three-way choice (including
 * "system") lives on the Settings page; this just flips between the two.
 *
 * The initial class is set by the inline script in the root layout before first
 * paint, so this only reads what's already applied — that's what stops the page
 * flashing the wrong theme on load.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(resolve(readChoice()));
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    applyChoice(next ? "dark" : "light");
    setDark(next);
  }

  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button onClick={toggle} title={label} aria-label={label} className={className}>
      {/* Rendered only after mount so server and client markup match. */}
      {ready ? dark ? <SunIcon /> : <MoonIcon /> : <span className="block w-[15px] h-[15px]" />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
