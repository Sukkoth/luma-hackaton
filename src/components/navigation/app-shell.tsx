"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  LogIn,
  ArrowRight,
  Flame,
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
  LayoutDashboard,
  LogOut,
  Loader2,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { authClient, useSession } from "@/lib/auth-client";
import {
  StreakDetailModal,
  type StreakData,
} from "@/components/streak/streak-detail-modal";
import { TrackerSwitcher } from "@/components/trackers/tracker-switcher";
import { LogoutConfirmModal } from "@/components/auth/logout-confirm-modal";
import { Avatar } from "@/components/ui/avatar";
import { LumaIcon } from "@/components/ui/luma-icon";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type { UserTrackerSummary } from "@/actions/trackers";
import { cn } from "@/lib/utils";

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
  { label: "Home", href: "/home", icon: LayoutDashboard },
  { label: "Books", href: "/books", icon: BookOpen },
  { label: "Plans", href: "/plans", icon: Calendar },
  { label: "Groups", href: "/groups", icon: Users },
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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const effectiveUserName = session?.user?.name || userName;
  const effectiveUserEmail = session?.user?.email || userEmail;
  const effectiveUserImage = session?.user?.image || userImage;

  const isAuthenticated = !!session || (!!trackers && trackers.length > 0);

  const initials = effectiveUserName
    ? effectiveUserName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "R";

  // Derive page title for desktop top bar header
  let viewTitle = "Reading Hub";
  if (pathname.startsWith("/books")) {
    viewTitle = "Bible Books & Chapters";
  } else if (pathname.startsWith("/plans")) {
    viewTitle = "Reading Plans";
  } else if (pathname.startsWith("/groups")) {
    viewTitle = "Community & Cohorts";
  } else if (pathname.startsWith("/notes")) {
    viewTitle = "Study Journal";
  } else if (pathname.startsWith("/insights")) {
    viewTitle = "Reading Insights & Analytics";
  } else if (pathname.startsWith("/settings")) {
    viewTitle = "Preferences & Settings";
  }

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

  const handleOpenLogoutModal = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Unfocus immediately so the button does not retain focus
    e.currentTarget.blur();
    // Guard against untrusted or synthetic events (e.g. keyboard Space while scrolling)
    if (!e.isTrusted) return;
    if (e.detail === 0 && e.clientX === 0 && e.clientY === 0) return;
    setIsLogoutModalOpen(true);
  };

  // Unauthenticated / Guest View: Clean Top Header
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md px-4 py-3 sm:px-6 md:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#0c0a09] text-primary border border-border/80 shadow-2xs">
                <LumaIcon className="size-4.5 text-primary" />
              </span>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Luma
              </span>
            </Link>

            <nav className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              <Link
                href="/books"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all",
                  pathname.startsWith("/books")
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <BookOpen className="size-3.5" />
                <span>Books</span>
              </Link>
              <Link
                href="/plans"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all",
                  pathname.startsWith("/plans")
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Calendar className="size-3.5" />
                <span>Plans</span>
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted transition-all"
              >
                <LogIn className="mr-1.5 size-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-2xs transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 md:px-8">
          {children}
        </main>
      </div>
    );
  }

  // Authenticated View
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* =========================================================================
          DESKTOP SIDEBAR (>= 1024px / lg:flex)
          ========================================================================= */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col justify-between border-r border-border/80 bg-card p-4.5 z-40 select-none overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Brand */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/home" className="flex items-center gap-2.5 group">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#0c0a09] text-primary border border-border/80 transition-transform group-hover:scale-105 shadow-2xs">
                <LumaIcon className="size-5.5 text-primary" />
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground leading-none">
                  Luma
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Bible Study & Tracker
                </span>
              </div>
            </Link>
          </div>

          {/* Multi-Tenant Tracker Switcher */}
          {trackers && trackers.length > 0 && (
            <div className="w-full">
              <TrackerSwitcher
                trackers={trackers}
                activeTrackerId={activeTrackerId}
                variant="tenant"
              />
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5">
            <span className="px-3 text-[11px] font-semibold text-muted-foreground">
              Navigation
            </span>
            <nav aria-label="Main Navigation" className="flex flex-col gap-1">
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
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className="size-4.5 shrink-0"
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* General Section */}
          <div className="flex flex-col gap-1.5">
            <span className="px-3 text-[11px] font-semibold text-muted-foreground">
              Account
            </span>
            <div className="flex flex-col gap-1">
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  pathname.startsWith("/settings")
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Settings
                  className="size-4.5 shrink-0"
                  strokeWidth={pathname.startsWith("/settings") ? 2.25 : 1.75}
                />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Log Out */}
        <div className="mt-auto pt-4 border-t border-border/80">
          <button
            type="button"
            tabIndex={-1}
            onClick={handleOpenLogoutModal}
            onKeyDown={(e) => {
              if (e.key === " " || e.code === "Space") {
                e.preventDefault();
              }
            }}
            disabled={isSigningOut}
            aria-label="Log out of session"
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-xs font-semibold text-secondary-foreground border border-border/40 hover:bg-secondary/80 active:scale-[0.98] transition-all cursor-pointer shadow-2xs disabled:opacity-50 focus:outline-none"
          >
            <div className="flex items-center gap-2">
              {isSigningOut ? (
                <Loader2 className="size-4 animate-spin text-destructive" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
            </div>
            <ArrowRight className="size-3.5 opacity-50" />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP APP BAR (< 1024px / lg:hidden)
          ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3">
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
              className="flex items-center gap-2 text-lg font-bold text-foreground"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-[#0c0a09] text-primary border border-border/80 shadow-2xs">
                <LumaIcon className="size-4 text-primary" />
              </span>
              <span>Luma</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {streak && (
            <button
              type="button"
              onClick={() => setIsStreakOpen(true)}
              aria-label={`Current streak: ${streak.currentStreak} days`}
              data-testid="mobile-streak-button"
              className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-transform duration-200 active:scale-95 cursor-pointer hover:opacity-90"
            >
              <Flame className="size-3.5 fill-current" />
              <span className="tabular-nums">{streak.currentStreak}</span>
            </button>
          )}
          <NotificationCenter isMobile={true} />
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-8.5 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </header>

      {/* =========================================================================
          DESKTOP MAIN VIEWPORT (>= 1024px)
          ========================================================================= */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 border-b border-border/80 bg-background/85 backdrop-blur-md px-8 items-center justify-between select-none">
          <div className="flex items-center">
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              {viewTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            {streak && (
              <button
                type="button"
                onClick={() => setIsStreakOpen(true)}
                aria-label={`Current streak: ${streak.currentStreak} days`}
                data-testid="streak-navbar-button"
                className="flex h-9.5 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-bold text-primary-foreground shadow-xs transition-transform duration-200 active:scale-95 cursor-pointer hover:opacity-90"
              >
                <Flame className="size-4 fill-current" />
                <span className="tabular-nums font-bold">
                  {streak.currentStreak}
                </span>
              </button>
            )}

            <ThemeToggle />

            {/* Notification Center */}
            <NotificationCenter isMobile={false} />

            <div className="h-6 w-px bg-border/80 mx-1" />

            {/* User Profile */}
            <Link
              href="/settings"
              className="flex items-center gap-2.5 pl-1 group transition-opacity hover:opacity-90"
              title="Profile & Settings"
            >
              <Avatar
                src={effectiveUserImage}
                fallback={initials}
                size="md"
              />
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground leading-tight group-hover:underline">
                  {effectiveUserName}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  {effectiveUserEmail}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Viewport */}
        <main
          className={cn(
            "flex-1 flex flex-col overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 pb-24 lg:pb-8",
            className
          )}
        >
          {children}
        </main>
      </div>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (< 1024px / lg:hidden)
          ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-2 py-1 flex items-center justify-around safe-area-inset-bottom"
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
              className={cn(
                "flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-2 rounded-xl text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("size-5 mb-0.5", isActive && "text-primary")}
                strokeWidth={isActive ? 2.3 : 1.75}
              />
              <span className="tracking-tight">{tab.label}</span>
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

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isPending={isSigningOut}
      />
    </div>
  );
}
