"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui";
import { DefaultPasswordBanner } from "@/components/ChangePassword";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  IconTasks,
  IconTeam,
  IconAnalytics,
  IconCalendar,
  IconHours,
  IconSettings,
  IconPower,
  IconPanel,
} from "@/components/icons";
import type { Role } from "@/lib/constants";

type Me = { id: string; name: string; email: string; role: Role };

const SIDEBAR_KEY = "scm.sidebar";

export function Shell({ me, children }: { me: Me; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isManager = me.role === "manager";
  const [collapsed, setCollapsed] = useState(false);
  // Bumped when the password changes so the banner re-checks and disappears.
  const [passwordVersion] = useState(0);

  // The boot script already applied the saved state to <html>; read it back so
  // the toggle button shows the right direction.
  useEffect(() => {
    setCollapsed(document.documentElement.getAttribute("data-sidebar") === "collapsed");
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    if (next) document.documentElement.setAttribute("data-sidebar", "collapsed");
    else document.documentElement.removeAttribute("data-sidebar");
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "collapsed" : "open");
    } catch {
      // Storage blocked — the choice just won't survive a reload.
    }
  }

  const nav = [
    { href: "/tasks", label: isManager ? "All tasks" : "My tasks", Icon: IconTasks },
    ...(isManager
      ? [
          { href: "/team", label: "Team", Icon: IconTeam },
          { href: "/analytics", label: "Analytics", Icon: IconAnalytics },
        ]
      : []),
    { href: "/calendar", label: "Calendar", Icon: IconCalendar },
    { href: "/hours", label: "Hours", Icon: IconHours },
    { href: "/settings", label: "Settings", Icon: IconSettings },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-surface">
      {/* Sidebar */}
      <nav className="app-sidebar shrink-0 bg-sidebar text-white flex md:flex-col flex-row items-center md:items-stretch">
        <div className="sidebar-brand px-[18px] py-[14px] md:border-b border-white/10 shrink-0 border-r md:border-r-0 border-white/10 flex items-center gap-2.5">
          {/*
            The university's mark. Drop the file in at public/aus-logo.png and it
            appears; until then it hides itself rather than showing a broken
            image, so the header still looks finished.
          */}
          <img
            src="/aus-logo.png"
            alt=""
            width={28}
            height={28}
            className="shrink-0 object-contain h-7 w-7"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="sidebar-label min-w-0">
            <span className="font-serif font-semibold text-[19px] leading-none block">SCM</span>
            <span className="hidden md:block font-mono text-[10px] tracking-[0.09em] uppercase text-white/55 mt-1">
              Task Tracker
            </span>
          </span>
        </div>

        <div className="flex md:flex-col flex-row md:p-2.5 px-1.5 md:flex-1 gap-0.5 overflow-x-auto">
          {nav.map((n) => {
            const on = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                className={
                  "sidebar-row flex items-center gap-2.5 md:w-full px-2.5 py-2.5 rounded-lg text-[13.5px] whitespace-nowrap transition-colors " +
                  (on
                    ? "bg-white/12 text-white font-semibold md:shadow-[inset_2px_0_0_var(--c-brand-line)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white font-medium")
                }
              >
                <n.Icon size={17} className={on ? "opacity-100" : "opacity-70"} />
                <span className="sidebar-label">{n.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Collapse control — desktop only, since the mobile bar is horizontal. */}
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
          aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
          aria-pressed={collapsed}
          className="sidebar-row hidden md:flex items-center gap-2.5 mx-2.5 mb-1 px-2.5 py-2 rounded-lg text-white/55 hover:text-white hover:bg-white/10 text-[12.5px]"
        >
          <IconPanel size={16} />
          <span className="sidebar-label">Collapse</span>
        </button>

        <div className="sidebar-footer md:border-t border-white/10 px-3.5 py-3 flex items-center gap-2.5 shrink-0">
          <Avatar name={me.name} size={30} />
          <div className="sidebar-label hidden md:block flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold truncate">{me.name}</div>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-white/55">
              {isManager ? "Manager" : "Staff"}
            </div>
          </div>
          <span className="flex items-center gap-1">
            <ThemeToggle className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-1.5 leading-none" />
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              title="Sign out"
              aria-label="Sign out"
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-1.5 leading-none"
            >
              <IconPower size={16} />
            </button>
          </span>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col md:h-screen md:overflow-hidden">
        <DefaultPasswordBanner key={passwordVersion} onOpen={() => router.push("/settings")} />
        {children}
      </main>
    </div>
  );
}
