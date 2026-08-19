"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

const DISMISS_KEY = "scm.defaultPasswordBanner.dismissed";

/**
 * A quiet bar shown while the signed-in user is still on a handed-out password.
 * Dismissing it hides it for the rest of the browser session; changing the
 * password removes it for good.
 */
export function DefaultPasswordBanner({ onOpen }: { onOpen: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
        const res = await api.get("/api/me/password");
        if (!cancelled) setShow(Boolean(res?.usingDefaultPassword));
      } catch {
        // Offline or the API is unhappy — a nudge isn't worth an error message.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-warn-bg border-b border-warn-line text-warn-fg">
      <span className="text-[13px] leading-snug flex-1">
        <span className="font-semibold">You&apos;re still using the default password.</span>{" "}
        Set your own so nobody else can sign in as you.
      </span>
      <button
        onClick={onOpen}
        className="font-semibold text-[12px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md px-2.5 py-1.5 whitespace-nowrap"
      >
        Change password
      </button>
      <button
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, "1");
          } catch {
            // Private mode with storage blocked — hiding it in state is enough.
          }
          setShow(false);
        }}
        title="Dismiss for now"
        className="text-warn-fg opacity-60 hover:opacity-100 text-[17px] leading-none px-1"
      >
        ×
      </button>
    </div>
  );
}
