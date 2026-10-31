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
import { TopNavbar } from "@/components/luma/top-navbar";
import { authClient } from "@/lib/auth-client";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerifiedAt?: Date | string | null;
};

type SettingsViewProps = {
  user: SettingsUser;
};

export function SettingsView({ user }: SettingsViewProps) {
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
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName={displayName} />

      <main className="mt-4 space-y-4">
        {/* Settings Header */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
              Preferences
            </span>
            <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
              Bible Tracker & Planner Settings
            </span>
          </div>
          <h1 className="mt-2 text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
            Manage your reading trackers, canonical editions, daily reminders,
            and profile preferences.
          </p>
        </section>

        {/* Section 1: Reading Trackers Manager */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex flex-col gap-2 border-b border-black/4 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/6">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="size-4 text-[#82ADD4]" />
                <h2 className="text-[18px] font-normal tracking-tight text-black dark:text-white">
                  Reading Trackers
                </h2>
              </div>
              <p className="mt-0.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                Trackers act as isolated folders for your reading logs, plans,
                and journal notes.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Plus className="size-3.5" />
              <span>Create Tracker</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {/* Active Tracker */}
            <div className="flex flex-col justify-between gap-3 rounded-[20px] border border-black/8 bg-white/80 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md sm:flex-row sm:items-center dark:border-white/8 dark:bg-white/4 dark:shadow-none">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#82ADD4] text-white shadow-xs">
                  <BookMarked className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-medium text-black dark:text-white">
                      Primary Devotional Tracker
                    </h3>
                    <span className="rounded-sm bg-[#DDFD2C] px-1.5 py-0.5 text-[10px] font-medium text-black">
                      Current Active
                    </span>
                  </div>
                  <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                    Protestant Canon • 66 Books • 443 / 1,189 chapters read
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-[10px] bg-black/4 px-3 py-1.5 text-[11px] font-medium text-black dark:bg-white/6 dark:text-white">
                  <Check className="size-3.5" />
                  <span>Active</span>
                </span>
              </div>
            </div>

            {/* Secondary Tracker */}
            <div className="flex flex-col justify-between gap-3 rounded-[20px] border border-black/8 bg-white/60 p-5 backdrop-blur-md sm:flex-row sm:items-center dark:border-white/8 dark:bg-white/2">
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-black/5 text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                  <FolderKanban className="size-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black dark:text-white">
                    Greek & Hebrew Study Workspace
                  </h3>
                  <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                    Academic study • Inactive
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded-[10px] border border-black/8 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-black shadow-2xs hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Switch to this
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Pacing & Buffer Days and Reminders */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pacing Safeguards */}
          <section className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-2 border-b border-black/4 pb-4 dark:border-white/6">
              <Sliders className="size-4 text-[#82ADD4]" />
              <h2 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
                Reading Pace Safeguards
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-[13px]">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Auto-Adjust Daily Target
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                    Recalculates chapters/day if you miss reading sessions
                  </p>
                </div>
                <div className="flex h-5 w-9 items-center rounded-full bg-[#82ADD4] p-0.5">
                  <div className="size-4 translate-x-4 rounded-full bg-white shadow-xs transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/4 pt-3 text-[13px] dark:border-white/6">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Weekly Catch-Up Grace Days
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                    Built-in catch-up buffer for unexpected busy days
                  </p>
                </div>
                <span className="rounded-[10px] border border-white/90 bg-white px-3 py-1 text-[11px] font-medium text-black shadow-2xs dark:border-white/15 dark:bg-white/10 dark:text-white">
                  1 Day / Week
                </span>
              </div>
            </div>
          </section>

          {/* Daily Reminders */}
          <section className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-2 border-b border-black/4 pb-4 dark:border-white/6">
              <Bell className="size-4 text-[#82ADD4]" />
              <h2 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
                Reminders & Notifications
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-[13px]">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Daily Morning Reminder
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                    Quiet push alert for your daily scripture reading
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-light text-black dark:text-white">
                    07:30 AM
                  </span>
                  <div className="flex h-5 w-9 items-center rounded-full bg-[#82ADD4] p-0.5">
                    <div className="size-4 translate-x-4 rounded-full bg-white shadow-xs transition-transform" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/4 pt-3 text-[13px] dark:border-white/6">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Weekly Progress Summary
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                    Sunday recap of chapters read and consistency rating
                  </p>
                </div>
                <div className="flex h-5 w-9 items-center rounded-full bg-[#82ADD4] p-0.5">
                  <div className="size-4 translate-x-4 rounded-full bg-white shadow-xs transition-transform" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Section 3: Profile & Better Auth Account */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-black/4 pb-4 dark:border-white/6">
            <div className="flex items-center gap-2">
              <User className="size-4 text-[#82ADD4]" />
              <h2 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
                Account & Authentication
              </h2>
            </div>
            <span className="flex items-center gap-1 text-[12px] font-normal text-[#555555] dark:text-[#9CA3AF]">
              <Shield className="size-3.5 text-[#82ADD4]" />
              <span>Better Auth Protected</span>
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
                  className="size-12 rounded-full border border-black/10 object-cover shadow-xs dark:border-white/10"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-[#82ADD4] text-[15px] font-bold text-white shadow-xs">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-[16px] font-medium text-black dark:text-white">
                  {user.name}
                </p>
                <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                  {user.email} • Session Active
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] font-medium text-red-600 shadow-2xs hover:bg-red-500/20 disabled:opacity-60 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
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
          <div className="mt-5 flex items-center justify-between border-t border-black/4 pt-4 text-[12px] text-[#777777] dark:border-white/6 dark:text-[#A1A1AA]">
            <span>
              Account Status:{" "}
              <strong className="font-medium text-black dark:text-white">
                {user.emailVerifiedAt ? "Verified" : "Active Member"}
              </strong>
            </span>
            <span className="text-[11px] text-[#888888] dark:text-[#71717A]">
              Member ID: {user.id.slice(0, 12)}…
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
