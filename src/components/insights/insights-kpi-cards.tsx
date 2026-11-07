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
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <Flame className="size-3.5 text-orange-500" />
            <span>Reading Streak</span>
          </span>
          <span className="rounded-sm bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
            {currentStreak > 0 ? "Active" : "Ready"}
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
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
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <TrendingUp className="size-3.5 text-[#82ADD4]" />
            <span>Bible Complete</span>
          </span>
          <span className="rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
            {canonPercentage}%
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
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
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <Shield className="size-3.5 text-[#82ADD4]" />
            <span>Streak Freezes</span>
          </span>
          <span className="rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
            Max 3
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
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
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <BookOpen className="size-3.5 text-[#82ADD4]" />
            <span>Active Tracker</span>
          </span>
          <span className="rounded-sm bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
            Current
          </span>
        </div>
        <div className="mt-3">
          <span className="truncate block text-[26px] leading-tight font-light tracking-tight text-black sm:text-[28px] dark:text-white">
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
