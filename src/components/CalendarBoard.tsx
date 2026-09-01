"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { Avatar, StatusPill } from "@/components/ui";
import {
  ENTRY_KINDS,
  ENTRY_STYLES,
  STATUS_STYLES,
  type Channel,
  type EntryKind,
  type Status,
} from "@/lib/constants";
import { shortDate, workingDaysBetween } from "@/lib/dates";
import type { CalendarEntryDTO } from "@/types";

type TaskItem = {
  id: string;
  title: string;
  status: Status;
  channel: Channel | null;
  publishDate: string | null;
  deadline: string | null;
  dateCompleted: string | null;
  assignedToId: string;
  assignedToName: string;
};

type Me = { id: string; name: string; role: "manager" | "staff" };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// The department's working week is Mon–Thu, matching the turnaround maths.
const NON_WORKING = new Set([4, 5, 6]);

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Monday-first index for a JS day number. */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** The 6×7 grid of days covering a month, padded out to whole weeks. */
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - mondayIndex(first));
  return Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
}

/**
 * Working days between finishing and going live. Uses the completed date once
 * the work is done, and the deadline before that — so the figure answers
 * "how much room is there?" both before and after the fact.
 */
function bufferLabel(item: TaskItem): { text: string; tone: "ok" | "warn" | "danger" | "quiet" } {
  const anchor = item.dateCompleted ?? item.deadline;
  const planned = !item.dateCompleted;
  if (!anchor || !item.publishDate) return { text: "No deadline set", tone: "quiet" };

  const days = workingDaysBetween(anchor, item.publishDate);
  if (days === null) return { text: "No deadline set", tone: "quiet" };

  const noun = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days < 0) {
    return {
      text: planned ? `Due ${noun} after it publishes` : `Finished ${noun} late`,
      tone: "danger",
    };
  }
  if (days === 0) return { text: "No room — lands the same day", tone: "warn" };
  return {
    text: planned ? `${noun} of buffer` : `Finished with ${noun} to spare`,
    tone: "ok",
  };
}

