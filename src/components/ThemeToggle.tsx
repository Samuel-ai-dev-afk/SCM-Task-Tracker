"use client";

import { useEffect, useState } from "react";
import { applyChoice, readChoice, resolve } from "@/lib/theme";
import { IconSun, IconMoon } from "@/components/icons";

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
      {ready ? dark ? <IconSun size={16} /> : <IconMoon size={16} /> : <span className="block w-4 h-4" />}
    </button>
  );
}
