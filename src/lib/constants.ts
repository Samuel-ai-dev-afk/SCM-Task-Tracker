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

export type Role = "manager" | "staff";

// Tailwind-friendly colour tokens for each status pill.
export const STATUS_STYLES: Record<Status, { bg: string; fg: string; label: string }> = {
  "Not Started": { bg: "#EFF1F4", fg: "#5D6A7C", label: "Not Started" },
  "In Progress": { bg: "#FCF0D9", fg: "#8A5D0C", label: "In Progress" },
  "In Review": { bg: "#E4EDF9", fg: "#1E5091", label: "In Review" },
  Completed: { bg: "#E3F1E7", fg: "#2C6B42", label: "Completed" },
  Blocked: { bg: "#FBE6E5", fg: "#A5372E", label: "Blocked" },
};

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export function isPillar(v: unknown): v is Pillar {
  return typeof v === "string" && (PILLARS as readonly string[]).includes(v);
}
