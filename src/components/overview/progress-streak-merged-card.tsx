"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Clock } from "lucide-react";
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
    heatmapWeeks,
    timeLeftUntilMidnight,
    isTodayCompleted,
    takeaway,
  } = streakData;

  const ringConfigs = [
    { key: "bible", radius: 58, strokeWidth: 6, opacity: 1.0 },
    { key: "ot", radius: 49, strokeWidth: 6, opacity: 0.7 },
    { key: "nt", radius: 40, strokeWidth: 6, opacity: 0.45 },
    { key: "today", radius: 31, strokeWidth: 6, opacity: 0.25 },
  ];

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] font-medium tracking-tight text-foreground">
          Progress & Streak
        </h3>
        <span className="text-[11px] font-medium text-foreground-dim tabular-nums">
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
                      className="opacity-70"
                    />
                    {arcLength > 0 && (
                      <circle
                        cx="70"
                        cy="70"
                        r={cfg.radius}
                        stroke="var(--foreground)"
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
              <span className="text-[18px] font-bold leading-none tracking-tight text-foreground tabular-nums">
                {overallPercentage}%
              </span>
              <span className="mt-0.5 text-[9.5px] text-foreground-secondary tabular-nums">
                {readChapters} / {totalChapters.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Streak & Heatmap */}
        <div className="flex flex-col justify-center min-h-0 border-l border-border-subtle pl-3">
          <div className="flex items-baseline gap-1.5">
            <Flame className="size-3.5 text-foreground shrink-0 self-center" />
            <span className="text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {currentStreak}
            </span>
            <span className="text-[12px] font-medium text-foreground-dim">
              {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Mon-Sun Week Strip */}
          <div className="mt-2 flex items-center justify-between gap-1">
            {weekDays.map((day) => {
              let badgeStyle =
                "border border-border text-foreground-dim bg-transparent";
              if (day.isRead) {
                badgeStyle =
                  "bg-primary text-primary-foreground border-transparent shadow-2xs font-semibold";
              } else if (day.isFrozen) {
                badgeStyle =
                  "border border-dashed border-primary/60 bg-primary/10 text-primary font-medium";
              } else if (day.isMissed) {
                badgeStyle =
                  "border border-border-strong text-foreground-dim/60 bg-transparent";
              }

              const todayOutline = day.isToday
                ? "ring-1.5 ring-foreground ring-offset-0.5 ring-offset-surface"
                : "";

              return (
                <div
                  key={day.dateStr}
                  className="flex flex-1 flex-col items-center gap-0.5"
                >
                  <div
                    className={`flex size-5.5 items-center justify-center rounded-full text-[8.5px] tabular-nums transition-all ${badgeStyle} ${todayOutline}`}
                  >
                    {day.dayLabel.charAt(0)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini Heatmap Strip (Last 8 weeks) */}
          <div className="grid grid-cols-8 gap-0.5 mt-2 h-[32px]">
            {heatmapWeeks.slice(-8).map((week, wIdx) => (
              <div
                key={`merged-w-${wIdx}`}
                className="grid grid-rows-7 gap-0.5 h-full"
              >
                {week.map((cell) => {
                  let cellBg = "bg-foreground/10";
                  if (cell.isFrozen) cellBg = "bg-primary/40";
                  else if (cell.level === 4) cellBg = "bg-foreground";
                  else if (cell.level === 3) cellBg = "bg-foreground/75";
                  else if (cell.level === 2) cellBg = "bg-foreground/50";
                  else if (cell.level === 1) cellBg = "bg-foreground/30";

                  return (
                    <div
                      key={cell.dateStr}
                      className={`w-full h-full rounded-[1px] ${cellBg}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Status line */}
          <div className="short-laptop-hide max-h-[759px]:hidden mt-2 pt-1 border-t border-border-subtle text-[10.5px] text-foreground-secondary truncate flex items-center gap-1">
            {!isTodayCompleted && timeLeftUntilMidnight ? (
              <>
                <Clock className="size-2.5 text-foreground-dim shrink-0" />
                <span className="tabular-nums font-medium text-foreground">
                  {timeLeftUntilMidnight}
                </span>
              </>
            ) : (
              <span>{takeaway}</span>
            )}
          </div>
        </div>
      </div>

      {/* Primary CTA Button */}
      <div className="mt-2 shrink-0">
        <Link
          href="/books"
          className="ui-btn-primary flex h-8.5 w-full items-center justify-center gap-1.5 rounded-[10px] text-[11.5px] font-medium shadow-xs transition-all active:scale-[0.99]"
        >
          <BookOpen className="size-3.5" />
          <span className="truncate">
            Continue reading · {nextReading?.displayText ?? "Genesis 1"}
          </span>
          <ArrowRight className="size-3.5 shrink-0 opacity-70" />
        </Link>
      </div>
    </div>
  );
}
