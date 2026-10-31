import {
  FolderKanban,
  Plus,
  Check,
  Sliders,
  Bell,
  User,
  Shield,
  BookMarked,
} from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";

export default function SettingsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      <main className="mt-4 space-y-4">
        {/* Settings Header */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
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
          <div className="flex flex-col gap-2 border-b border-black/[0.04] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-[#82ADD4]" />
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
              className="flex items-center gap-1.5 rounded-[12px] bg-black px-4 py-2 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Tracker</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {/* Active Tracker */}
            <div className="flex flex-col justify-between gap-3 rounded-[20px] border border-black/[0.08] bg-white/80 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md sm:flex-row sm:items-center dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#82ADD4] text-white shadow-xs">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-medium text-black dark:text-white">
                      Primary Devotional Tracker
                    </h3>
                    <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[10px] font-medium text-black">
                      Current Active
                    </span>
                  </div>
                  <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                    Protestant Canon • 66 Books • 443 / 1,189 chapters read
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-[10px] bg-black/[0.04] px-3 py-1.5 text-[11px] font-medium text-black dark:bg-white/[0.06] dark:text-white">
                  <Check className="h-3.5 w-3.5" />
                  <span>Active</span>
                </span>
              </div>
            </div>

            {/* Secondary Tracker */}
            <div className="flex flex-col justify-between gap-3 rounded-[20px] border border-black/[0.08] bg-white/60 p-5 backdrop-blur-md sm:flex-row sm:items-center dark:border-white/[0.08] dark:bg-white/[0.02]">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-black/[0.05] text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-black dark:text-white">
                    Academic Historical Study
                  </h3>
                  <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                    Catholic Canon • 73 Books • 120 / 1,334 chapters read
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
              >
                <span>Switch Tracker</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Preferences & Pacing Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Pacing & Schedule */}
          <section className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center gap-2 border-b border-black/[0.04] pb-4 dark:border-white/[0.06]">
              <Sliders className="h-4 w-4 text-[#82ADD4]" />
              <h2 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
                Reading Pacing & Schedule
              </h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-[13px]">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Default Plan Pacing
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                    Choose fixed calendar days or flexible self-paced
                  </p>
                </div>
                <span className="rounded-[10px] border border-white/90 bg-white px-3 py-1 text-[11px] font-medium text-black shadow-2xs dark:border-white/15 dark:bg-white/10 dark:text-white">
                  Fixed Schedule
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.04] pt-3 text-[13px] dark:border-white/[0.06]">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Planned Rest Days Buffer
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
            <div className="flex items-center gap-2 border-b border-black/[0.04] pb-4 dark:border-white/[0.06]">
              <Bell className="h-4 w-4 text-[#82ADD4]" />
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
                    <div className="h-4 w-4 translate-x-4 rounded-full bg-white shadow-xs transition-transform" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.04] pt-3 text-[13px] dark:border-white/[0.06]">
                <div>
                  <p className="font-medium text-black dark:text-white">
                    Weekly Progress Summary
                  </p>
                  <p className="text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                    Sunday recap of chapters read and consistency rating
                  </p>
                </div>
                <div className="flex h-5 w-9 items-center rounded-full bg-[#82ADD4] p-0.5">
                  <div className="h-4 w-4 translate-x-4 rounded-full bg-white shadow-xs transition-transform" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Section 3: Profile & Better Auth Account */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-black/[0.04] pb-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#82ADD4]" />
              <h2 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
                Account & Authentication
              </h2>
            </div>
            <span className="flex items-center gap-1 text-[12px] font-normal text-[#555555] dark:text-[#9CA3AF]">
              <Shield className="h-3.5 w-3.5 text-[#82ADD4]" />
              <span>Better Auth Protected</span>
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#82ADD4] text-[15px] font-bold text-white shadow-xs">
                JA
              </div>
              <div>
                <p className="text-[15px] font-medium text-black dark:text-white">
                  James
                </p>
                <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                  james@scripturetracker.app • Session Active
                </p>
              </div>
            </div>

            <button
              type="button"
              className="rounded-[12px] border border-white/80 bg-white/70 px-4 py-2 text-[12px] font-medium text-black shadow-2xs hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Sign Out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
