"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Avatar } from "@/components/ui";
import { StatusPill } from "@/components/ui";
import { formatMinutes, monthRange, monthRangeOffset } from "@/lib/time";
import { shortDate } from "@/lib/dates";
import type { Status } from "@/lib/constants";
import type { UserDTO } from "@/types";

type PersonRow = { id: string; name: string; minutes: number; taskCount: number };
type TaskRow = {
  id: string; title: string; status: Status; userId: string; userName: string;
  dateCompleted: string | null; minutesSpent: number;
};
type Report = {
  from: string; to: string; totalMinutes: number; taskCount: number;
  averageMinutes: number; people: PersonRow[]; tasks: TaskRow[];
};

type Me = { id: string; name: string; role: "manager" | "staff" };

export function HoursBoard({ me }: { me: Me }) {
  const isManager = me.role === "manager";
  const [{ from, to }, setRange] = useState(() => monthRange());
  const [who, setWho] = useState("all");
  const [staff, setStaff] = useState<UserDTO[]>([]);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isManager) return;
    // Only the staff being tracked — managers assign work rather than log it.
    api.get("/api/users")
      .then((all: UserDTO[]) => setStaff(all.filter((u) => u.role === "staff")))
      .catch(() => setStaff([]));
  }, [isManager]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from, to });
      if (isManager && who !== "all") qs.set("userId", who);
      setData(await api.get(`/api/hours?${qs.toString()}`));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load hours.");
    } finally {
      setLoading(false);
    }
  }, [from, to, who, isManager]);

  useEffect(() => {
    load();
  }, [load]);

  const peak = Math.max(1, ...(data?.people ?? []).map((p) => p.minutes));
  const label = new Date(from + "T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function preset(n: number) {
    setRange(monthRangeOffset(n));
  }

  return (
    <>
      <div className="px-6 pt-5">
        <h1 className="font-serif font-bold text-[21px] tracking-[-0.012em] text-ink">Hours</h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          {isManager
            ? "Time logged against tasks, totalled for the period."
            : "Time you've logged against your tasks, totalled for the period."}
        </p>
      </div>

      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pt-4 pb-6">
        {/* Period picker */}
        <div className="bg-card border border-line rounded-[10px] shadow-card px-3.5 py-3 mb-3.5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint">Period</span>
          <input
            type="date" value={from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="text-[13px] bg-field border border-line rounded-md px-2.5 py-1.5"
          />
          <span className="text-faint">→</span>
          <input
            type="date" value={to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="text-[13px] bg-field border border-line rounded-md px-2.5 py-1.5"
          />
          <Preset label="This month" onClick={() => preset(0)} />
          <Preset label="Last month" onClick={() => preset(1)} />
          <div className="flex-1" />
          {isManager && (
            <>
              <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint">Person</span>
              <select
                value={who} onChange={(e) => setWho(e.target.value)}
                className="text-[13px] bg-field border border-line rounded-md px-2.5 py-1.5 min-w-[150px]"
              >
                <option value="all">Everyone</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {error ? (
          <div className="bg-card border border-line rounded-[10px] py-11 text-center text-[13px] text-danger-fg">
            {error}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-3.5">
              <Tile value={formatMinutes(data?.totalMinutes ?? 0)} label={`Total logged · ${label}`} />
              <Tile value={String(data?.taskCount ?? 0)} label="Tasks with time logged" />
              <Tile value={formatMinutes(data?.averageMinutes ?? 0)} label="Average per task" />
              <Tile value={String(data?.people.length ?? 0)} label={isManager ? "People contributing" : "You"} />
            </div>

            {isManager && (
              <div className="bg-card border border-line rounded-[10px] shadow-card overflow-hidden mb-3.5">
                <SectionHead title="By person" right={`${shortDate(from)} – ${shortDate(to)}`} />
                <table className="w-full border-collapse">
                  <thead>
                    <tr>{["Name", "Tasks", "Hours logged", "Share"].map((h) => <Th key={h}>{h}</Th>)}</tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <Empty cols={4}>Loading…</Empty>
                    ) : !data?.people.length ? (
                      <Empty cols={4}>No time logged in this period.</Empty>
                    ) : (
                      data.people.map((p) => (
                        <tr key={p.id} className="border-b border-line2 last:border-0">
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={p.name} size={28} />
                              <span className="font-semibold text-[13.5px] text-ink">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 font-mono text-[13px] text-muted">{p.taskCount}</td>
                          <td className="px-3.5 py-3 font-mono text-[14px] font-semibold text-ink">
                            {formatMinutes(p.minutes)}
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="w-[110px] h-[5px] bg-line2 rounded overflow-hidden">
                              <div className="h-full rounded bg-burgundy-600"
                                style={{ width: `${Math.round((p.minutes / peak) * 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-card border border-line rounded-[10px] shadow-card overflow-hidden">
              <SectionHead title="Task detail" right={`${data?.tasks.length ?? 0} tasks`} />
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Task</Th>
                    {isManager && <Th>Person</Th>}
                    <Th>Completed</Th>
                    <Th>Time logged</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <Empty cols={isManager ? 5 : 4}>Loading…</Empty>
                  ) : !data?.tasks.length ? (
                    <Empty cols={isManager ? 5 : 4}>
                      Nothing logged between these dates.
                    </Empty>
                  ) : (
                    data.tasks.map((t) => (
                      <tr key={t.id} className="border-b border-line2 last:border-0">
                        <td className="px-3.5 py-3 font-semibold text-[13px] text-ink">{t.title}</td>
                        {isManager && (
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={t.userName} size={24} />
                              <span className="text-[12.5px] text-muted">{t.userName}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-3.5 py-3 font-mono text-[12.5px] text-muted">
                          {t.dateCompleted ? shortDate(t.dateCompleted) : "—"}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[13px] font-semibold text-ink">
                          {formatMinutes(t.minutesSpent)}
                        </td>
                        <td className="px-3.5 py-3"><StatusPill status={t.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-faint pt-3">
              Time counts toward the period a task was marked completed. Tasks with no time logged
              are left out.
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-[12px] border border-line rounded-md px-2.5 py-1.5 text-muted hover:bg-line2 hover:text-ink">
      {label}
    </button>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 min-w-[170px] bg-card border border-line rounded-[10px] shadow-card px-4 py-3.5">
      <div className="font-mono text-[22px] font-bold tracking-[-0.02em] text-ink">{value}</div>
      <div className="text-[11.5px] text-muted mt-0.5">{label}</div>
    </div>
  );
}

function SectionHead({ title, right }: { title: string; right: string }) {
  return (
    <div className="px-3.5 py-2.5 border-b border-line flex items-center gap-2">
      <span className="font-mono text-[9.5px] font-semibold tracking-[0.1em] uppercase text-faint">
        {title}
      </span>
      <div className="flex-1" />
      <span className="text-[11.5px] text-faint font-mono">{right}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="bg-subtle text-left px-3.5 py-2.5 font-mono text-[9.5px] font-semibold tracking-[0.1em] uppercase text-faint border-b border-line whitespace-nowrap">
      {children}
    </th>
  );
}

function Empty({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="py-11 text-center text-faint text-[13px]">{children}</td>
    </tr>
  );
}
