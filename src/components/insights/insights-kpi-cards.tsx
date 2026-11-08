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
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-foreground-secondary">
            <Flame className="size-3.5 text-foreground" />
            <span>Reading Streak</span>
          </span>
          <span className="ui-pill-primary text-[10px]">
            {currentStreak > 0 ? "Active" : "Ready"}
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[36px] font-light leading-none tracking-tight text-foreground sm:text-[40px]">
            {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
          </span>
          <p className="mt-1 text-[11px] text-foreground-dim">
            Personal best: {longestStreak}{" "}
            {longestStreak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      {/* 2. Bible Progress */}
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-foreground-secondary">
            <TrendingUp className="size-3.5 text-foreground" />
            <span>Bible Complete</span>
          </span>
          <span className="ui-pill text-[10px]">{canonPercentage}%</span>
        </div>
        <div className="mt-3">
          <span className="text-[36px] font-light leading-none tracking-tight text-foreground sm:text-[40px]">
            {canonPercentage}%
          </span>
          <p className="mt-1 text-[11px] text-foreground-dim">
            {totalReadChapters} of {totalChaptersAcrossCanon.toLocaleString()}{" "}
            chapters
          </p>
        </div>
      </div>

      {/* 3. Streak Freeze Protection */}
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-foreground-secondary">
            <Shield className="size-3.5 text-foreground" />
            <span>Streak Freezes</span>
          </span>
          <span className="ui-pill text-[10px]">Max 3</span>
        </div>
        <div className="mt-3">
          <span className="text-[36px] font-light leading-none tracking-tight text-foreground sm:text-[40px]">
            {freezesRemaining} / 3
          </span>
          <p className="mt-1 text-[11px] text-foreground-dim">
            {freezesRemaining > 0
              ? "Shields available if a day is missed"
              : "Reach 7 days streak to unlock freezes"}
          </p>
        </div>
      </div>

      {/* 4. Active Tracker */}
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-foreground-secondary">
            <BookOpen className="size-3.5 text-foreground" />
            <span>Active Tracker</span>
          </span>
          <span className="ui-pill text-[10px]">Current</span>
        </div>
        <div className="mt-3">
          <span className="block truncate text-[24px] font-light leading-tight tracking-tight text-foreground sm:text-[26px]">
            {activeTrackerName}
          </span>
          <p className="mt-1 text-[11px] text-foreground-dim">
            Connected to PostgreSQL progress
          </p>
        </div>
      </div>
    </section>
  );
}
