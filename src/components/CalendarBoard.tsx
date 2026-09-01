"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { Avatar, StatusPill } from "@/components/ui";
import { STATUS_STYLES, type Channel, type Status } from "@/lib/constants";
import { shortDate, workingDaysBetween } from "@/lib/dates";

type Item = {
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
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/**
 * Working days between finishing and going live. Uses the completed date once
 * the work is done, and the deadline before that — so the figure answers
 * "how much room is there?" both before and after the fact.
 */
function buffer(item: Item): { days: number | null; planned: boolean } {
  const anchor = item.dateCompleted ?? item.deadline;
  if (!anchor || !item.publishDate) return { days: null, planned: !item.dateCompleted };
  return {
    days: workingDaysBetween(anchor, item.publishDate),
    planned: !item.dateCompleted,
  };
}

function bufferLabel(item: Item): { text: string; tone: "ok" | "warn" | "danger" | "quiet" } {
  const { days, planned } = buffer(item);
  if (days === null) return { text: "No deadline set", tone: "quiet" };
  const noun = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days < 0) {
    return { text: planned ? `Due ${noun} after it publishes` : `Finished ${noun} late`, tone: "danger" };
  }
  if (days === 0) return { text: "No room — lands the same day", tone: "warn" };
  return { text: planned ? `${noun} of buffer` : `Finished with ${noun} to spare`, tone: "ok" };
}

export function CalendarBoard({ me }: { me: Me }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const grid = useMemo(() => buildGrid(cursor.y, cursor.m), [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from: iso(grid[0]), to: iso(grid[41]) });
      setItems(await api.get(`/api/calendar?${qs.toString()}`));
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

  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) {
      if (!it.publishDate) continue;
      const list = m.get(it.publishDate) ?? [];
      list.push(it);
      m.set(it.publishDate, list);
    }
    return m;
  }, [items]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const todayIso = iso(today);
  const selectedItems = selected ? byDay.get(selected) ?? [] : [];

  function shift(by: number) {
    setSelected(null);
    setCursor((c) => {
      const d = new Date(c.y, c.m + by, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <>
      <div className="px-6 pt-5 pb-4 header-rule">
        <h1 className="page-title text-ink">Calendar</h1>
        <p className="text-[12.5px] text-muted mt-0.5">
          What&apos;s going live, and how much room there is before it does.
        </p>
      </div>

      <div className="flex-1 md:overflow-auto scroll-quiet px-6 pt-4 pb-6">
        <div className="bg-card border border-line rounded-[14px] shadow-card px-3.5 py-2.5 mb-3.5 flex flex-wrap items-center gap-2">
          <button onClick={() => shift(-1)} aria-label="Previous month"
            className="text-[15px] leading-none text-muted hover:text-ink border border-line rounded-lg px-2.5 py-1.5">‹</button>
          <div className="font-semibold text-[15px] text-ink min-w-[150px] text-center">{monthLabel}</div>
          <button onClick={() => shift(1)} aria-label="Next month"
            className="text-[15px] leading-none text-muted hover:text-ink border border-line rounded-lg px-2.5 py-1.5">›</button>
          <button
            onClick={() => { setSelected(null); setCursor({ y: today.getFullYear(), m: today.getMonth() }); }}
            className="text-[12.5px] border border-line rounded-lg px-2.5 py-1.5 text-muted hover:bg-line2 hover:text-ink"
          >
            Today
          </button>
          <div className="flex-1" />
          <span className="text-[11.5px] text-faint">
            {loading ? "Loading…" : `${items.length} scheduled`}
          </span>
        </div>

        {error ? (
          <div className="bg-card border border-line rounded-[14px] py-11 text-center text-[13.5px] text-danger-fg">
            {error}
          </div>
        ) : (
          <div className="bg-card border border-line rounded-[14px] shadow-card overflow-hidden">
            <div className="grid grid-cols-7">
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
                const dayItems = byDay.get(key) ?? [];
                const isToday = key === todayIso;
                const isSelected = key === selected;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(dayItems.length ? (isSelected ? null : key) : null)}
                    className={
                      "text-left min-h-[92px] p-1.5 border-b border-r border-line2 align-top transition " +
                      (NON_WORKING.has(i % 7) ? "bg-groupbar/40 " : "") +
                      (inMonth ? "" : "opacity-40 ") +
                      (isSelected ? "ring-2 ring-inset ring-burgundy-600 " : "") +
                      (dayItems.length ? "cursor-pointer hover:bg-rowhover" : "cursor-default")
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
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayItems.slice(0, 3).map((it) => {
                        const s = STATUS_STYLES[it.status] ?? STATUS_STYLES["Not Started"];
                        return (
                          <span key={it.id}
                            className="flex items-center gap-1 rounded px-1 py-[3px] text-[10px] leading-tight truncate"
                            style={{ background: s.bg, color: s.fg }}
                            title={`${it.title} · ${it.assignedToName}`}
                          >
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: s.fg }} />
                            <span className="truncate">{it.title}</span>
                          </span>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <span className="text-[10px] text-faint px-1">+{dayItems.length - 3} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Day detail */}
        {selected && (
          <div className="bg-card border border-line rounded-[14px] shadow-card overflow-hidden mt-3.5">
            <div className="px-3.5 py-2.5 border-b border-line flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.1em] uppercase text-faint">
                Going live · {shortDate(selected)}
              </span>
              <div className="flex-1" />
              <button onClick={() => setSelected(null)}
                className="text-faint hover:text-ink text-[17px] leading-none px-1">×</button>
            </div>
            {selectedItems.map((it) => {
              const b = bufferLabel(it);
              const tone =
                b.tone === "ok" ? "bg-ok-bg text-ok-fg"
                : b.tone === "warn" ? "bg-warn-bg text-warn-fg"
                : b.tone === "danger" ? "bg-danger-bg text-danger-fg"
                : "bg-quiet-bg text-quiet-fg";
              return (
                <div key={it.id} className="px-3.5 py-3 border-b border-line2 last:border-0 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="font-semibold text-[13.5px] text-ink">{it.title}</div>
                    <div className="text-[11.5px] text-muted mt-0.5">
                      {it.channel ?? "No channel"} · deadline{" "}
                      {it.deadline ? shortDate(it.deadline) : "not set"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar name={it.assignedToName} size={24} />
                    <span className="text-[12.5px] text-muted">
                      {it.assignedToId === me.id ? "You" : it.assignedToName}
                    </span>
                  </div>
                  <span className={"text-[11.5px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap " + tone}>
                    {b.text}
                  </span>
                  <StatusPill status={it.status} />
                </div>
              );
            })}
          </div>
        )}

        <div className="text-[11.5px] text-faint pt-3">
          Everyone sees the full schedule. Buffer is working days (Mon–Thu) between finishing and
          going live — the deadline is used until the task is completed.
        </div>
      </div>
    </>
  );
}