export function CalendarBoard({ me }: { me: Me }) {
  const isManager = me.role === "manager";
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [entries, setEntries] = useState<CalendarEntryDTO[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEntryDTO | "new" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const grid = useMemo(() => buildGrid(cursor.y, cursor.m), [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from: iso(grid[0]), to: iso(grid[41]) });
      const data = await api.get(`/api/calendar?${qs.toString()}`);
      setTasks(data.tasks ?? []);
      setEntries(data.entries ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the calendar.");
    } finally {
      setLoading(false);
    }
  }, [grid]);

  useEffect(() => {
    load();
  }, [load]);

  const tasksByDay = useMemo(() => {
    const m = new Map<string, TaskItem[]>();
    for (const t of tasks) {
      if (!t.publishDate) continue;
      m.set(t.publishDate, [...(m.get(t.publishDate) ?? []), t]);
    }
    return m;
  }, [tasks]);

  const entriesByDay = useMemo(() => {
    const m = new Map<string, CalendarEntryDTO[]>();
    for (const e of entries) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [entries]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const todayIso = iso(today);
  const selectedTasks = selected ? tasksByDay.get(selected) ?? [] : [];
  const selectedEntries = selected ? entriesByDay.get(selected) ?? [] : [];
  const scheduled = tasks.length + entries.length;

  function shift(by: number) {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(c.y, c.m + by, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  async function removeEntry(entry: CalendarEntryDTO) {
    if (!confirm(`Remove "${entry.title}" from the calendar?`)) return;
    try {
      await api.del(`/api/calendar/entries/${entry.id}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not remove that entry.");
    }
  }

  return (
    <>
      <div className="px-6 pt-5 pb-4 header-rule">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <h1 className="page-title text-ink">Calendar</h1>
            <p className="text-[12.5px] text-muted mt-0.5">
              What&apos;s going live, and how much room there is before it does.
            </p>
          </div>
          {isManager && (
            <button
              onClick={() => setEditing("new")}
              className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 transition"
            >
              + Add to calendar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pt-4 pb-6">
        <div className="bg-card border border-line rounded-[14px] shadow-card px-3.5 py-2.5 mb-3.5 flex flex-wrap items-center gap-2">
          <button onClick={() => shift(-1)} aria-label="Previous month"
            className="text-[18px] leading-none text-muted hover:text-ink border border-line rounded-lg px-2.5 py-1.5">‹</button>
          <div className="font-semibold text-[15px] text-ink min-w-[150px] text-center">{monthLabel}</div>
          <button onClick={() => shift(1)} aria-label="Next month"
            className="text-[18px] leading-none text-muted hover:text-ink border border-line rounded-lg px-2.5 py-1.5">›</button>
          <button
            onClick={() => { setSelected(null); setCursor({ y: today.getFullYear(), m: today.getMonth() }); }}
            className="text-[12.5px] border border-line rounded-lg px-2.5 py-1.5 text-muted hover:bg-line2 hover:text-ink"
          >
            Today
          </button>
          <div className="flex-1" />
          <span className="text-[11.5px] text-faint">
            {loading ? "Loading…" : `${scheduled} scheduled`}
          </span>
        </div>

        {error ? (
          <div className="bg-card border border-line rounded-[14px] py-11 text-center text-[13.5px] text-danger-fg">
            {error}
          </div>
        ) : (
          <div className="bg-card border border-line rounded-[14px] shadow-card overflow-hidden">
            {/* Seven day columns need room; scroll rather than squash them. */}
            <div className="overflow-x-auto scroll-quiet">
              <div className="grid grid-cols-7 min-w-[780px]">
                {DAY_NAMES.map((d, i) => (
                  <div key={d}
                    className={
                      "px-2 py-2 text-center font-mono text-[10px] font-semibold tracking-[0.1em] uppercase border-b border-line " +
                      (NON_WORKING.has(i) ? "bg-groupbar text-faint" : "bg-subtle text-faint")
                    }
                  >
                    {d}
                  </div>
                ))}

                {grid.map((d, i) => {
                  const key = iso(d);
                  const inMonth = d.getMonth() === cursor.m;
                  const dayTasks = tasksByDay.get(key) ?? [];
                  const dayEntries = entriesByDay.get(key) ?? [];
                  const count = dayTasks.length + dayEntries.length;
                  const isToday = key === todayIso;
                  const isSelected = key === selected;
                  // Managers can open any day to add something; staff only
                  // open days that actually have something on them.
                  const openable = isManager || count > 0;
                  return (
                    <button
                      key={key}
                      onClick={() => openable && setSelected(isSelected ? null : key)}
                      className={
                        "group text-left min-h-[92px] p-1.5 border-b border-r border-line2 align-top transition " +
                        (NON_WORKING.has(i % 7) ? "bg-groupbar/40 " : "") +
                        (inMonth ? "" : "opacity-40 ") +
                        (isSelected ? "ring-2 ring-inset ring-burgundy-600 " : "") +
                        (openable ? "cursor-pointer hover:bg-rowhover" : "cursor-default")
                      }
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span
                          className={
                            "font-mono text-[11.5px] w-[19px] h-[19px] grid place-items-center rounded-full " +
                            (isToday ? "bg-burgundy-600 text-white font-bold" : "text-muted")
                          }
                        >
                          {d.getDate()}
                        </span>
                        {isManager && (
                          <span className="ml-auto text-faint opacity-0 group-hover:opacity-100 text-[13.5px] leading-none pr-0.5">
                            +
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {dayEntries.slice(0, 2).map((e) => {
                          const s = ENTRY_STYLES[e.kind] ?? ENTRY_STYLES.Reminder;
                          return (
                            <span key={e.id}
                              className="flex items-center gap-1 rounded-md px-1 py-[3px] text-[10px] leading-tight truncate border-l-2"
                              style={{ background: s.bg, color: s.fg, borderColor: s.fg }}
                              title={`${e.kind}: ${e.title}`}
                            >
                              {e.time && <span className="font-mono shrink-0">{e.time}</span>}
                              <span className="truncate">{e.title}</span>
                            </span>
                          );
                        })}
                        {dayTasks.slice(0, 2).map((t) => {
                          const s = STATUS_STYLES[t.status] ?? STATUS_STYLES["Not Started"];
                          return (
                            <span key={t.id}
                              className="flex items-center gap-1 rounded-md px-1 py-[3px] text-[10px] leading-tight truncate"
                              style={{ background: s.bg, color: s.fg }}
                              title={`${t.title} · ${t.assignedToName}`}
                            >
                              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: s.fg }} />
                              <span className="truncate">{t.title}</span>
                            </span>
                          );
                        })}
                        {count > 4 && (
                          <span className="text-[10px] text-faint px-1">+{count - 4} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Day detail */}
        {selected && (
          <div className="bg-card border border-line rounded-[14px] shadow-card overflow-hidden mt-3.5">
            <div className="px-3.5 py-2.5 border-b border-line flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-faint">
                {shortDate(selected)}
              </span>
              <div className="flex-1" />
              {isManager && (
                <button onClick={() => setEditing("new")}
                  className="text-[12.5px] font-semibold text-burgundy-600 hover:underline">
                  + Add entry
                </button>
              )}
              <button onClick={() => setSelected(null)} aria-label="Close"
                className="text-faint hover:text-ink text-[18px] leading-none px-1">×</button>
            </div>

            {selectedEntries.length === 0 && selectedTasks.length === 0 && (
              <div className="px-3.5 py-8 text-center text-[13.5px] text-faint">
                Nothing on this day.{" "}
                {isManager && "Add a meeting, event, post or reminder."}
              </div>
            )}

            {selectedEntries.map((e) => {
              const s = ENTRY_STYLES[e.kind] ?? ENTRY_STYLES.Reminder;
              return (
                <div key={e.id} className="px-3.5 py-3 border-b border-line2 last:border-0 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap"
                    style={{ background: s.bg, color: s.fg }}>
                    {e.kind}
                  </span>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold text-[13.5px] text-ink">
                      {e.time && <span className="font-mono text-muted mr-1.5">{e.time}</span>}
                      {e.title}
                    </div>
                    {e.notes && <div className="text-[11.5px] text-muted mt-0.5">{e.notes}</div>}
                  </div>
                  {isManager && (
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing(e)}
                        className="text-[12.5px] font-semibold border border-line rounded-lg px-2.5 py-1.5 text-muted hover:bg-line2 hover:text-ink">
                        Edit
                      </button>
                      <button onClick={() => removeEntry(e)}
                        className="text-[12.5px] font-semibold text-danger-fg border border-danger-line rounded-lg px-2.5 py-1.5 hover:bg-danger-bg">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {selectedTasks.map((t) => {
              const b = bufferLabel(t);
              const tone =
                b.tone === "ok" ? "bg-ok-bg text-ok-fg"
                : b.tone === "warn" ? "bg-warn-bg text-warn-fg"
                : b.tone === "danger" ? "bg-danger-bg text-danger-fg"
                : "bg-quiet-bg text-quiet-fg";
              return (
                <div key={t.id} className="px-3.5 py-3 border-b border-line2 last:border-0 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="font-semibold text-[13.5px] text-ink">{t.title}</div>
                    <div className="text-[11.5px] text-muted mt-0.5">
                      {t.channel ?? "No channel"} · deadline{" "}
                      {t.deadline ? shortDate(t.deadline) : "not set"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar name={t.assignedToName} size={24} />
                    <span className="text-[12.5px] text-muted">
                      {t.assignedToId === me.id ? "You" : t.assignedToName}
                    </span>
                  </div>
                  <span className={"text-[11.5px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap " + tone}>
                    {b.text}
                  </span>
                  <StatusPill status={t.status} />
                </div>
              );
            })}
          </div>
        )}

        <div className="text-[11.5px] text-faint pt-3">
          Everyone sees the full schedule. Tasks are placed by their publish date and show the
          buffer — working days (Mon–Thu) between finishing and going live. Entries are meetings,
          events and reminders a manager added directly.
        </div>
      </div>

      {editing && (
        <EntryModal
          entry={editing === "new" ? null : editing}
          defaultDate={selected ?? todayIso}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ modal */

function EntryModal({
  entry,
  defaultDate,
  onClose,
  onSaved,
}: {
  entry: CalendarEntryDTO | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? "Meeting");
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [time, setTime] = useState(entry?.time ?? "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Give it a name.");

    setBusy(true);
    const body = { title: title.trim(), kind, date, time: time || null, notes: notes.trim() };
    try {
      if (entry) await api.patch(`/api/calendar/entries/${entry.id}`, body);
      else await api.post("/api/calendar/entries", body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that entry.");
      setBusy(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-overlay z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,94vw)] z-[51] bg-card rounded-[16px] shadow-modal flex flex-col overflow-hidden animate-pop">
        <div className="px-[18px] py-[15px] border-b border-line flex items-start gap-2.5">
          <div className="flex-1">
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-faint block mb-1">
              Calendar
            </span>
            <h3 className="font-serif font-bold text-[17px] text-ink">
              {entry ? "Edit entry" : "Add to the calendar"}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="text-faint hover:text-ink hover:bg-line2 rounded-lg px-1.5 py-0.5 text-[18px] leading-none">
            ×
          </button>
        </div>

        <form onSubmit={save}>
          <div className="px-[18px] py-4">
            <L label="What is it?">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deans' comms meeting"
                className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2 focus:border-burgundy-500"
                autoFocus
                required
              />
            </L>

            <L label="Type">
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_KINDS.map((k) => {
                  const s = ENTRY_STYLES[k];
                  const on = kind === k;
                  return (
                    <button key={k} type="button" onClick={() => setKind(k)}
                      className={
                        "text-[12.5px] font-semibold px-3 py-1.5 rounded-lg border transition " +
                        (on ? "border-transparent" : "border-line text-muted hover:bg-line2")
                      }
                      style={on ? { background: s.bg, color: s.fg } : undefined}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </L>

            <div className="flex gap-2.5">
              <L label="Date" className="flex-1 min-w-0">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2" required />
              </L>
              <L label="Time (optional)" className="flex-1 min-w-0">
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2" />
              </L>
            </div>

            <L label="Notes (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the team should know."
                className="w-full min-h-[60px] text-[13.5px] bg-field border border-line rounded-lg px-2.5 py-2 leading-relaxed resize-y"
              />
            </L>

            <div className="text-[11.5px] text-faint">
              Everyone can see calendar entries. They don&apos;t appear on the task board and
              don&apos;t count toward anyone&apos;s hours.
            </div>

            {error && (
              <div className="mt-3 px-2.5 py-2 rounded-lg bg-danger-bg text-danger-fg text-[12.5px]">
                {error}
              </div>
            )}
          </div>

          <div className="px-[18px] py-3 border-t border-line bg-sunken flex gap-2">
            <button type="submit" disabled={busy}
              className="font-semibold text-[13.5px] text-white bg-burgundy-600 hover:bg-burgundy-700 rounded-lg px-3.5 py-2 disabled:opacity-60">
              {busy ? "Saving…" : entry ? "Save changes" : "Add to calendar"}
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="font-semibold text-[13.5px] border border-line rounded-lg px-3.5 py-2 hover:bg-line2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function L({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"mb-3 " + className}>
      <label className="block font-mono text-[10px] tracking-[0.1em] uppercase text-faint mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
