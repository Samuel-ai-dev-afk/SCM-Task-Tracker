"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/client";
import { STATUSES, type Role } from "@/lib/constants";
import { weekNumber, weekRange, turnaround, deadlineVariance, shortDate } from "@/lib/dates";
import { Avatar, StatusPill } from "@/components/ui";
import { TaskModal } from "@/components/TaskModal";
import type { TaskDTO, UserDTO } from "@/types";

type Me = { id: string; name: string; role: Role };

export function TaskBoard({ me }: { me: Me }) {
  const isManager = me.role === "manager";
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fWho, setFWho] = useState("all");
  const [fStat, setFStat] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null); // task id or "new"

  const reload = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([
        api.get("/api/tasks"),
        isManager ? api.get("/api/users") : Promise.resolve([]),
      ]);
      setTasks(t);
      setUsers(u);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    reload();
  }, [reload]);

  const staff = useMemo(() => users.filter((u) => u.role === "staff" && u.active), [users]);
  const managers = useMemo(() => users.filter((u) => u.role === "manager" && u.active), [users]);

  // KPIs
  const open = tasks.filter((t) => t.status !== "Completed").length;
  const completed = tasks.filter((t) => t.status === "Completed");
  const blocked = tasks.filter((t) => t.status === "Blocked").length;
  const turns = completed
    .map((t) => turnaround(t.dateAssigned, t.dateCompleted))
    .filter((n): n is number => n !== null);
  const avg = turns.length ? (turns.reduce((a, b) => a + b, 0) / turns.length).toFixed(1) + "d" : "—";
  const kpis: [string, string | number, boolean][] = [
    ["Open", open, false],
    ["Completed", completed.length, false],
    ["Blocked", blocked, blocked > 0],
    ["Avg turnaround", avg, false],
  ];

  // Filter + sort + group by week
  const filtered = tasks
    .filter((t) => (fWho === "all" || t.assignedToName === fWho) && (fStat === "all" || t.status === fStat))
    .sort((a, b) => a.dateAssigned.localeCompare(b.dateAssigned));

  const byWeek = new Map<number, TaskDTO[]>();
  for (const t of filtered) {
    const w = weekNumber(t.dateAssigned) || 0;
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(t);
  }
  const weeks = [...byWeek.keys()].sort((a, b) => a - b);
  const cols = isManager ? 8 : 7;

  const openTask = tasks.find((t) => t.id === openId) ?? null;

  return (
    <>
      <div className="px-6 pt-5 pb-4 header-rule">
        <h1 className="page-title text-ink">
          {isManager ? "All tasks" : "My tasks"}
        </h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          {isManager
            ? "Everything the department is working on."
            : "Open a task to update its status, attach a file, or comment."}
        </p>
      </div>

      {/* KPIs */}
      <div className="px-6 pt-4">
        <div className="bg-card rounded-[14px] shadow-card flex flex-wrap divide-x divide-line2 overflow-hidden">
        {kpis.map(([label, value, warn]) => (
          <div key={label} className="px-4 py-3 min-w-[112px] flex-1">
            <span className={"metric block " + (warn ? "text-burgundy-600" : "text-ink")}>
              {value}
            </span>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-faint mt-1.5 block">
              {label}
            </span>
          </div>
        ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-3 flex-wrap">
        {isManager && (
          <>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-faint">Person</span>
            <select
              value={fWho}
              onChange={(e) => setFWho(e.target.value)}
              className="text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-1.5"
            >
              <option value="all">Everyone</option>
              {staff.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-faint">Status</span>
            <select
              value={fStat}
              onChange={(e) => setFStat(e.target.value)}
              className="text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-1.5"
            >
              <option value="all">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="flex-1" />
        {(
          <button
            onClick={() => setOpenId("new")}
            className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 transition"
          >
            {isManager ? "+ Assign task" : "+ Add task"}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pb-6">
        <div className="bg-card border border-line rounded-[14px] overflow-hidden shadow-card">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Task</Th>
                {isManager && <Th>Assigned to</Th>}
                <Th className="hidden md:table-cell">Assigned</Th>
                <Th className="hidden md:table-cell">Deadline</Th>
                <Th className="hidden md:table-cell">Completed</Th>
                <Th>Vs deadline</Th>
                <Th>Status</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={cols} className="py-11 text-center text-faint text-[13.5px]">
                    Loading…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={cols} className="py-11 text-center text-[13.5px] text-danger-fg">
                    {error}
                  </td>
                </tr>
              ) : weeks.length === 0 ? (
                <tr>
                  <td colSpan={cols} className="py-11 px-5 text-center">
                    <b className="block text-ink text-[15px] mb-1 font-semibold">
                      {isManager ? "Nothing here" : "You're all clear"}
                    </b>
                    <span className="text-faint text-[13.5px]">
                      {isManager ? "No tasks match this filter." : "Nothing is assigned to you right now."}
                    </span>
                  </td>
                </tr>
              ) : (
                weeks.map((w) => (
                  <WeekGroup key={w} week={w} cols={cols}>
                    {byWeek.get(w)!.map((t) => (
                      <TaskRow key={t.id} task={t} isManager={isManager} onClick={() => setOpenId(t.id)} />
                    ))}
                  </WeekGroup>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="text-[11.5px] text-faint pt-3">
          {isManager
            ? "Manager view — you can assign work and manage the team."
            : "You only see tasks assigned to you."}{" "}
          Shared board: everyone sees the same live data.
        </div>
      </div>

      {openId && (
        <TaskModal
          me={me}
          isNew={openId === "new"}
          task={openTask}
          staff={staff}
          managers={managers}
          onClose={() => setOpenId(null)}
          onSaved={async () => {
            setOpenId(null);
            await reload();
          }}
          onChanged={reload}
        />
      )}
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        "bg-subtle text-left px-3.5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-faint border-b border-line whitespace-nowrap " +
        className
      }
    >
      {children}
    </th>
  );
}

function WeekGroup({ week, cols, children }: { week: number; cols: number; children: React.ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={cols} className="bg-groupbar px-3.5 py-2 border-b border-line">
          <b className="font-mono text-[10px] font-semibold tracking-[0.09em] uppercase text-ink">
            Week {week}
          </b>
          <span className="text-[11.5px] text-muted ml-2.5">{weekRange(week)}</span>
        </td>
      </tr>
      {children}
    </>
  );
}

function TaskRow({
  task,
  isManager,
  onClick,
}: {
  task: TaskDTO;
  isManager: boolean;
  onClick: () => void;
}) {
  const v = deadlineVariance(task.deadline, task.dateCompleted);
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:bg-rowhover transition-colors border-b border-line2 last:border-0"
    >
      <td className="px-3.5 py-3 align-middle">
        <div className="font-semibold text-[13.5px] leading-tight text-ink">{task.title}</div>
        {task.description && (
          <div className="text-[11.5px] text-muted mt-0.5 truncate max-w-[330px]">{task.description}</div>
        )}
      </td>
      {isManager && (
        <td className="px-3.5 py-3 align-middle">
          <div className="flex items-center gap-2">
            <Avatar name={task.assignedToName} size={24} />
            <span className="text-[12.5px]">{task.assignedToName}</span>
          </div>
        </td>
      )}
      <td className="px-3.5 py-3 align-middle font-mono text-[12.5px] text-muted hidden md:table-cell">
        {shortDate(task.dateAssigned)}
      </td>
      <td className="px-3.5 py-3 align-middle font-mono text-[12.5px] text-muted hidden md:table-cell">
        {task.deadline ? shortDate(task.deadline) : <span className="text-faint">—</span>}
      </td>
      <td className="px-3.5 py-3 align-middle font-mono text-[12.5px] text-muted hidden md:table-cell">
        {task.dateCompleted ? shortDate(task.dateCompleted) : <span className="text-faint">—</span>}
      </td>
      <td className="px-3.5 py-3 align-middle font-mono text-[12.5px]">
        {v === null ? (
          <span className="text-faint">—</span>
        ) : (
          <span
            className={
              "font-semibold " +
              (v > 0 ? "text-burgundy-600" : v < 0 ? "text-green-600" : "text-green-700")
            }
          >
            {v === 0 ? "On time" : `${Math.abs(v)}d ${v > 0 ? "late" : "early"}`}
          </span>
        )}
      </td>
      <td className="px-3.5 py-3 align-middle">
        <StatusPill status={task.status} />
      </td>
      <td className="px-3.5 py-3 align-middle whitespace-nowrap">
        {task.fileLink && <Tag>↗ file</Tag>}
        {task.commentCount > 0 && <Tag>{task.commentCount} ✎</Tag>}
      </td>
    </tr>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted bg-line2 px-1.5 py-1 rounded mr-1">
      {children}
    </span>
  );
}
