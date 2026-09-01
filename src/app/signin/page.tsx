"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { rememberPassword } from "@/lib/credentials";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error || !res?.ok) {
      setError(
        "That email and password don't match — or your account is still waiting for a manager to approve it."
      );
      return;
    }
    // Sign-in happens over fetch, so Chrome never sees a form submit navigate.
    // Ask it to save the credential explicitly.
    await rememberPassword(email.trim().toLowerCase(), password);
    router.replace("/tasks");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen grid place-items-center px-5 py-10 bg-[#0A0F1E] bg-[url('/campus.jpg')] bg-cover bg-center bg-no-repeat">
      {/* Darkens the photo so the card stays readable at any screen size. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E]/30 via-[#0A0F1E]/15 to-[#0A0F1E]/50" />
      <ThemeToggle className="absolute top-4 right-4 z-10 text-white/70 hover:text-white hover:bg-white/10 rounded-md p-2 leading-none" />

      <div className="relative w-full max-w-[340px] bg-card border border-white/15 rounded-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,.65)] p-7">
        <div className="font-serif font-bold text-[21px] leading-tight text-ink">
          Strategic Communications
        </div>
        <div className="font-mono text-[9.5px] tracking-[0.11em] uppercase text-faint mt-1.5 pb-4 mb-4 border-b border-line2">
          Task Tracker · AUS
        </div>

        <form onSubmit={submit}>
          <label className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-1.5">
            Username
          </label>
          <input
            type="email"
            autoComplete="username"
            placeholder="you@aus.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-3 text-[13px] bg-field border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
            required
          />

          <label className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint mb-1.5">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-3 text-[13px] bg-field border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
            required
          />

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 mt-0.5 font-semibold text-[13px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-md transition disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          {error && (
            <div className="mt-3 px-2.5 py-2 rounded-md bg-danger-bg text-danger-fg text-[12px]">
              {error}
            </div>
          )}
        </form>

        <div className="mt-4 pt-3 border-t border-line2 text-center text-[12px] text-muted">
          Staff without an account?{" "}
          <Link href="/signup" className="font-semibold text-burgundy-600 hover:underline">
            Sign up
          </Link>
          <div className="text-[11px] text-faint mt-1">
            A manager approves new accounts before the first sign-in.
          </div>
        </div>
      </div>
    </main>
  );
}
