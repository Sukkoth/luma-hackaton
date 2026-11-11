"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Check,
  Sliders,
  Bell,
  User,
  Shield,
  BookMarked,
  Loader2,
  LogOut,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { authClient } from "@/lib/auth-client";
import type { UserTrackerSummary } from "@/actions/trackers";
import type { StreakData } from "@/components/streak/streak-detail-modal";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerifiedAt?: Date | string | null;
};

type SettingsViewProps = {
  user: SettingsUser;
  trackers?: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string | null;
  streak?: StreakData;
};

export function SettingsView({
  user,
  trackers,
  activeTrackerId,
  streak,
}: SettingsViewProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
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

  const displayName = user.name.split(" ")[0] || user.name || "Reader";
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <AppShell
      userName={displayName}
      userEmail={user.email}
      userImage={user.image ?? undefined}
      streak={streak}
      trackers={trackers}
      activeTrackerId={activeTrackerId}
    >
      <div className="w-full px-6 sm:px-8 py-4 sm:py-6">
        <main className="mt-1 space-y-4">
          {/* Settings Header */}
          <section className="ui-card p-6 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="ui-pill-primary text-[10px]">Preferences</span>
              <span className="text-[12px] text-foreground-dim">
                Bible Tracker & Planner Settings
              </span>
            </div>
            <h1 className="mt-2 text-[26px] font-normal tracking-tight text-foreground sm:text-[30px]">
              Settings
            </h1>
            <p className="mt-1 text-[13px] text-foreground-secondary">
              Manage your reading trackers, canonical editions, daily reminders,
              and profile preferences.
            </p>
          </section>

          {/* Section 1: Reading Trackers Manager */}
          <section className="ui-card p-6 sm:p-7">
            <div className="flex flex-col gap-2 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-foreground" />
                  <h2 className="text-[18px] font-normal tracking-tight text-foreground">
                    Reading Trackers
                  </h2>
                </div>
                <p className="mt-0.5 text-[12px] text-foreground-dim">
                  Trackers act as isolated folders for your reading logs, plans,
                  and journal notes.
                </p>
              </div>

              <button
                type="button"
                className="ui-btn-primary ui-btn-sm gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Create Tracker</span>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {/* Active Tracker */}
              <div className="ui-card-elevated flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                    <BookMarked className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-medium text-foreground">
                        Primary Devotional Tracker
                      </h3>
                      <span className="ui-pill-primary text-[9px]">
                        Current Active
                      </span>
                    </div>
                    <p className="text-[12px] text-foreground-secondary">
                      Protestant Canon • 66 Books • 443 / 1,189 chapters read
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="ui-pill text-[11px] font-medium gap-1">
                    <Check className="size-3.5 text-primary" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              {/* Secondary Tracker */}
              <div className="ui-card-elevated flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground-dim">
                    <FolderKanban className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-medium text-foreground">
                      Greek & Hebrew Study Workspace
                    </h3>
                    <p className="text-[12px] text-foreground-secondary">
                      Academic study • Inactive
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="ui-btn-secondary ui-btn-sm cursor-pointer"
                >
                  Switch to this
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Pacing & Buffer Days and Reminders */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pacing Safeguards */}
            <section className="ui-card p-6">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
                <Sliders className="size-4 text-foreground" />
                <h2 className="text-[16px] font-normal tracking-tight text-foreground">
                  Reading Pace Safeguards
                </h2>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-[13px]">
                  <div>
                    <p className="font-medium text-foreground">
                      Auto-Adjust Daily Target
                    </p>
                    <p className="text-[11px] text-foreground-dim">
                      Recalculates chapters/day if you miss reading sessions
                    </p>
                  </div>
                  <div className="flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
                    <div className="size-4 translate-x-4 rounded-full bg-primary-foreground shadow-xs transition-transform" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[13px]">
                  <div>
                    <p className="font-medium text-foreground">
                      Weekly Catch-Up Grace Days
                    </p>
                    <p className="text-[11px] text-foreground-dim">
                      Built-in catch-up buffer for unexpected busy days
                    </p>
                  </div>
                  <span className="ui-pill text-[11px] font-medium">
                    1 Day / Week
                  </span>
                </div>
              </div>
            </section>

            {/* Daily Reminders */}
            <section className="ui-card p-6">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
                <Bell className="size-4 text-foreground" />
                <h2 className="text-[16px] font-normal tracking-tight text-foreground">
                  Reminders & Notifications
                </h2>
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between text-[13px]">
                  <div>
                    <p className="font-medium text-foreground">
                      Daily Morning Reminder
                    </p>
                    <p className="text-[11px] text-foreground-dim">
                      Quiet push alert for your daily scripture reading
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-light text-foreground">
                      07:30 AM
                    </span>
                    <div className="flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
                      <div className="size-4 translate-x-4 rounded-full bg-primary-foreground shadow-xs transition-transform" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[13px]">
                  <div>
                    <p className="font-medium text-foreground">
                      Weekly Progress Summary
                    </p>
                    <p className="text-[11px] text-foreground-dim">
                      Sunday recap of chapters read and consistency rating
                    </p>
                  </div>
                  <div className="flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
                    <div className="size-4 translate-x-4 rounded-full bg-primary-foreground shadow-xs transition-transform" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Section 3: Profile & Account */}
          <section className="ui-card p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <User className="size-4 text-foreground" />
                <h2 className="text-[16px] font-normal tracking-tight text-foreground">
                  Account & Authentication
                </h2>
              </div>
              <span className="flex items-center gap-1 text-[12px] font-normal text-foreground-dim">
                <Shield className="size-3.5 text-foreground" />
                <span>Secured</span>
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="size-12 rounded-full border border-border object-cover shadow-xs"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full border border-border bg-primary text-[15px] font-medium text-primary-foreground shadow-xs">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-[16px] font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="text-[12px] text-foreground-secondary">
                    {user.email} • Session Active
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="ui-btn-destructive ui-btn-sm gap-2 cursor-pointer"
              >
                {isSigningOut ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LogOut className="size-3.5" />
                )}
                <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
              </button>
            </div>

            {/* Account status note */}
            <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4 text-[12px] text-foreground-dim">
              <span>
                Account Status:{" "}
                <strong className="font-medium text-foreground">
                  {user.emailVerifiedAt ? "Verified" : "Active Member"}
                </strong>
              </span>
              <span className="text-[11px] text-foreground-dim">
                Member ID: {user.id.slice(0, 12)}…
              </span>
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}
