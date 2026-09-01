"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/client";
import { Avatar } from "@/components/ui";
import { rememberPassword } from "@/lib/credentials";
import { applyChoice, readChoice, type ThemeChoice } from "@/lib/theme";
import type { UserDTO } from "@/types";

type Me = { id: string; name: string; email: string; role: "manager" | "staff" };

export function Settings({ me }: { me: Me }) {
  const [profile, setProfile] = useState<UserDTO | null>(null);

  useEffect(() => {
    api.get("/api/me").then(setProfile).catch(() => setProfile(null));
  }, []);

  return (
    <>
      <div className="px-6 pt-5 pb-4 header-rule">
        <h1 className="page-title text-ink">Settings</h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          Your account and how the tracker looks for you.
        </p>
      </div>

      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pt-4 pb-6">
        <div className="max-w-[640px]">
          <ProfileSection me={me} />
          <AccountSection me={me} profile={profile} />
          <AppearanceSection />
          <PasswordSection me={me} />
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- profile */

function ProfileSection({ me }: { me: Me }) {
  const { update } = useSession();
  const [name, setName] = useState(me.name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg(""); setBusy(true);
    try {
      await api.patch("/api/me", { name: name.trim() });
      // Refresh the session so the sidebar and avatars pick the new name up.
      await update?.();
      setMsg("Name updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your name.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Profile" desc="How your name appears on tasks and avatars.">
      <form onSubmit={save}>
        <div className="flex items-center gap-3 mb-3.5">
          <Avatar name={name || me.name} size={38} />
          <div className="flex-1">
            <Label>Display name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2 focus:border-burgundy-500"
              required
            />
          </div>
        </div>
        <button
          type="submit" disabled={busy || !name.trim() || name.trim() === me.name}
          className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save name"}
        </button>
        <Note ok={msg} bad={error} />
      </form>
    </Section>
  );
}

/* ---------------------------------------------------------------- account */

function AccountSection({ me, profile }: { me: Me; profile: UserDTO | null }) {
  const since = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  return (
    <Section title="Account" desc="Managed by your department — ask a manager to change these.">
      <div className="flex flex-wrap gap-7">
        <div>
          <Label>Email</Label>
          <div className="text-[13.5px] text-ink">{me.email}</div>
        </div>
        <div>
          <Label>Role</Label>
          <span className="inline-block font-mono text-[10px] font-semibold tracking-wider uppercase px-1.5 py-1 rounded bg-burgundy-600 text-white">
            {me.role}
          </span>
        </div>
        <div>
          <Label>Member since</Label>
          <div className="text-[13.5px] text-ink font-mono">{since}</div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- appearance */

const CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function AppearanceSection() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readChoice());
    setReady(true);
  }, []);

  function pick(v: ThemeChoice) {
    setChoice(v);
    applyChoice(v);
  }

  return (
    <Section title="Appearance" desc="Applies on this device.">
      <div className="inline-flex border border-line rounded-[10px] overflow-hidden">
        {CHOICES.map((c) => {
          const on = ready && choice === c.value;
          return (
            <button
              key={c.value} onClick={() => pick(c.value)} type="button"
              className={
                "px-4 py-2 text-[13.5px] transition " +
                (on ? "bg-burgundy-600 text-white font-semibold" : "text-muted hover:bg-line2")
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>
      <div className="text-[11.5px] text-faint mt-2.5">
        System follows your computer&apos;s light or dark setting.
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- password */

function PasswordSection({ me }: { me: Me }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("The two new passwords don't match.");

    setBusy(true);
    try {
      await api.patch("/api/me/password", { currentPassword: current, newPassword: next });
      await rememberPassword(me.email, next, me.name);
      setMsg("Password changed.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Password" desc="Use something only you know.">
      <form onSubmit={submit}>
        {/* Read-only, but present so the browser knows which account this is. */}
        <input type="text" name="username" autoComplete="username" value={me.email} readOnly hidden />

        <Field label="Current password">
          <input type="password" autoComplete="current-password" value={current}
            onChange={(e) => setCurrent(e.target.value)} required
            className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2 focus:border-burgundy-500" />
        </Field>
        <Field label="New password" hint="At least 8 characters.">
          <input type="password" autoComplete="new-password" value={next}
            onChange={(e) => setNext(e.target.value)} required
            className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2 focus:border-burgundy-500" />
        </Field>
        <Field label="Confirm new password">
          <input type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required
            className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2 focus:border-burgundy-500" />
        </Field>

        <button type="submit" disabled={busy}
          className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 disabled:opacity-60">
          {busy ? "Saving…" : "Change password"}
        </button>
        <div className="text-[11.5px] text-faint mt-2.5">
          Your browser will offer to save the new password.
        </div>
        <Note ok={msg} bad={error} />
      </form>
    </Section>
  );
}

/* ------------------------------------------------------------------ bits */

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-[14px] shadow-card overflow-hidden mb-3.5">
      <div className="px-4 py-3 border-b border-line">
        <div className="text-[15px] font-bold text-ink">{title}</div>
        <div className="text-[12.5px] text-muted mt-0.5">{desc}</div>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[10px] tracking-[0.1em] uppercase text-faint mb-1.5">
      {children}
    </span>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <Label>{label}</Label>
      {children}
      {hint && <div className="text-[11.5px] text-faint mt-1">{hint}</div>}
    </div>
  );
}

function Note({ ok, bad }: { ok: string; bad: string }) {
  if (!ok && !bad) return null;
  return (
    <div
      className={
        "mt-3 px-2.5 py-2 rounded-lg text-[12.5px] " +
        (bad ? "bg-danger-bg text-danger-fg" : "bg-ok-bg text-ok-fg")
      }
    >
      {bad || ok}
    </div>
  );
}
