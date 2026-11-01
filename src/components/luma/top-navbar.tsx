"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LogIn, ArrowRight, Flame, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useSession } from "@/lib/auth-client";
import {
  StreakDetailModal,
  type StreakData,
} from "@/components/streak/streak-detail-modal";
import { TrackerSwitcher } from "@/components/trackers/tracker-switcher";
import type { UserTrackerSummary } from "@/actions/trackers";

type TopNavbarProps = {
  userName?: string;
  streak?: StreakData;
  trackers?: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string | null;
};

export function TopNavbar({
  userName = "James",
  streak,
  trackers,
  activeTrackerId,
}: TopNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const effectiveUserName = session?.user?.name || userName;
  const isAuthenticated = !!session || (!!trackers && trackers.length > 0);

  // When unauthenticated, user should not see Overview, Insights, Notes, or Settings
  const NAV_TABS = isAuthenticated
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

  const brandHref = isAuthenticated ? "/home" : "/";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-3">
      {/* Brand logo & Tracker Switcher - centered in relation to the blue overview card (lg:w-95) */}
      <div className="flex items-center gap-3 lg:w-95 lg:justify-center">
        <Link href={brandHref} className="group flex items-center">
          <span className="text-[22px] font-semibold tracking-tight text-black dark:text-white">
            Luma<span className="text-[#82ADD4]">.</span>
          </span>
        </Link>

        {trackers && trackers.length > 0 && (
          <>
            <div
              className="h-4 w-px bg-black/10 dark:bg-white/10"
              aria-hidden="true"
            />
            <TrackerSwitcher
              trackers={trackers}
              activeTrackerId={activeTrackerId}
            />
          </>
        )}
      </div>

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
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Right controls: Streak button, Theme Toggle, and Auth / Settings button */}
      <div className="flex items-center gap-2">
        {isAuthenticated && streak && (
          <button
            type="button"
            onClick={() => setIsStreakOpen(true)}
            aria-label={`Current streak: ${streak.currentStreak} days`}
            data-testid="streak-navbar-button"
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-medium shadow-2xs backdrop-blur-md transition-all ${
              streak.isTodayCompleted
                ? "border-[#b5d31f]/50 bg-[#DDFD2C]/25 text-black hover:bg-[#DDFD2C]/35 dark:border-[#DDFD2C]/30 dark:bg-[#DDFD2C]/15 dark:text-[#DDFD2C]"
                : "border-black/10 bg-white/40 text-black/75 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            }`}
          >
            <Flame
              className={`size-3.5 ${
                streak.isTodayCompleted
                  ? "fill-[#9db814] text-[#8aa30f] dark:fill-[#DDFD2C] dark:text-[#DDFD2C]"
                  : "text-[#8aa30f] dark:text-[#DDFD2C]"
              }`}
            />
            <span className="font-semibold">{streak.currentStreak}</span>
            {streak.isFreezeUnlocked ? (
              <span
                className="flex items-center gap-0.5 text-[10px] text-[#507ea6] dark:text-[#82ADD4]"
                title={`${streak.availableFreezes} freeze shields available`}
              >
                <Shield className="size-3" />
                <span>{streak.availableFreezes}</span>
              </span>
            ) : null}
          </button>
        )}
        <ThemeToggle />
        {isAuthenticated ? (
          <Link
            href="/settings"
            aria-label="Settings"
            className={`flex size-9 items-center justify-center rounded-xl shadow-2xs backdrop-blur-md transition-all ${
              pathname.startsWith("/settings")
                ? "border border-white/90 bg-white text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                : "border border-white/60 bg-white/40 text-black/75 hover:border-white/80 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
            title={`Settings (Signed in as ${effectiveUserName})`}
          >
            <Settings className="size-3.5" strokeWidth={1.75} />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-black/8 bg-white/70 px-3.5 py-1.5 text-[12px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/8"
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup"
              className="hidden items-center gap-1.5 rounded-xl bg-black px-3.5 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 sm:inline-flex dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <span>Get Started</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>

      {streak && (
        <StreakDetailModal
          isOpen={isStreakOpen}
          onCloseAction={() => setIsStreakOpen(false)}
          streak={streak}
        />
      )}
    </header>
  );
}
