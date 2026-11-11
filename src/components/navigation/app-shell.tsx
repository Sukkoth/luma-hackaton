"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  LogIn,
  ArrowRight,
  Zap,
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
  LayoutDashboard,
  Bell,
  LogOut,
  Loader2,
  BookmarkCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { authClient, useSession } from "@/lib/auth-client";
import {
  StreakDetailModal,
  type StreakData,
} from "@/components/streak/streak-detail-modal";
import { TrackerSwitcher } from "@/components/trackers/tracker-switcher";
import type { UserTrackerSummary } from "@/actions/trackers";

export type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  userImage?: string;
  streak?: StreakData;
  trackers?: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string | null;
  className?: string;
};

const MENU_ITEMS = [
  { label: "Overview", href: "/home", icon: LayoutDashboard },
  { label: "Books", href: "/books", icon: BookOpen },
  { label: "Plans", href: "/plans", icon: Calendar },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Insights", href: "/insights", icon: TrendingUp },
] as const;

export function AppShell({
  children,
  userName = "Reader",
  userEmail = "reader@luma.study",
  userImage,
  streak,
  trackers,
  activeTrackerId,
  className = "",
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasDismissedNotification, setHasDismissedNotification] =
    useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);

  const effectiveUserName = session?.user?.name || userName;
  const effectiveUserEmail = session?.user?.email || userEmail;
  const effectiveUserImage = session?.user?.image || userImage;

  const isAuthenticated = !!session || (!!trackers && trackers.length > 0);
  const activeTracker =
    trackers?.find((t) => t.id === activeTrackerId) || trackers?.[0];

  const initials = effectiveUserName
    ? effectiveUserName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Derive page title for desktop top bar header
  let viewTitle = "Overview";
  if (pathname.startsWith("/books")) {
    viewTitle = "Bible Books";
  } else if (pathname.startsWith("/plans")) {
    viewTitle = "Reading Plans";
  } else if (pathname.startsWith("/notes")) {
    viewTitle = "Study Notes";
  } else if (pathname.startsWith("/insights")) {
    viewTitle = "Analytics & Insights";
  } else if (pathname.startsWith("/settings")) {
    viewTitle = "Settings & Preferences";
  }

  // Handle outside click for notifications popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
            router.refresh();
          },
        },
      });
    } catch {
      setIsSigningOut(false);
    }
  };

  // Unauthenticated / Guest View: Clean Top Header without Sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md px-4 py-3 sm:px-6 md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link href="/" className="group flex items-center">
              <span className="text-[22px] font-semibold tracking-tight text-foreground">
                Luma<span className="text-foreground-dim">.</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1 rounded-[16px] border border-border bg-surface p-1">
              <Link
                href="/books"
                className={`flex items-center gap-2 rounded-[12px] px-3.5 py-1.5 text-[13px] transition-all ${
                  pathname.startsWith("/books")
                    ? "bg-primary font-medium text-primary-foreground shadow-xs"
                    : "text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>Books</span>
              </Link>
              <Link
                href="/plans"
                className={`flex items-center gap-2 rounded-[12px] px-3.5 py-1.5 text-[13px] transition-all ${
                  pathname.startsWith("/plans")
                    ? "bg-primary font-medium text-primary-foreground shadow-xs"
                    : "text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <Calendar className="size-3.5" />
                <span>Plans</span>
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="ui-btn-secondary ui-btn-sm gap-1.5 text-[13px]"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="ui-btn-primary ui-btn-sm hidden sm:inline-flex gap-1.5 text-[13px]"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8">
          {children}
        </main>
      </div>
    );
  }

  // Authenticated View: Desktop Sidebar (>1024px) + Desktop Top Bar + Mobile Shell (<1024px)
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* =========================================================================
          DESKTOP SIDEBAR (> 1024px / lg:)
          ========================================================================= */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-80 flex-col justify-between border-r border-border bg-surface p-4 z-40 select-none overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-4">
          {/* Brand header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/home" className="flex items-center gap-2 group">
              <span className="text-[22px] font-semibold tracking-tight text-foreground">
                Luma<span className="text-foreground-dim">.</span>
              </span>
              <span className="ui-pill text-[10px] font-medium tracking-wider uppercase">
                Studio
              </span>
            </Link>
          </div>

          {/* Multi-Tenant Tracker Switcher on Top */}
          {trackers && trackers.length > 0 && (
            <div className="w-full">
              <TrackerSwitcher
                trackers={trackers}
                activeTrackerId={activeTrackerId}
                variant="tenant"
              />
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-border-subtle my-0.5" />

          {/* Section 1: MENU */}
          <div className="flex flex-col gap-1.5">
            <span className="px-3 text-[10.5px] font-bold tracking-wider text-foreground-dim uppercase">
              Menu
            </span>
            <nav
              aria-label="Main Navigation"
              className="flex flex-col gap-1 mt-0.5"
            >
              {MENU_ITEMS.map((tab) => {
                const isActive =
                  tab.href === "/home"
                    ? pathname === "/home"
                    : pathname.startsWith(tab.href);
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13.5px] transition-all ${
                      isActive
                        ? "bg-primary font-medium text-primary-foreground shadow-xs"
                        : "text-foreground-secondary hover:bg-surface-elevated hover:text-foreground font-normal"
                    }`}
                  >
                    <Icon
                      className="size-4.5 shrink-0"
                      strokeWidth={isActive ? 2.2 : 1.75}
                    />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section 2: GENERAL */}
          <div className="flex flex-col gap-1.5">
            <span className="px-3 text-[10.5px] font-bold tracking-wider text-foreground-dim uppercase">
              General
            </span>
            <div className="flex flex-col gap-1 mt-0.5">
              {/* Settings link on Desktop */}
              <Link
                href="/settings"
                className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13.5px] transition-all ${
                  pathname.startsWith("/settings")
                    ? "bg-primary font-medium text-primary-foreground shadow-xs"
                    : "text-foreground-secondary hover:bg-surface-elevated hover:text-foreground font-normal"
                }`}
              >
                <Settings
                  className="size-4.5 shrink-0"
                  strokeWidth={pathname.startsWith("/settings") ? 2.2 : 1.75}
                />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Dedicated Logout Action */}
        <div className="mt-auto pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            aria-label="Log out of session"
            className="group flex w-full items-center justify-between gap-2.5 rounded-[16px] border border-border bg-surface-elevated/70 p-2 text-foreground transition-all hover:bg-surface-elevated hover:border-destructive/30 hover:text-destructive active:scale-[0.98] cursor-pointer disabled:opacity-50 text-left focus:outline-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex size-8.5 shrink-0 items-center justify-center rounded-[11px] bg-surface border border-border text-foreground-dim transition-colors group-hover:text-destructive group-hover:border-destructive/30 shadow-2xs">
                {isSigningOut ? (
                  <Loader2 className="size-4 animate-spin text-destructive" />
                ) : (
                  <LogOut className="size-4 transition-transform group-hover:-translate-x-0.5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[13px] font-semibold text-foreground group-hover:text-destructive transition-colors leading-tight">
                  {isSigningOut ? "Signing out..." : "Log Out"}
                </span>
                <span className="truncate text-[10.5px] font-medium text-foreground-dim leading-tight mt-0.5">
                  End current session
                </span>
              </div>
            </div>
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md text-foreground-dim opacity-40 transition-all group-hover:opacity-100 group-hover:text-destructive group-hover:translate-x-0.5">
              <ArrowRight className="size-3.5" />
            </div>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE & TABLET TOP HEADER (< 1024px / lg:hidden) - STRICTLY UNCHANGED
          ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {trackers && trackers.length > 0 ? (
            <TrackerSwitcher
              trackers={trackers}
              activeTrackerId={activeTrackerId}
              variant="default"
            />
          ) : (
            <Link
              href="/home"
              className="text-[20px] font-semibold text-foreground"
            >
              Luma<span className="text-foreground-dim">.</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {streak && (
            <button
              type="button"
              onClick={() => setIsStreakOpen(true)}
              aria-label={`Current streak: ${streak.currentStreak} days`}
              className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[12px] font-medium text-foreground hover:border-border-strong transition-all cursor-pointer"
            >
              <Zap className="size-3.5 fill-foreground text-foreground" />
              <span>{streak.currentStreak}</span>
            </button>
          )}
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-elevated text-foreground-secondary hover:text-foreground transition-all"
          >
            <Settings className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* =========================================================================
          DESKTOP TOP BAR & WORKSPACE VIEWPORT (>= 1024px)
          ========================================================================= */}
      <div className="lg:pl-80 flex flex-col h-screen min-h-screen lg:overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 border-b border-border bg-surface/90 backdrop-blur-md px-6 sm:px-8 items-center justify-between select-none">
          {/* Left: View title only */}
          <div className="flex items-center">
            <h1 className="text-[18px] font-bold text-foreground tracking-tight">
              {viewTitle}
            </h1>
          </div>

          {/* Right: Streak, Theme Toggle, Notifications, User Pic + Name & Email */}
          <div className="flex items-center gap-3">
            {/* Streak counter button */}
            {streak && (
              <button
                type="button"
                onClick={() => setIsStreakOpen(true)}
                aria-label={`Current streak: ${streak.currentStreak} days`}
                data-testid="topbar-streak-button"
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1.5 text-[12.5px] font-medium text-foreground hover:border-border-strong hover:bg-surface transition-all cursor-pointer shadow-xs"
              >
                <Zap className="size-3.5 fill-foreground text-foreground" />
                <span className="font-semibold tabular-nums">
                  {streak.currentStreak}
                </span>
              </button>
            )}

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications Bell Button */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label="Notifications"
                className="relative flex size-9 items-center justify-center rounded-full border border-border bg-surface-elevated text-foreground-secondary hover:text-foreground hover:border-border-strong transition-all cursor-pointer shadow-xs"
              >
                <Bell className="size-4" />
                {!hasDismissedNotification && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-surface" />
                )}
              </button>

              {/* Notifications Popover */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-[20px] border border-border bg-surface p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
                    <span className="text-[12px] font-semibold text-foreground uppercase tracking-wider">
                      Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasDismissedNotification(true)}
                      className="text-[11px] text-foreground-dim hover:text-foreground cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 rounded-[12px] p-2 bg-surface-elevated/70">
                      <Zap className="size-4 fill-foreground text-foreground shrink-0 mt-0.5" />
                      <div className="flex flex-col text-left text-[12px]">
                        <span className="font-semibold text-foreground">
                          Streak on Track!
                        </span>
                        <span className="text-foreground-secondary text-[11px]">
                          {streak
                            ? `You're on a ${streak.currentStreak}-day reading streak.`
                            : "Keep reading daily to build your streak."}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-[12px] p-2 bg-surface-elevated/70">
                      <BookmarkCheck className="size-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex flex-col text-left text-[12px]">
                        <span className="font-semibold text-foreground">
                          Active Tracker
                        </span>
                        <span className="text-foreground-secondary text-[11px]">
                          {activeTracker
                            ? `"${activeTracker.name}" is set as your default tracker.`
                            : "Create your first tracker to monitor progress."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border mx-0.5" />

            {/* User Profile (Pic + Name + Email) */}
            <Link
              href="/settings"
              className="flex items-center gap-3 pl-1.5 group transition-opacity hover:opacity-90"
              title="Settings & Profile"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated border border-border text-[12.5px] font-semibold text-foreground group-hover:border-border-strong transition-colors overflow-hidden shadow-xs">
                {effectiveUserImage ? (
                  <Image
                    src={effectiveUserImage}
                    alt={effectiveUserName}
                    width={36}
                    height={36}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[13px] font-semibold text-foreground leading-tight group-hover:underline">
                  {effectiveUserName}
                </span>
                <span className="text-[11.5px] text-foreground-dim leading-tight">
                  {effectiveUserEmail}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content Viewport */}
        <div
          className={`flex-1 min-h-0 flex flex-col overflow-y-auto pb-20 lg:pb-3 ${className}`}
        >
          {children}
        </div>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (< 1024px / lg:hidden) - STRICTLY UNCHANGED
          ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around"
      >
        {MENU_ITEMS.map((tab) => {
          const isActive =
            tab.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10.5px] transition-colors ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-foreground-dim hover:text-foreground font-normal"
              }`}
            >
              <Icon className="size-4.5" strokeWidth={isActive ? 2.2 : 1.75} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Streak Details Modal */}
      {streak && (
        <StreakDetailModal
          isOpen={isStreakOpen}
          onCloseAction={() => setIsStreakOpen(false)}
          streak={streak}
        />
      )}
    </div>
  );
}
