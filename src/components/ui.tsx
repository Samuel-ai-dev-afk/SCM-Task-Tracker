import { STATUS_STYLES, type Status } from "@/lib/constants";

const AV = ["#8B1E2D", "#3D5A80", "#8C5E3C", "#4A6B52", "#7A4A6B", "#2F6B6B", "#5A4E8C"];

export function avatarColor(name: string): string {
  const sum = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AV[sum % AV.length];
}

export function initials(name: string): string {
  const parts = String(name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full font-mono font-semibold text-white shrink-0"
      style={{
        background: avatarColor(name),
        width: size,
        height: size,
        fontSize: size < 28 ? 9 : 11,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["Not Started"];
  return (
    <span
      className="inline-block font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}
