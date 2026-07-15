// Date helpers: week grouping, turnaround, formatting.
// Week 1 starts Monday 1 June 2026.

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

// Anchor: Monday 1 June 2026, treated as a UTC calendar date to avoid TZ drift.
const WEEK1_START = Date.UTC(2026, 5, 1);

/** Parse a YYYY-MM-DD (or ISO) string into a UTC-midnight timestamp. */
function toUtcMidnight(input: string | Date | null | undefined): number | null {
  if (!input) return null;
  const s = typeof input === "string" ? input.slice(0, 10) : input.toISOString().slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

/** 1-based ISO-ish week number relative to the 1 June 2026 anchor. */
export function weekNumber(dateAssigned: string | Date | null | undefined): number {
  const t = toUtcMidnight(dateAssigned);
  if (t === null) return 0;
  return Math.floor((t - WEEK1_START) / DAY_MS / 7) + 1;
}

/** Human label for a week section, e.g. "Jun 15 – Jun 21". */
export function weekRange(n: number): string {
  const start = new Date(WEEK1_START + (n - 1) * 7 * DAY_MS);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return `${MON[start.getUTCMonth()]} ${start.getUTCDate()} – ${MON[end.getUTCMonth()]} ${end.getUTCDate()}`;
}

// The working week is Monday–Thursday. Friday, Saturday and Sunday don't count
// toward turnaround or deadline figures.
// The anchor (1 Jun 2026) is a Monday, so day-of-week is derived from it.

/** Count of working days (Mon–Thu) strictly before `t` since the Monday anchor. */
function workdayIndex(t: number): number {
  const dayOffset = Math.floor((t - WEEK1_START) / DAY_MS);
  const fullWeeks = Math.floor(dayOffset / 7);
  const rem = dayOffset - fullWeeks * 7; // 0 = Mon … 6 = Sun
  return fullWeeks * 4 + Math.min(rem, 4); // Mon–Thu (0–3) count; Fri/Sat/Sun (4–6) don't
}

/**
 * Number of working days (Mon–Thu) between two dates, signed.
 * Counts the interval [start, end): same day = 0, one working day later = 1.
 */
export function workingDaysBetween(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
): number | null {
  const a = toUtcMidnight(start);
  const b = toUtcMidnight(end);
  if (a === null || b === null) return null;
  return workdayIndex(b) - workdayIndex(a);
}

/** Turnaround in working days (Mon–Thu), or null when a date is missing / negative. */
export function turnaround(
  dateAssigned: string | Date | null | undefined,
  dateCompleted: string | Date | null | undefined,
): number | null {
  const d = workingDaysBetween(dateAssigned, dateCompleted);
  return d === null || d < 0 ? null : d;
}

/**
 * Completion vs deadline, in working days (Mon–Thu). Positive = late (finished
 * after the deadline), negative = early, 0 = on time. Null when a date is missing.
 */
export function deadlineVariance(
  deadline: string | Date | null | undefined,
  dateCompleted: string | Date | null | undefined,
): number | null {
  return workingDaysBetween(deadline, dateCompleted);
}

/** Human phrasing for a deadline variance, e.g. "2 days late", "3 days early", "On time". */
export function varianceLabel(v: number | null): string {
  if (v === null) return "—";
  if (v === 0) return "On time";
  const n = Math.abs(v);
  return `${n} day${n === 1 ? "" : "s"} ${v > 0 ? "late" : "early"}`;
}

/** Short display date, e.g. "Jun 15". */
export function shortDate(input: string | Date | null | undefined): string {
  const t = toUtcMidnight(input);
  if (t === null) return "";
  const x = new Date(t);
  return `${MON[x.getUTCMonth()]} ${x.getUTCDate()}`;
}

/** Normalise any date-ish value to YYYY-MM-DD for <input type="date"> and API. */
export function toDateInput(input: string | Date | null | undefined): string {
  if (!input) return "";
  return typeof input === "string" ? input.slice(0, 10) : input.toISOString().slice(0, 10);
}

/** Relative-ish short date for comments, e.g. "15 Jun". */
export function commentDate(input: string | Date | null | undefined): string {
  const t = toUtcMidnight(input);
  if (t === null) return "";
  const x = new Date(t);
  return `${x.getUTCDate()} ${MON[x.getUTCMonth()]}`;
}
