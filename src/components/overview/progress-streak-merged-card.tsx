"use client";

import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import type {
  OverviewActivityRingsData,
  OverviewStreakHeatmapData,
} from "@/actions/overview";

type ProgressStreakMergedCardProps = {
  ringsData: OverviewActivityRingsData;
  streakData: OverviewStreakHeatmapData;
};

export function ProgressStreakMergedCard({
  ringsData,
  streakData,
}: ProgressStreakMergedCardProps) {
  const { totalChapters, readChapters, overallPercentage, rings, nextReading } =
    ringsData;

  const {
    currentStreak,
    longestStreak,
    weekDays,
    timeLeftUntilMidnight,
    isTodayCompleted,
    takeaway,
  } = streakData;

  const ringConfigs = [
    { key: "bible", radius: 58, strokeWidth: 6, opacity: 1.0 },
    { key: "ot", radius: 49, strokeWidth: 6, opacity: 0.75 },
    { key: "nt", radius: 40, strokeWidth: 6, opacity: 0.5 },
    { key: "today", radius: 31, strokeWidth: 6, opacity: 0.28 },
  ];

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Progress & Streak
        </h3>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          Best: {longestStreak}d
        </span>
      </div>

      {/* Merged Body: 2 Columns */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 items-center py-1">
        {/* Left Column: Concentric Activity Rings */}
        <div className="flex flex-col items-center justify-center min-h-0">
          <div className="relative flex items-center justify-center w-full max-h-[140px] aspect-square">
            <svg
              className="size-full -rotate-90 transform overflow-visible"
              viewBox="0 0 140 140"
            >
              {ringConfigs.map((cfg) => {
                const ringData = rings.find((r) => r.key === cfg.key);
                const pct = ringData
                  ? Math.min(100, Math.max(0, ringData.percent))
                  : 0;
                const circumference = 2 * Math.PI * cfg.radius;
                const arcLength = (pct / 100) * circumference;

                return (
                  <g key={cfg.key}>
                    <circle
                      cx="70"
                      cy="70"
                      r={cfg.radius}
                      stroke="url(#donutHatchPattern)"
                      strokeWidth={cfg.strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      className="opacity-60"
                    />
                    {arcLength > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r={cfg.radius}
                        stroke="var(--primary)"
                        strokeWidth={cfg.strokeWidth}
                        fill="none"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        style={{ opacity: cfg.opacity }}
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
                {overallPercentage}%
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                {readChapters}/{totalChapters}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Streak Hero */}
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Flame className="size-5 fill-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none text-foreground tabular-nums">
                {currentStreak}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                Day Streak
              </span>
            </div>
          </div>

          {/* Week Dots */}
          <div className="flex items-center gap-1">
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={`size-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  d.isRead
                    ? "bg-primary text-primary-foreground"
                    : d.isFrozen
                      ? "border border-dashed border-primary bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
                title={d.dayLabel}
              >
                {d.dayLabel.charAt(0)}
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {!isTodayCompleted && timeLeftUntilMidnight ? (
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                {timeLeftUntilMidnight} left today
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Completed today
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Footer / Next Up */}
      <div className="border-t border-border/60 pt-2 shrink-0">
        {nextReading ? (
          <Link
            href={`/bible/${nextReading.bookId}/${nextReading.chapter}`}
            className="flex items-center justify-between text-xs text-foreground font-medium hover:text-primary transition-colors"
          >
            <span className="truncate">
              Next: {nextReading.bookName} {nextReading.chapter}
            </span>
            <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground truncate">{takeaway}</p>
        )}
      </div>
    </div>
  );
}
