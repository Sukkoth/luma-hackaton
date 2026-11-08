import { Flame, Shield, TrendingUp, BookOpen } from "lucide-react";
import type { StreakData } from "@/components/streak/streak-detail-modal";

type Props = {
  streak?: StreakData;
  totalReadChapters: number;
  totalChaptersAcrossCanon: number;
  canonPercentage: number;
  activeTrackerName: string;
};

export function InsightsKpiCards({
  streak,
  totalReadChapters,
  totalChaptersAcrossCanon,
  canonPercentage,
  activeTrackerName,
}: Props) {
  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const freezesRemaining = streak?.availableFreezes ?? 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Reading Streak */}
      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-zinc-600 dark:text-zinc-400">
            <Flame className="size-3.5 text-zinc-950 dark:text-zinc-50" />
            <span>Reading Streak</span>
          </span>
          <span className="rounded-full border border-zinc-300 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-medium text-white dark:border-zinc-700 dark:bg-white dark:text-zinc-950">
            {currentStreak > 0 ? "Active" : "Ready"}
          </span>
        </div>
        <div className="mt-3">
          <span className="font-mono text-[36px] font-light leading-none tracking-tight text-zinc-950 sm:text-[40px] dark:text-zinc-50">
            {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            Personal best: {longestStreak}{" "}
            {longestStreak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      {/* 2. Bible Progress */}
      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-zinc-600 dark:text-zinc-400">
            <TrendingUp className="size-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Bible Complete</span>
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {canonPercentage}%
          </span>
        </div>
        <div className="mt-3">
          <span className="font-mono text-[36px] font-light leading-none tracking-tight text-zinc-950 sm:text-[40px] dark:text-zinc-50">
            {canonPercentage}%
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            {totalReadChapters} of {totalChaptersAcrossCanon.toLocaleString()}{" "}
            chapters
          </p>
        </div>
      </div>

      {/* 3. Streak Freeze Protection */}
      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-zinc-600 dark:text-zinc-400">
            <Shield className="size-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Streak Freezes</span>
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Max 3
          </span>
        </div>
        <div className="mt-3">
          <span className="font-mono text-[36px] font-light leading-none tracking-tight text-zinc-950 sm:text-[40px] dark:text-zinc-50">
            {freezesRemaining} / 3
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            {freezesRemaining > 0
              ? "Shields available if a day is missed"
              : "Reach 7 days streak to unlock freezes"}
          </p>
        </div>
      </div>

      {/* 4. Active Tracker */}
      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-zinc-600 dark:text-zinc-400">
            <BookOpen className="size-3.5 text-zinc-900 dark:text-zinc-100" />
            <span>Active Tracker</span>
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            Current
          </span>
        </div>
        <div className="mt-3">
          <span className="block truncate text-[24px] font-light leading-tight tracking-tight text-zinc-950 sm:text-[26px] dark:text-zinc-50">
            {activeTrackerName}
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            Connected to PostgreSQL progress
          </p>
        </div>
      </div>
    </section>
  );
}
