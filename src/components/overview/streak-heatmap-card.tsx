"use client";

import { Flame, Clock, Trophy, Snowflake } from "lucide-react";
import type { OverviewStreakHeatmapData } from "@/actions/overview";

type StreakHeatmapCardProps = {
  data: OverviewStreakHeatmapData;
};

export function StreakHeatmapCard({ data }: StreakHeatmapCardProps) {
  const {
    currentStreak,
    longestStreak,
    streakFreezes,
    weekDays,
    heatmapWeeks,
    monthLabels,
    timeLeftUntilMidnight,
    isTodayCompleted,
    takeaway,
  } = data;

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold tracking-tight text-foreground flex items-center gap-1.5">
          <Flame className="size-4 text-foreground" />
          <span>Reading Streak</span>
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] sm:text-[11.5px] font-medium text-foreground-dim">
          {!isTodayCompleted && timeLeftUntilMidnight ? (
            <span className="flex items-center gap-1 text-foreground-secondary shrink-0">
              <Clock className="size-3.5" />
              <span className="tabular-nums">{timeLeftUntilMidnight}</span>
            </span>
          ) : (
            <span className="text-foreground shrink-0">Today completed</span>
          )}
        </div>
      </div>

      {/* Top Visuals: Current Week Strip + Calendar Heatmap (pushed upward) */}
      <div className="flex flex-col gap-2 min-[1440px]:gap-3 pt-1.5 shrink-0">
        {/* Mon-Sun Week Strip */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] min-[1440px]:text-[12px] font-semibold uppercase tracking-wider text-foreground-dim">
            This Week
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 min-[1440px]:gap-2">
            {weekDays.map((day) => {
              let badgeStyle =
                "border border-border text-foreground-dim bg-transparent"; // hollow
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
                ? "ring-1.5 ring-foreground ring-offset-1 ring-offset-surface"
                : "";

              return (
                <div
                  key={day.dateStr}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div
                    className={`flex size-6 sm:size-6.5 min-[1440px]:size-7.5 2xl:size-8.5 items-center justify-center rounded-full text-[9px] sm:text-[10px] min-[1440px]:text-[11.5px] 2xl:text-[12px] tabular-nums transition-all ${badgeStyle} ${todayOutline}`}
                    title={`${day.dayLabel} (${day.dateStr}): ${
                      day.isRead
                        ? "Read"
                        : day.isFrozen
                          ? "Streak Freeze Used"
                          : day.isToday
                            ? "Today"
                            : "Missed"
                    }`}
                  >
                    {day.dayLabel.charAt(0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini Calendar Heatmap */}
        <div className="w-full">
          {/* Month labels header */}
          <div className="grid grid-cols-16 gap-1 w-full text-[9px] sm:text-[10px] min-[1440px]:text-[11px] font-medium text-foreground-dim pl-4 mb-1">
            {Array.from({ length: 16 }).map((_, col) => {
              const ml = monthLabels.find((m) => m.colIndex === col);
              return (
                <span key={`month-${col}`} className="truncate">
                  {ml ? ml.label : ""}
                </span>
              );
            })}
          </div>

          {/* Grid: 7 rows with M/W/F labels on left, 16 columns of days */}
          <div className="flex items-center gap-1.5 w-full">
            {/* Day of week row labels */}
            <div className="flex flex-col justify-between text-[8.5px] sm:text-[9.5px] min-[1440px]:text-[10.5px] font-medium text-foreground-dim h-[70px] sm:h-[76px] min-[1440px]:h-[95px] 2xl:h-[115px] py-0.5">
              <span>M</span>
              <span>W</span>
              <span>F</span>
            </div>

            {/* Heatmap 16 Columns */}
            <div className="grid grid-cols-16 gap-1 min-[1440px]:gap-1.5 flex-1 h-[70px] sm:h-[76px] min-[1440px]:h-[95px] 2xl:h-[115px]">
              {heatmapWeeks.map((week, wIdx) => (
                <div
                  key={`week-${wIdx}`}
                  className="grid grid-rows-7 gap-1 min-[1440px]:gap-1.5 h-full"
                >
                  {week.map((cell) => {
                    let cellBg = "bg-foreground/10 border border-border";
                    if (cell.isFrozen) {
                      cellBg =
                        "border border-dashed border-primary/60 bg-primary/10";
                    } else if (cell.level === 4) {
                      cellBg = "bg-foreground border border-transparent";
                    } else if (cell.level === 3) {
                      cellBg = "bg-foreground/75 border border-transparent";
                    } else if (cell.level === 2) {
                      cellBg = "bg-foreground/50 border border-transparent";
                    } else if (cell.level === 1) {
                      cellBg = "bg-foreground/30 border border-transparent";
                    }

                    const todayOutline = cell.isToday
                      ? "ring-1.5 ring-foreground ring-offset-0.5 ring-offset-surface"
                      : "";

                    return (
                      <div
                        key={cell.dateStr}
                        className={`w-full h-full rounded-[2px] min-[1440px]:rounded-[3.5px] transition-colors ${cellBg} ${todayOutline}`}
                        title={`${cell.dateStr}: ${cell.count} chapter${cell.count === 1 ? "" : "s"}${cell.isFrozen ? " (Frozen)" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric KPI Tiles: Perfectly centered vertical axis (Icon -> Number -> Label) */}
      <div className="grid grid-cols-3 divide-x divide-border-subtle border-t border-border-subtle pt-3 sm:pt-4 min-[1440px]:pt-6 my-auto">
        {/* Metric 1: Current Streak */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex size-9 sm:size-10 min-[1440px]:size-12 items-center justify-center rounded-xl bg-surface-elevated border border-border text-foreground mb-1.5 min-[1440px]:mb-2.5 shadow-2xs">
            <Flame
              className="size-4.5 sm:size-5 min-[1440px]:size-6 text-foreground"
              strokeWidth={1.9}
            />
          </div>
          <div className="flex items-baseline justify-center">
            <span className="text-[22px] sm:text-[24px] min-[1440px]:text-[32px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {currentStreak}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] min-[1440px]:text-[11px] font-semibold text-foreground-dim uppercase tracking-wider mt-1 truncate max-w-full">
            Current Days
          </span>
        </div>

        {/* Metric 2: Best Streak */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex size-9 sm:size-10 min-[1440px]:size-12 items-center justify-center rounded-xl bg-surface-elevated border border-border text-foreground mb-1.5 min-[1440px]:mb-2.5 shadow-2xs">
            <Trophy
              className="size-4.5 sm:size-5 min-[1440px]:size-6 text-foreground"
              strokeWidth={1.9}
            />
          </div>
          <div className="flex items-baseline justify-center">
            <span className="text-[22px] sm:text-[24px] min-[1440px]:text-[32px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {longestStreak}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] min-[1440px]:text-[11px] font-semibold text-foreground-dim uppercase tracking-wider mt-1 truncate max-w-full">
            Best Record
          </span>
        </div>

        {/* Metric 3: Streak Freezes */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex size-9 sm:size-10 min-[1440px]:size-12 items-center justify-center rounded-xl bg-surface-elevated border border-border text-foreground mb-1.5 min-[1440px]:mb-2.5 shadow-2xs">
            <Snowflake
              className="size-4.5 sm:size-5 min-[1440px]:size-6 text-foreground"
              strokeWidth={1.9}
            />
          </div>
          <div className="flex items-baseline justify-center">
            <span className="text-[22px] sm:text-[24px] min-[1440px]:text-[32px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {streakFreezes}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] min-[1440px]:text-[11px] font-semibold text-foreground-dim uppercase tracking-wider mt-1 truncate max-w-full">
            Freeze Shields
          </span>
        </div>
      </div>

      {/* Countdown / Takeaway Line */}
      <div className="short-laptop-hide max-h-[799px]:hidden border-t border-border-subtle pt-1.5 shrink-0">
        <p className="text-[12px] sm:text-[13px] font-normal text-foreground-secondary truncate">
          {takeaway}
        </p>
      </div>
    </div>
  );
}
