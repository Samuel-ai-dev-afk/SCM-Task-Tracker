"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// Shown on the login screen while this is a shared demo.
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "demo1234";

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
      setError("That email and password don't match. Try again.");
      return;
    }
    router.replace("/tasks");
    router.refresh();
  }

  return (
    <main className="min-h-screen grid place-items-center bg-surface px-5 py-10">
      <div className="w-full max-w-[340px] bg-card border border-line rounded-xl shadow-pop p-7">
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
            className="w-full mb-3 text-[13px] bg-white border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
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
            className="w-full mb-3 text-[13px] bg-white border border-line rounded-md px-3 py-2 focus:border-burgundy-500"
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
            <div className="mt-3 px-2.5 py-2 rounded-md bg-[#FBE6E5] text-[#A5372E] text-[12px]">
              {error}
            </div>
          )}
        </form>

        <div className="mt-4 pt-3 border-t border-line2 text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-faint">
            Demo access
          </div>
          <div className="text-[12px] text-muted mt-1.5 leading-relaxed">
            Sign in with any AUS email below · password{" "}
            <span className="font-mono font-semibold text-ink">{DEMO_PASSWORD}</span>
          </div>
          <div className="text-[11px] text-faint mt-1.5">
            Managers: ldsilva · smmurtaza · smahmoud · sbukhari &nbsp;·&nbsp; Staff: b00101717 · amali
            <span className="block">(all @aus.edu)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
