"use client";

import { useState } from "react";
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
} from "@/components/icons";
import type { Role } from "@/lib/constants";

type Me = { id: string; name: string; email: string; role: Role };

export function Shell({ me, children }: { me: Me; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isManager = me.role === "manager";
  // Bumped when the password changes so the banner re-checks and disappears.
  const [passwordVersion] = useState(0);

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
      <nav className="md:w-[210px] shrink-0 bg-sidebar text-white flex md:flex-col flex-row items-center md:items-stretch">
        <div className="px-[18px] py-[17px] md:border-b border-white/10 shrink-0 border-r md:border-r-0 border-white/10">
          <span className="font-serif font-bold text-[19px] leading-none block">SCM</span>
          <span className="hidden md:block font-mono text-[10px] tracking-[0.11em] uppercase text-white/55 mt-1.5">
            Task Tracker
          </span>
        </div>

        <div className="flex md:flex-col flex-row md:p-2.5 px-1.5 md:flex-1 gap-0.5 overflow-x-auto">
          {nav.map((n) => {
            const on = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  "flex items-center gap-2.5 md:w-full px-2.5 py-2.5 rounded-lg text-[13.5px] whitespace-nowrap transition " +
                  (on
                    ? "bg-white/12 text-white font-semibold md:shadow-[inset_2px_0_0_var(--c-brand-line)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white font-medium")
                }
              >
                <n.Icon size={17} className={on ? "opacity-100" : "opacity-70"} />
                {n.label}
              </Link>
            );
          })}
        </div>

        <div className="md:border-t border-white/10 px-3.5 py-3 flex items-center gap-2.5 shrink-0">
          <Avatar name={me.name} size={30} />
          <div className="hidden md:block flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold truncate">{me.name}</div>
            <div className="font-mono text-[10px] tracking-[0.09em] uppercase text-white/55">
              {isManager ? "Manager" : "Staff"}
            </div>
          </div>
          <ThemeToggle className="text-white/60 hover:text-white hover:bg-white/10 rounded p-1.5 leading-none" />
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            title="Sign out"
            className="text-white/60 hover:text-white hover:bg-white/10 rounded p-1.5 text-[15px] leading-none"
          >
            ⏻
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col md:h-screen md:overflow-hidden">
        <DefaultPasswordBanner
          key={passwordVersion}
          onOpen={() => router.push("/settings")}
        />
        {children}
      </main>
    </div>
  );
}
