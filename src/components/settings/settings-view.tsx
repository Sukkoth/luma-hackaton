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
  LogOut,
} from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
import { authClient } from "@/lib/auth-client";
import type { UserTrackerSummary } from "@/actions/trackers";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import { Button } from "@/components/ui/button";

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
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Settings Header */}
        <section className="ui-card p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Account & Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage your reading trackers, canonical editions, daily reminders,
            and profile preferences.
          </p>
        </section>

        {/* Section 1: Reading Trackers Manager */}
        <section className="ui-card p-6 sm:p-7">
          <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="size-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Reading Trackers
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Trackers isolate your reading logs, plans, and journal notes per canon.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              leftIcon={<Plus className="size-3.5" />}
            >
              Create Tracker
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {/* Active Tracker */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <BookMarked className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      Primary Devotional Tracker
                    </h3>
                    <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Protestant Canon • 66 Books • 443 / 1,189 chapters read
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Check className="size-4" />
                  <span>Current Default</span>
                </span>
              </div>
            </div>

            {/* Secondary Tracker */}
            <div className="rounded-xl border border-border bg-card flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <FolderKanban className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Greek & Hebrew Study Workspace
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Academic study • Inactive
                  </p>
                </div>
              </div>

              <Button type="button" variant="outline" size="sm">
                Switch to this
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: Pacing & Buffer Days and Reminders */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pacing Safeguards */}
          <section className="ui-card p-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-4">
              <Sliders className="size-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Reading Pace Safeguards
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-foreground">
                    Auto-Adjust Daily Target
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recalculates chapters/day if you miss reading sessions
                  </p>
                </div>
                <div className="flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
                  <div className="size-4 translate-x-4 rounded-full bg-primary-foreground shadow-xs transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-foreground">
                    Weekly Catch-Up Grace Days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Built-in catch-up buffer for unexpected busy days
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">
                  1 Day / Week
                </span>
              </div>
            </div>
          </section>

          {/* Daily Reminders */}
          <section className="ui-card p-6">
            <div className="flex items-center gap-2 border-b border-border/60 pb-4">
              <Bell className="size-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Reminders & Notifications
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-foreground">
                    Daily Morning Reminder
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Push alert for your daily scripture reading
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    07:30 AM
                  </span>
                  <div className="flex h-5 w-9 items-center rounded-full bg-primary p-0.5">
                    <div className="size-4 translate-x-4 rounded-full bg-primary-foreground shadow-xs transition-transform" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-foreground">
                    Weekly Progress Summary
                  </p>
                  <p className="text-xs text-muted-foreground">
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
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Account & Authentication
              </h2>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="size-3.5" />
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
                  className="size-12 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full border border-border bg-primary/10 text-primary font-bold text-base">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email} • Session Active
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSigningOut}
              onClick={handleSignOut}
              isLoading={isSigningOut}
              leftIcon={<LogOut className="size-3.5" />}
            >
              Sign Out
            </Button>
          </div>

          {/* Account status note */}
          <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>
              Account Status:{" "}
              <strong className="font-semibold text-foreground">
                {user.emailVerifiedAt ? "Verified" : "Active Member"}
              </strong>
            </span>
            <span className="text-[11px]">
              Member ID: {user.id.slice(0, 12)}…
            </span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
