"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { isAusEmail } from "@/lib/validation";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Friendly client-side checks; the API enforces all of these again.
    if (!name.trim()) return setError("Enter your full name.");
    if (!isAusEmail(email)) return setError("Sign up with your @aus.edu email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setBusy(true);
    try {
      await api.post("/api/signup", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen grid place-items-center px-5 py-10 bg-[#0A0F1E] bg-[url('/campus.jpg')] bg-cover bg-center bg-no-repeat">
      {/* Same treatment as the sign-in page so the two feel like one screen. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E]/30 via-[#0A0F1E]/15 to-[#0A0F1E]/50" />

      <div className="relative w-full max-w-[340px] bg-card border border-white/15 rounded-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,.65)] p-7">
        <div className="font-serif font-bold text-[21px] leading-tight text-ink">
          Strategic Communications
        </div>
        <div className="font-mono text-[9.5px] tracking-[0.11em] uppercase text-faint mt-1.5 pb-4 mb-4 border-b border-line2">
          Task Tracker · AUS
        </div>

        {done ? (
          <>
            <div className="px-3 py-3 rounded-md bg-[#E3F1E7] text-[#2C6B42] text-[12.5px] leading-relaxed">
              <span className="font-semibold block mb-0.5">Request sent</span>
              Your account is waiting for a manager to approve it. You&apos;ll be able to sign in
              with <span className="font-mono">{email.trim().toLowerCase()}</span> once they do.
            </div>
            <Link
              href="/signin"
              className="block text-center w-full py-2.5 mt-4 font-semibold text-[13px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md transition"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-serif font-bold text-[16px] text-ink mb-0.5">Create a staff account</h1>
            <p className="text-[12px] text-muted leading-relaxed mb-4">
              For staff who receive tasks. Manager accounts are set up by a manager on the Team
              page.
            </p>

            <form onSubmit={submit}>
              <Label>Full name</Label>
              <input
                type="text"
                autoComplete="name"
                placeholder="e.g. Yahya Khan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mb-3 text-[13px] bg-white border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
                required
              />

              <Label>AUS email</Label>
              <input
                type="email"
                autoComplete="username"
                placeholder="you@aus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mb-1 text-[13px] bg-white border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
                required
              />
              <div className="text-[11px] text-faint mb-3">
                Must end in <span className="font-mono">@aus.edu</span>.
              </div>

              <Label>Password</Label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-3 text-[13px] bg-white border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
                required
              />

              <Label>Confirm password</Label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full mb-3 text-[13px] bg-white border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
                required
              />

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 mt-0.5 font-semibold text-[13px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md transition disabled:opacity-60"
              >
                {busy ? "Creating account…" : "Create account"}
              </button>

              {error && (
                <div className="mt-3 px-2.5 py-2 rounded-md bg-[#FBE6E5] text-[#A5372E] text-[12px]">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-4 pt-3 border-t border-line2 text-center text-[12px] text-muted">
              Already have an account?{" "}
              <Link href="/signin" className="font-semibold text-burgundy-600 hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-1.5">
      {children}
    </label>
  );
}
