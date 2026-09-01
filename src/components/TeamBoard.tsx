"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/client";
import { Avatar } from "@/components/ui";
import type { UserDTO } from "@/types";

export function TeamBoard({ meId }: { meId: string }) {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [pending, setPending] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([api.get("/api/users"), api.get("/api/users/pending")]);
      setUsers(u);
      setPending(p);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the team.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const staff = users.filter((u) => u.role === "staff");
  const peak = Math.max(1, ...staff.map((u) => u.openCount ?? 0));

  async function remove(u: UserDTO) {
    if (u.role !== "staff") {
      alert("Managers can't be removed from the tracker.");
      return;
    }
    const n = u.openCount ?? 0;
    const warn = n
      ? `\n\n${u.name} still has ${n} open task${n === 1 ? "" : "s"} — those stay on the board, so reassign them after.`
      : "";
    if (!confirm(`Remove ${u.name} from the tracker?${warn}`)) return;
    try {
      await api.del(`/api/users/${u.id}`);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not remove.");
    }
  }

  // Approve or decline a staff member who signed themselves up.
  async function decide(u: UserDTO, action: "approve" | "decline") {
    if (action === "decline" && !confirm(`Decline ${u.name}'s request to join?`)) return;
    setDeciding(u.id);
    try {
      await api.patch(`/api/users/${u.id}`, { action });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not update that request.");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <>
      <div className="px-6 pt-5 pb-4 header-rule">
        <h1 className="page-title text-ink">Team</h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          Everyone in the department, and what&apos;s on their plate.
        </p>
      </div>

      <div className="flex items-center px-6 pt-4 pb-3">
        <div className="flex-1" />
        <button
          onClick={() => setAdding(true)}
          className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 transition"
        >
          + Add person
        </button>
      </div>

      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pb-6">
        {pending.length > 0 && (
          <div className="bg-card border border-danger-line rounded-[14px] overflow-hidden shadow-card mb-4">
            <div className="px-3.5 py-2.5 bg-danger-bg border-b border-danger-line flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-danger-fg">
                Awaiting approval
              </span>
              <span className="font-mono text-[10px] font-semibold text-white bg-burgundy-600 rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            </div>
            {pending.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2.5 px-3.5 py-3 border-b border-line2 last:border-0"
              >
                <Avatar name={u.name} size={30} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] text-ink truncate">{u.name}</div>
                  <div className="text-[11.5px] text-muted truncate">
                    {u.email} · signed up {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => decide(u, "approve")}
                  disabled={deciding === u.id}
                  className="font-semibold text-[12.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-2.5 py-1.5 disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(u, "decline")}
                  disabled={deciding === u.id}
                  className="font-semibold text-[12.5px] text-muted border border-line rounded-lg px-2.5 py-1.5 hover:bg-line2 disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            ))}
            <div className="px-3.5 py-2 bg-sunken border-t border-line2 text-[11.5px] text-faint">
              These people signed up themselves. Approving lets them sign in and receive tasks —
              always as staff.
            </div>
          </div>
        )}

        <div className="bg-card border border-line rounded-[14px] overflow-hidden shadow-card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Role", "Current workload", ""].map((h, i) => (
                  <th
                    key={i}
                    className="bg-subtle text-left px-3.5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-faint border-b border-line whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-11 text-center text-faint text-[13.5px]">
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-11 text-center text-[13.5px] text-danger-fg">
                    {error}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const n = u.openCount ?? 0;
                  const hot = n >= peak && n > 0;
                  return (
                    <tr key={u.id} className="border-b border-line2 last:border-0">
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size={30} />
                          <div>
                            <div className="font-semibold text-[13.5px] text-ink">
                              {u.name}
                              {u.id === meId && (
                                <span className="text-faint font-normal"> · you</span>
                              )}
                            </div>
                            <div className="text-[11.5px] text-muted">
                              {u.role === "manager" ? "Assigns work" : "Receives work"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 align-middle">
                        <span
                          className={
                            "inline-block font-mono text-[10px] font-semibold tracking-wider uppercase px-1.5 py-1 rounded " +
                            (u.role === "manager"
                              ? "bg-burgundy-600 text-white"
                              : "bg-line2 text-muted")
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 align-middle">
                        {u.role === "staff" ? (
                          <div className="flex items-center gap-2.5 min-w-[130px]">
                            <div className="flex-1 max-w-[96px] h-[5px] bg-line2 rounded overflow-hidden">
                              <div
                                className="h-full rounded transition-all"
                                style={{
                                  width: `${Math.round((n / peak) * 100)}%`,
                                  background: hot ? "var(--c-brand)" : "var(--c-bar)",
                                }}
                              />
                            </div>
                            <span className="font-mono text-[12.5px] text-muted">{n} open</span>
                          </div>
                        ) : (
                          <span className="text-faint font-mono text-[12.5px]">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 align-middle text-right">
                        {u.role === "staff" ? (
                          <button
                            onClick={() => remove(u)}
                            className="font-semibold text-[12.5px] text-danger-fg border border-danger-line rounded-lg px-2.5 py-1.5 hover:bg-danger-bg"
                          >
                            Remove
                          </button>
                        ) : (
                          <span
                            className="text-faint font-mono text-[12.5px]"
                            title="Managers can't be removed from the tracker"
                          >
                            locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="text-[11.5px] text-faint pt-3">
          Adding someone lets them sign in and start receiving tasks. Staff can also sign up
          themselves with an @aus.edu email — those requests appear above for approval. Removing a
          staff member deactivates them — their tasks stay on the board.
        </div>
      </div>

      {adding && <AddPersonModal onClose={() => setAdding(false)} onAdded={async () => { setAdding(false); await reload(); }} />}
    </>
  );
}

function AddPersonModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [password, setPassword] = useState("changeme123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function add() {
    setError("");
    if (!name.trim()) return setError("Enter a name.");
    if (!email.trim()) return setError("Enter an email.");
    if (!password) return setError("Set a password.");
    setBusy(true);
    try {
      await api.post("/api/users", { name: name.trim(), email: email.trim(), role, password });
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add person.");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,94vw)] z-[51] bg-card rounded-[16px] shadow-modal flex flex-col overflow-hidden animate-pop">
        <div className="px-[18px] py-[15px] border-b border-line flex items-start gap-2.5">
          <div className="flex-1">
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-faint block mb-1">Team</span>
            <h3 className="font-serif font-bold text-[17px] text-ink">Add a person</h3>
          </div>
          <button onClick={onClose} className="text-faint hover:text-ink hover:bg-line2 rounded px-1.5 py-0.5 text-[18px] leading-none">
            ×
          </button>
        </div>
        <div className="px-[18px] py-4">
          <L label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yahya" className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2" />
          </L>
          <L label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@aus.edu" className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2" />
          </L>
          <L label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as "staff" | "manager")} className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2">
              <option value="staff">Staff — receives and works on tasks</option>
              <option value="manager">Manager — assigns tasks and manages the team</option>
            </select>
          </L>
          <L label="Initial password">
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2" />
          </L>
          <div className="text-[11.5px] text-faint">
            They sign in with this email and password, then can change it later.
          </div>
          {error && <div className="mt-3 px-2.5 py-2 rounded-lg bg-danger-bg text-danger-fg text-[12.5px]">{error}</div>}
        </div>
        <div className="px-[18px] py-3 border-t border-line bg-sunken flex gap-2">
          <button onClick={add} disabled={busy} className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 disabled:opacity-60">
            Add person
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="font-semibold text-[13.5px] border border-line rounded-lg px-3.5 py-2 hover:bg-line2">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-faint mb-1.5">{label}</label>
      {children}
    </div>
  );
}
