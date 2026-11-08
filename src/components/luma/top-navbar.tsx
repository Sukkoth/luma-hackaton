"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  LogIn,
  ArrowRight,
  Flame,
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

  const brandHref = isAuthenticated ? "/home" : "/";

  return (
    <>
      <header className="flex items-center justify-between gap-2 py-3 md:gap-4">
        {/* Brand logo & Tracker Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 lg:w-95 lg:justify-center">
          <Link href={brandHref} className="group flex items-center">
            <span className="text-[22px] font-semibold tracking-tight text-foreground">
              Luma<span className="text-foreground-dim">.</span>
            </span>
          </Link>

          {trackers && trackers.length > 0 && (
            <>
              <div className="h-4 w-px bg-border" aria-hidden="true" />
              <TrackerSwitcher
                trackers={trackers}
                activeTrackerId={activeTrackerId}
              />
            </>
          )}
        </div>

        {/* Center cluster: Monochrome Tab Tiles (desktop only) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1.5"
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
                className={`flex items-center justify-center rounded-xl px-4 py-1.5 text-[13px] transition-all ${
                  isActive
                    ? "bg-primary font-medium text-primary-foreground shadow-xs"
                    : "border border-border bg-surface-elevated font-normal text-foreground-secondary hover:border-border-strong hover:bg-surface hover:text-foreground"
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
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-all ${
                streak.isTodayCompleted
                  ? "border-primary-border bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <Flame
                className={`size-3.5 ${
                  streak.isTodayCompleted
                    ? "fill-current text-primary-foreground"
                    : "text-foreground-secondary"
                }`}
              />
              <span className="font-semibold">{streak.currentStreak}</span>
              {streak.isFreezeUnlocked ? (
                <span
                  className="flex items-center gap-0.5 text-[10px] text-foreground-dim"
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
              className={`flex size-9 items-center justify-center rounded-xl transition-all ${
                pathname.startsWith("/settings")
                  ? "border border-primary-border bg-primary text-primary-foreground"
                  : "border border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:bg-surface hover:text-foreground"
              }`}
              title={`Settings (Signed in as ${effectiveUserName})`}
            >
              <Settings className="size-3.5" strokeWidth={1.75} />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="ui-btn-secondary px-3.5 py-1.5 text-[12px] gap-1.5"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="ui-btn-primary hidden px-3.5 py-1.5 text-[12px] gap-1.5 sm:inline-flex"
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
        className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-border bg-surface/90 px-2 py-1.5 shadow-lg backdrop-blur-xl md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <div
                className={`flex size-8 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-muted text-foreground"
                    : "text-foreground-dim"
                }`}
              >
                <Icon className="size-4.5" strokeWidth={isActive ? 2.2 : 1.8} />
              </div>
              <span className="mt-0.5 text-[10.5px] tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
