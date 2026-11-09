"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  LogIn,
  ArrowRight,
  Zap,
  Home,
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
} from "lucide-react";
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
        { label: "Overview", href: "/home", icon: Home },
        { label: "Books", href: "/books", icon: BookOpen },
        { label: "Plans", href: "/plans", icon: Calendar },
        { label: "Insights", href: "/insights", icon: TrendingUp },
        { label: "Notes", href: "/notes", icon: FileText },
      ]
    : [
        { label: "Books", href: "/books", icon: BookOpen },
        { label: "Plans", href: "/plans", icon: Calendar },
      ];

  return (
    <>
      <header className="flex items-center justify-between gap-2 py-3 md:gap-4 lg:py-4 xl:grid xl:grid-cols-12 xl:gap-3">
        {/* Left cluster: Tracker Switcher for Authenticated users, Luma brand logo for Guests */}
        <div className="flex items-center min-w-[220px] sm:min-w-[260px] xl:col-span-3 w-full">
          {isAuthenticated && trackers && trackers.length > 0 ? (
            <TrackerSwitcher
              trackers={trackers}
              activeTrackerId={activeTrackerId}
            />
          ) : (
            <Link href="/" className="group flex items-center">
              <span className="text-[22px] lg:text-[24px] font-semibold tracking-tight text-foreground">
                Luma<span className="text-foreground-dim">.</span>
              </span>
            </Link>
          )}
        </div>

        {/* Center cluster: Monochrome Tab Tiles (desktop only) */}
        <div className="hidden md:flex xl:col-span-6 justify-center items-center">
          <nav
            aria-label="Main Navigation"
            className="flex items-center gap-1 lg:gap-1.5 rounded-[16px] lg:rounded-[20px] border border-border bg-surface p-1 lg:p-1.5"
          >
            {NAV_TABS.map((tab) => {
              const isActive =
                tab.href === "/home"
                  ? pathname === "/home"
                  : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`flex items-center justify-center rounded-[12px] lg:rounded-[15px] px-3.5 py-1.5 lg:px-5.5 lg:py-2 text-[13px] lg:text-[14px] transition-all ${
                    isActive
                      ? "bg-primary font-medium text-primary-foreground shadow-xs"
                      : "bg-transparent font-normal text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right controls: Capsule with Streak, Theme Toggle, Settings/Auth */}
        <div className="flex items-center justify-end xl:col-span-3 gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 lg:gap-2 rounded-full border border-border bg-surface p-1 lg:p-1.5">
              {streak && (
                <button
                  type="button"
                  onClick={() => setIsStreakOpen(true)}
                  aria-label={`Current streak: ${streak.currentStreak} days`}
                  data-testid="streak-navbar-button"
                  className={`flex items-center gap-1 lg:gap-1.5 rounded-[14px] lg:rounded-[18px] px-2.5 py-1 lg:px-4 lg:py-2 text-[12px] lg:text-[13.5px] font-medium transition-all cursor-pointer ${
                    streak.currentStreak > 0
                      ? "border border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-surface-elevated text-foreground-dim hover:text-foreground"
                  }`}
                >
                  <Zap className="size-3.5 lg:size-4 fill-current" />
                  <span>{streak.currentStreak}</span>
                </button>
              )}
              <ThemeToggle />
              <Link
                href="/settings"
                aria-label="Settings"
                className={`flex size-8 lg:size-9.5 items-center justify-center rounded-full border transition-all ${
                  pathname.startsWith("/settings")
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:text-foreground"
                }`}
                title={`Settings (Signed in as ${effectiveUserName})`}
              >
                <Settings className="size-3.5 lg:size-4" strokeWidth={1.75} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 lg:gap-2.5">
              <ThemeToggle />
              <Link
                href="/login"
                className="ui-btn-secondary ui-btn-sm lg:h-10 lg:px-4.5 gap-1.5 text-[13px] lg:text-[14px]"
              >
                <LogIn className="size-3.5 lg:size-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="ui-btn-primary ui-btn-sm lg:h-10 lg:px-4.5 hidden gap-1.5 sm:inline-flex text-[13px] lg:text-[14px]"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3.5 lg:size-4" />
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

      {/* Mobile Bottom Navigation Bar (Visible on mobile phone, hidden on md+) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-border bg-surface/95 px-2 py-2 backdrop-blur-xl md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {NAV_TABS.map((tab) => {
          const isActive =
            tab.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-all ${
                isActive
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground-dim hover:text-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="mt-1 text-[11px] tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
