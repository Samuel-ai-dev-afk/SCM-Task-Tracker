// Time logged against tasks is stored as whole minutes. These helpers are the
// only place that converts between minutes and the hours/minutes people type.

/** 380 -> "6h 20m", 60 -> "1h", 45 -> "45m", 0 -> "0m". */
export function formatMinutes(total: number | null | undefined): string {
  if (total == null) return "—";
  const n = Math.max(0, Math.round(total));
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Split stored minutes into the two input boxes. */
export function splitMinutes(total: number | null | undefined): { h: string; m: string } {
  if (total == null) return { h: "", m: "" };
  const n = Math.max(0, Math.round(total));
  return { h: String(Math.floor(n / 60)), m: String(n % 60) };
}

/**
 * Combine the two boxes back into minutes. Returns null when both are blank
 * (meaning "not recorded"), which is different from 0 ("took no time").
 */
export function joinMinutes(h: string, m: string): number | null {
  const hs = h.trim();
  const ms = m.trim();
  if (!hs && !ms) return null;
  const hn = hs ? Number(hs) : 0;
  const mn = ms ? Number(ms) : 0;
  if (!Number.isFinite(hn) || !Number.isFinite(mn) || hn < 0 || mn < 0) {
    throw new Error("Enter time as whole hours and minutes.");
  }
  return Math.round(hn) * 60 + Math.round(mn);
}

/** First and last day of the month containing `d`, as YYYY-MM-DD. */
export function monthRange(d = new Date()): { from: string; to: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
}

/** Same, shifted back by `n` months. */
export function monthRangeOffset(n: number): { from: string; to: string } {
  const now = new Date();
  return monthRange(new Date(now.getFullYear(), now.getMonth() - n, 1));
}
