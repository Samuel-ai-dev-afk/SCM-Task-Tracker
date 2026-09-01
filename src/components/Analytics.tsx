"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { STATUSES, PILLARS, STATUS_STYLES, type Status } from "@/lib/constants";
import { weekNumber, weekRange, turnaround, deadlineVariance } from "@/lib/dates";
import type { TaskDTO, UserDTO } from "@/types";

export function Analytics() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([api.get("/api/tasks"), api.get("/api/users")]);
        setTasks(t);
        setUsers(u);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load analytics.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Completed");
    const blocked = tasks.filter((t) => t.status === "Blocked").length;
    const open = total - completed.length;

    const turns = completed
      .map((t) => turnaround(t.dateAssigned, t.dateCompleted))
      .filter((n): n is number => n !== null);
    const avgTurn = turns.length
      ? (turns.reduce((a, b) => a + b, 0) / turns.length).toFixed(1) + "d"
      : "—";

    const withBoth = tasks
      .map((t) => deadlineVariance(t.deadline, t.dateCompleted))
      .filter((n): n is number => n !== null);
    const onTime = withBoth.filter((v) => v <= 0).length;
    const onTimeRate = withBoth.length ? Math.round((onTime / withBoth.length) * 100) + "%" : "—";

    // Status distribution
    const byStatus = STATUSES.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));

    // Workload per staff member (open tasks)
    const staff = users.filter((u) => u.role === "staff");
    const byPerson = staff
      .map((u) => ({
        name: u.name,
        open: tasks.filter((t) => t.assignedToName === u.name && t.status !== "Completed").length,
        total: tasks.filter((t) => t.assignedToName === u.name).length,
      }))
      .sort((a, b) => b.total - a.total);

    // Tasks per week
    const weekMap = new Map<number, number>();
    tasks.forEach((t) => {
      const w = weekNumber(t.dateAssigned) || 0;
      weekMap.set(w, (weekMap.get(w) ?? 0) + 1);
    });
    const byWeek = [...weekMap.entries()].sort((a, b) => a[0] - b[0]).map(([w, count]) => ({ w, count }));

    // Tasks per strategic pillar (+ none)
    const byPillar = [
      ...PILLARS.map((p) => ({ label: p, count: tasks.filter((t) => t.strategicPillar === p).length })),
      { label: "No pillar", count: tasks.filter((t) => !t.strategicPillar).length },
    ].filter((r) => r.count > 0);

    return {
      total,
      completedCount: completed.length,
      open,
      blocked,
      completionRate: total ? Math.round((completed.length / total) * 100) + "%" : "—",
      avgTurn,
      onTimeRate,
      byStatus,
      byPerson,
      byWeek,
      byPillar,
    };
  }, [tasks, users]);

  if (loading) {
    return <div className="p-6 text-[13px] text-faint">Loading analytics…</div>;
  }
  if (error) {
    return <div className="p-6 text-[13px] text-danger-fg">{error}</div>;
  }

  const kpis: [string, string | number, boolean][] = [
    ["Total tasks", stats.total, false],
    ["Completed", stats.completedCount, false],
    ["Open", stats.open, false],
    ["Blocked", stats.blocked, stats.blocked > 0],
    ["Completion rate", stats.completionRate, false],
    ["Avg turnaround", stats.avgTurn, false],
    ["On-time rate", stats.onTimeRate, false],
  ];

  return (
    <>
      <div className="px-6 pt-5">
        <h1 className="font-bold text-[21px] tracking-[-0.012em] text-ink">Analytics</h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          How the department&apos;s work is distributed and how it&apos;s tracking against deadlines.
        </p>
      </div>

      {/* KPI row */}
      <div className="flex gap-2.5 px-6 pt-4 flex-wrap">
        {kpis.map(([label, value, warn]) => (
          <div
            key={label}
            className={
              "bg-card border rounded-lg px-3.5 py-2.5 min-w-[110px] flex-1 shadow-card " +
              (warn ? "border-burgundy-400 bg-burgundy-50" : "border-line")
            }
          >
            <span
              className={
                "block text-[20px] font-semibold tracking-[-0.02em] " +
                (warn ? "text-burgundy-600" : "text-ink")
              }
            >
              {value}
            </span>
            <span className="text-[10.5px] text-muted mt-0.5 block">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pb-8 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status distribution */}
          <Panel title="Task status">
            {stats.byStatus.map((r) => (
              <Bar
                key={r.status}
                label={r.status}
                value={r.count}
                max={stats.total}
                color={STATUS_STYLES[r.status as Status].fg}
                suffix={r.count === 1 ? "task" : "tasks"}
              />
            ))}
          </Panel>

          {/* Workload by person */}
          <Panel title="Workload by person (open tasks)">
            {stats.byPerson.length === 0 ? (
              <Empty />
            ) : (
              stats.byPerson.map((p) => {
                const peak = Math.max(1, ...stats.byPerson.map((x) => x.open));
                return (
                  <Bar
                    key={p.name}
                    label={p.name}
                    value={p.open}
                    max={peak}
                    color={p.open >= peak && p.open > 0 ? "var(--c-brand)" : "var(--c-bar)"}
                    suffix={`open · ${p.total} total`}
                  />
                );
              })
            )}
          </Panel>

          {/* Tasks per week */}
          <Panel title="Tasks by week">
            {stats.byWeek.length === 0 ? (
              <Empty />
            ) : (
              stats.byWeek.map((r) => {
                const peak = Math.max(1, ...stats.byWeek.map((x) => x.count));
                return (
                  <Bar
                    key={r.w}
                    label={`Week ${r.w}`}
                    sub={weekRange(r.w)}
                    value={r.count}
                    max={peak}
                    color="var(--c-brand)"
                    suffix={r.count === 1 ? "task" : "tasks"}
                  />
                );
              })
            )}
          </Panel>

          {/* Strategic pillars */}
          <Panel title="Tasks by strategic pillar">
            {stats.byPillar.length === 0 ? (
              <Empty />
            ) : (
              stats.byPillar.map((r) => {
                const peak = Math.max(1, ...stats.byPillar.map((x) => x.count));
                return (
                  <Bar
                    key={r.label}
                    label={r.label}
                    value={r.count}
                    max={peak}
                    color={r.label === "No pillar" ? "var(--c-bar)" : "var(--c-brand)"}
                    suffix={r.count === 1 ? "task" : "tasks"}
                  />
                );
              })
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-[10px] shadow-card p-4">
      <h2 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-faint mb-3.5">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Bar({
  label,
  sub,
  value,
  max,
  color,
  suffix,
}: {
  label: string;
  sub?: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-[120px] shrink-0 min-w-0">
        <div className="text-[12px] text-ink truncate" title={label}>
          {label}
        </div>
        {sub && <div className="text-[10px] text-faint truncate">{sub}</div>}
      </div>
      <div className="flex-1 h-[8px] bg-line2 rounded overflow-hidden">
        <div
          className="h-full rounded transition-all"
          style={{ width: `${pct}%`, background: color, minWidth: value > 0 ? 4 : 0 }}
        />
      </div>
      <div className="w-[92px] shrink-0 text-right text-[11px] text-muted">
        <span className="font-semibold text-ink">{value}</span>
        {suffix ? ` ${suffix}` : ""}
      </div>
    </div>
  );
}

function Empty() {
  return <div className="text-[12px] text-faint py-2">No data yet.</div>;
}
