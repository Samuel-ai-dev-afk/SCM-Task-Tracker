"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { rememberPassword } from "@/lib/credentials";

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

export function ChangePasswordModal({
  email,
  name,
  onClose,
  onChanged,
}: {
  email: string;
  name: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("The two new passwords don't match.");

    setBusy(true);
    try {
      await api.patch("/api/me/password", { currentPassword: current, newPassword: next });
      // Offer it to the browser's password manager before we clear the field.
      await rememberPassword(email, next, name);
      setDone(true);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(400px,94vw)] z-[51] bg-card rounded-xl shadow-modal flex flex-col overflow-hidden animate-pop">
        <div className="px-[18px] py-[15px] border-b border-line flex items-start gap-2.5">
          <div className="flex-1">
            <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-faint block mb-1">
              Account
            </span>
            <h3 className="font-serif font-bold text-[16px] text-ink">Change password</h3>
          </div>
          <button
            onClick={onClose}
            className="text-faint hover:text-ink hover:bg-line2 rounded px-1.5 py-0.5 text-[19px] leading-none"
          >
            ×
          </button>
        </div>

        {done ? (
          <>
            <div className="px-[18px] py-4">
              <div className="px-2.5 py-2 rounded-md bg-ok-bg text-ok-fg text-[12.5px] leading-relaxed">
                <span className="font-semibold block mb-0.5">Password changed</span>
                Use your new password next time you sign in. If your browser offered to save it,
                accept and it will fill in for you.
              </div>
            </div>
            <div className="px-[18px] py-3 border-t border-line bg-sunken flex">
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="font-semibold text-[13px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md px-3.5 py-2"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="px-[18px] py-4">
              {/* Present so the browser's password manager knows which account
                  this password belongs to. Read-only on purpose. */}
              <L label="Account">
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={email}
                  readOnly
                  className="w-full text-[13px] bg-subtle border border-line rounded-md px-2.5 py-2 text-muted"
                />
              </L>

              <L label="Current password">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2 focus:border-burgundy-500"
                  required
                  autoFocus
                />
              </L>

              <L label="New password">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2 focus:border-burgundy-500"
                  required
                />
              </L>

              <L label="Confirm new password">
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full text-[13px] bg-field border border-line rounded-md px-2.5 py-2 focus:border-burgundy-500"
                  required
                />
              </L>

              <div className="text-[11.5px] text-faint">
                Your browser will offer to save the new password so you don&apos;t have to
                remember it.
              </div>

              {error && (
                <div className="mt-3 px-2.5 py-2 rounded-md bg-danger-bg text-danger-fg text-[12px]">
                  {error}
                </div>
              )}
            </div>

            <div className="px-[18px] py-3 border-t border-line bg-sunken flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="font-semibold text-[13px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md px-3.5 py-2 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Change password"}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-[13px] border border-line rounded-md px-3.5 py-2 hover:bg-line2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
