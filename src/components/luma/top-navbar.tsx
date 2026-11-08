"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  LogIn,
  ArrowRight,
  Zap,
  Shield,
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
      <header className="flex items-center justify-between gap-2 py-3 md:gap-4">
        {/* Left cluster: Tracker Switcher for Authenticated users, Luma brand logo for Guests */}
        <div className="flex items-center min-w-[220px] sm:min-w-[260px] lg:w-80">
          {isAuthenticated && trackers && trackers.length > 0 ? (
            <TrackerSwitcher
              trackers={trackers}
              activeTrackerId={activeTrackerId}
            />
          ) : (
            <Link href="/" className="group flex items-center">
              <span className="text-[22px] font-semibold tracking-tight text-foreground">
                Luma<span className="text-foreground-dim">.</span>
              </span>
            </Link>
          )}
        </div>

        {/* Center cluster: Monochrome Tab Tiles (desktop only) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 rounded-[16px] border border-border bg-surface p-1"
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
                className={`flex items-center justify-center rounded-[12px] px-3.5 py-1 text-[13px] transition-all ${
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

        {/* Right controls: Capsule with Streak, Theme Toggle, Settings/Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface p-1">
              {streak && (
                <button
                  type="button"
                  onClick={() => setIsStreakOpen(true)}
                  aria-label={`Current streak: ${streak.currentStreak} days`}
                  data-testid="streak-navbar-button"
                  className={`flex items-center gap-1 rounded-[14px] px-2.5 py-1 text-[12px] font-medium transition-all cursor-pointer ${
                    streak.currentStreak > 0
                      ? "border border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-surface-elevated text-foreground-dim hover:text-foreground"
                  }`}
                >
                  <Zap className="size-3.5 fill-current" />
                  <span>{streak.currentStreak}</span>
                  {streak.isFreezeUnlocked ? (
                    <span
                      className="ml-0.5 flex items-center gap-0.5 text-[10px] opacity-80"
                      title={`${streak.availableFreezes} freeze shields available`}
                    >
                      <Shield className="size-3" />
                      <span>{streak.availableFreezes}</span>
                    </span>
                  ) : null}
                </button>
              )}
              <ThemeToggle />
              <Link
                href="/settings"
                aria-label="Settings"
                className={`flex size-8 items-center justify-center rounded-full border transition-all ${
                  pathname.startsWith("/settings")
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:text-foreground"
                }`}
                title={`Settings (Signed in as ${effectiveUserName})`}
              >
                <Settings className="size-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="ui-btn-secondary ui-btn-sm gap-1.5"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="ui-btn-primary ui-btn-sm hidden gap-1.5 sm:inline-flex"
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
