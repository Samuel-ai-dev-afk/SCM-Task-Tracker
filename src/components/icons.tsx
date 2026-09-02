/*
  Inline SVG icons, drawn in the Lucide idiom: 24×24 viewBox, 1.75 stroke,
  round caps and joins, no fill. They replace the Unicode geometric characters
  the sidebar used to use (▤ ◍ ▦ ▢ ◷ ⚙), which rendered differently on every
  machine and font, and read as placeholder rather than design.

  currentColor throughout, so a single text-* class controls them.
*/

type IconProps = { size?: number; className?: string };

function Svg({ size = 18, className = "", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** All tasks / My tasks — a checklist. */
export function IconTasks(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </Svg>
  );
}

/** Team — people. */
export function IconTeam(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 19v-1a4 4 0 0 0-3-3.87M16.5 4.2a4 4 0 0 1 0 5.6" />
    </Svg>
  );
}

/** Analytics — bars. */
export function IconAnalytics(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 21h18" />
      <rect x="5" y="11" width="3.5" height="7" rx="1" />
      <rect x="10.25" y="6" width="3.5" height="12" rx="1" />
      <rect x="15.5" y="14" width="3.5" height="4" rx="1" />
    </Svg>
  );
}

/** Calendar. */
export function IconCalendar(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

/** Hours — a clock. */
export function IconHours(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

/** Settings — a gear. */
export function IconSettings(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.11a1.6 1.6 0 0 0-1.05-1.47 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.11a1.6 1.6 0 0 0 1.47-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.11a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.11a1.6 1.6 0 0 0-1.47 1z" />
    </Svg>
  );
}

/** Sign out. */
export function IconPower(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v9" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </Svg>
  );
}

export function IconSun(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export function IconChevronLeft(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

/** Empty calendar month. */
export function IconCalendarEmpty(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M9.5 16h5" />
    </Svg>
  );
}

/** Collapse / expand the sidebar. */
export function IconPanel(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9 4v16" />
    </Svg>
  );
}
