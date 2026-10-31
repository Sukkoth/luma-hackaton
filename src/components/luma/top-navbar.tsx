"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogIn, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSession } from "@/lib/auth-client";

type TopNavbarProps = {
  userName?: string;
};

export function TopNavbar({ userName = "James" }: TopNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const effectiveUserName = session?.user?.name || userName;

  // When unauthenticated, user should not see Overview, Insights, Notes, or Settings
  const NAV_TABS = session
    ? [
        { label: "Overview", href: "/home" },
        { label: "Bible Books", href: "/books" },
        { label: "Plans", href: "/plans" },
        { label: "Insights", href: "/insights" },
        { label: "Notes", href: "/notes" },
      ]
    : [
        { label: "Bible Books", href: "/books" },
        { label: "Plans", href: "/plans" },
      ];

  const brandHref = session ? "/home" : "/";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-3">
      {/* Brand logo */}
      <Link href={brandHref} className="flex items-center gap-1.5 group">
        <span className="text-[22px] font-medium tracking-tight text-black dark:text-white">
          Scripture<span className="text-[#82ADD4]">.</span>
        </span>
        <span className="hidden sm:inline-block rounded-[6px] bg-black/[0.05] dark:bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-[#666666] dark:text-[#A1A1AA]">
          Luma
        </span>
      </Link>

      {/* Center cluster: Frosted Glass Tab Tiles */}
      <nav aria-label="Main Navigation" className="flex items-center gap-2">
        {NAV_TABS.map((tab) => {
          const isActive =
            tab.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(tab.href);

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

      {/* Right controls: Theme Toggle and Auth / Settings button */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session ? (
          <Link
            href="/settings"
            aria-label="Settings"
            className={`flex h-9 w-9 items-center justify-center rounded-[12px] shadow-2xs backdrop-blur-md transition-all ${
              pathname.startsWith("/settings")
                ? "border border-white/90 bg-white text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                : "border border-white/60 bg-white/40 text-black/75 hover:border-white/80 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
            title={`Settings (Signed in as ${effectiveUserName})`}
          >
            <Settings className="h-3.5 w-3.5 stroke-[1.75]" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-[12px] border border-black/[0.08] bg-white/70 px-3.5 py-1.5 text-[12px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[12px] bg-black px-3.5 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
