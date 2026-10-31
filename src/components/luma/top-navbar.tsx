"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type TopNavbarProps = {
  userName?: string;
};

export function TopNavbar({ userName = "James" }: TopNavbarProps) {
  const pathname = usePathname();

  const NAV_TABS = [
    { label: "Overview", href: "/" },
    { label: "Bible Books", href: "/books" },
    { label: "Plans", href: "/plans" },
    { label: "Insights", href: "/insights" },
    { label: "Notes", href: "/notes" },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-3">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-1">
        <span className="text-[22px] font-medium tracking-tight text-black dark:text-white">
          Scripture.
        </span>
      </Link>

      {/* Center cluster: Frosted Glass Tab Tiles */}
      <nav aria-label="Main Navigation" className="flex items-center gap-2">
        {NAV_TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center justify-center rounded-[14px] px-5 py-2 text-[13px] backdrop-blur-md transition-all ${
                isActive
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/[0.04] dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Right controls: Theme Toggle and Settings button */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/settings"
          aria-label="Settings"
          className={`flex h-9 w-9 items-center justify-center rounded-[12px] shadow-2xs backdrop-blur-md transition-all ${
            pathname.startsWith("/settings")
              ? "border border-white/90 bg-white text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
              : "border border-white/60 bg-white/40 text-black/75 hover:border-white/80 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
          }`}
          title={`Settings (Signed in as ${userName})`}
        >
          <Settings className="h-3.5 w-3.5 stroke-[1.75]" />
        </Link>
      </div>
    </header>
  );
}
