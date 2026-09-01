// Canonical domain constants shared by client and server.

export const STATUSES = [
  "Not Started",
  "In Progress",
  "In Review",
  "Completed",
  "Blocked",
] as const;

export type Status = (typeof STATUSES)[number];

// The university's five official strategic pillars — exact wording.
export const PILLARS = [
  "A Transformative Educational Experience",
  "Growing the Impact of Our Research and Creative Work",
  "An Empowering Working Culture",
  "Leveraging Community Engagement and Outreach",
  "Effective Stewardship of Our Resources",
] as const;

export type Pillar = (typeof PILLARS)[number];

// Where a piece of content goes live.
export const CHANNELS = [
  "Instagram",
  "LinkedIn",
  "X / Twitter",
  "Facebook",
  "TikTok",
  "Website",
  "Newsletter",
  "Press release",
  "Print",
  "Internal",
] as const;

export type Channel = (typeof CHANNELS)[number];

// Things a manager can put straight onto the calendar, alongside the tasks
// that already appear there via their publish date.
export const ENTRY_KINDS = ["Meeting", "Event", "Post", "Reminder"] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

// Entries are tinted by kind, where tasks are tinted by status — so the two
// kinds of thing stay tellable apart at a glance on a busy day.
export const ENTRY_STYLES: Record<EntryKind, { bg: string; fg: string }> = {
  Meeting: { bg: "var(--c-info-bg)", fg: "var(--c-info-fg)" },
  Event: { bg: "var(--c-brand-soft)", fg: "var(--c-brand)" },
  Post: { bg: "var(--c-warn-bg)", fg: "var(--c-warn-fg)" },
  Reminder: { bg: "var(--c-quiet-bg)", fg: "var(--c-quiet-fg)" },
};

export type Role = "manager" | "staff";

// Tailwind-friendly colour tokens for each status pill.
export const STATUS_STYLES: Record<Status, { bg: string; fg: string; label: string }> = {
  "Not Started": { bg: "var(--c-quiet-bg)", fg: "var(--c-quiet-fg)", label: "Not Started" },
  "In Progress": { bg: "var(--c-warn-bg)", fg: "var(--c-warn-fg)", label: "In Progress" },
  "In Review": { bg: "var(--c-info-bg)", fg: "var(--c-info-fg)", label: "In Review" },
  Completed: { bg: "var(--c-ok-bg)", fg: "var(--c-ok-fg)", label: "Completed" },
  Blocked: { bg: "var(--c-danger-bg)", fg: "var(--c-danger-fg)", label: "Blocked" },
};

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export function isPillar(v: unknown): v is Pillar {
  return typeof v === "string" && (PILLARS as readonly string[]).includes(v);
}
