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
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Flame className="size-4 text-primary fill-primary" />
            <span>Reading Streak</span>
          </span>
          <span className="text-xs font-semibold text-primary">
            {currentStreak > 0 ? "Active" : "Ready"}
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl sm:text-4xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
          </span>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Personal best: {longestStreak}{" "}
            {longestStreak === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      {/* 2. Bible Progress */}
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="size-4 text-primary" />
            <span>Bible Complete</span>
          </span>
          <span className="text-xs font-semibold text-foreground tabular-nums">
            {canonPercentage}%
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl sm:text-4xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {canonPercentage}%
          </span>
          <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
            {totalReadChapters} of {totalChaptersAcrossCanon.toLocaleString()}{" "}
            chapters
          </p>
        </div>
      </div>

      {/* 3. Streak Freeze Protection */}
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Shield className="size-4 text-sky-600 dark:text-sky-400" />
            <span>Streak Freezes</span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Max 3
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl sm:text-4xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {freezesRemaining} / 3
          </span>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {freezesRemaining > 0
              ? "Shields available if a day is missed"
              : "Read 7 consecutive days to earn freezes"}
          </p>
        </div>
      </div>

      {/* 4. Active Tracker */}
      <div className="ui-card flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookOpen className="size-4 text-primary" />
            <span>Active Tracker</span>
          </span>
          <span className="text-xs font-semibold text-primary">Active</span>
        </div>
        <div className="mt-3">
          <span className="block truncate text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground">
            {activeTrackerName}
          </span>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Selected reading journey
          </p>
        </div>
      </div>
    </section>
  );
}
