"use client";

import { Flame, Clock, Trophy, Snowflake } from "lucide-react";
import type { OverviewStreakHeatmapData } from "@/actions/overview";
import { cn } from "@/lib/utils";

type StreakHeatmapCardProps = {
  data: OverviewStreakHeatmapData;
};

type FormatHeatmapDateParams = {
  dateStr: string;
};

function formatHeatmapDate({ dateStr }: FormatHeatmapDateParams): string {
  try {
    const parts = dateStr.split("-");
    const year = parseInt(parts[0] || "", 10);
    const month = parseInt(parts[1] || "", 10);
    const day = parseInt(parts[2] || "", 10);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

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

  const displayMonthLabels = monthLabels.filter((ml, idx) => {
    const next = monthLabels[idx + 1];
    if (next && next.colIndex - ml.colIndex < 2) {
      return false;
    }
    return true;
  });

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
          <Flame className="size-4 text-primary fill-primary" />
          <span>Reading Streak</span>
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {!isTodayCompleted && timeLeftUntilMidnight ? (
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 shrink-0">
              <Clock className="size-3.5" />
              <span className="tabular-nums font-semibold">{timeLeftUntilMidnight} left</span>
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
              Completed today
            </span>
          )}
        </div>
      </div>

      {/* Top Visuals: Current Week Strip + Calendar Heatmap */}
      <div className="flex flex-col gap-2 min-[1440px]:gap-3 pt-1 shrink-0">
        {/* Mon-Sun Week Strip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 w-full">
          {weekDays.map((day) => {
            let badgeStyle =
              "border border-border text-muted-foreground bg-transparent";
            if (day.isRead) {
              badgeStyle =
                "bg-primary text-primary-foreground border-transparent shadow-2xs font-semibold";
            } else if (day.isFrozen) {
              badgeStyle =
                "border border-dashed border-primary/60 bg-primary/10 text-primary font-medium";
            } else if (day.isMissed) {
              badgeStyle =
                "border border-border/80 text-muted-foreground/60 bg-transparent";
            }

            const todayOutline = day.isToday
              ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
              : "";

            const dayNum = parseInt(day.dateStr.split("-")[2] || "1", 10);

            return (
              <div
                key={day.dateStr}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[10px] min-[1440px]:text-xs font-medium text-muted-foreground leading-none">
                  {day.dayLabel.charAt(0)}
                </span>
                <div
                  className={cn(
                    "flex size-6 sm:size-7 min-[1440px]:size-8 items-center justify-center rounded-full text-[10px] min-[1440px]:text-xs tabular-nums transition-all",
                    badgeStyle,
                    todayOutline
                  )}
                  title={`${day.dayLabel} (${formatHeatmapDate({ dateStr: day.dateStr })}): ${
                    day.isRead
                      ? "Read"
                      : day.isFrozen
                        ? "Streak Freeze Used"
                        : day.isToday
                          ? "Today"
                          : "Missed"
                  }`}
                >
                  {dayNum}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini Calendar Heatmap */}
        <div className="w-full">
          {/* Month labels header */}
          <div className="flex items-center gap-1.5 w-full mb-1">
            <div className="w-6 shrink-0" />
            <div className="relative flex-1 h-3.5">
              {displayMonthLabels.map((ml) => {
                const isLateMonth = ml.colIndex >= 14;
                return (
                  <span
                    key={`month-${ml.colIndex}-${ml.label}`}
                    className="absolute text-[10px] font-medium text-muted-foreground leading-none"
                    style={{
                      left: isLateMonth
                        ? undefined
                        : `${(ml.colIndex / 16) * 100}%`,
                      right: isLateMonth ? 0 : undefined,
                    }}
                  >
                    {ml.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Grid: 7 rows with Mon/Wed/Fri labels on left, 16 columns of days */}
          <div className="flex items-center gap-1.5 w-full">
            <div className="w-6 shrink-0 grid grid-rows-7 gap-1 min-[1440px]:gap-1.5 pr-1 text-[9px] min-[1440px]:text-[10px] font-medium text-muted-foreground h-[70px] sm:h-[76px] min-[1440px]:h-[95px] 2xl:h-[115px]">
              <span className="flex items-center justify-end leading-none">
                Mon
              </span>
              <span />
              <span className="flex items-center justify-end leading-none">
                Wed
              </span>
              <span />
              <span className="flex items-center justify-end leading-none">
                Fri
              </span>
              <span />
              <span />
            </div>

            {/* Heatmap 16 Columns */}
            <div className="grid grid-cols-16 gap-1 min-[1440px]:gap-1.5 flex-1 h-[70px] sm:h-[76px] min-[1440px]:h-[95px] 2xl:h-[115px]">
              {heatmapWeeks.map((week, wIdx) => (
                <div
                  key={`week-${wIdx}`}
                  className="grid grid-rows-7 gap-1 min-[1440px]:gap-1.5 h-full"
                >
                  {week.map((cell) => {
                    let cellBg = "bg-muted border border-border/50";
                    if (cell.isFrozen) {
                      cellBg =
                        "border border-dashed border-primary/60 bg-primary/20";
                    } else if (cell.level === 4) {
                      cellBg = "bg-primary border border-primary";
                    } else if (cell.level === 3) {
                      cellBg = "bg-primary/80 border border-transparent";
                    } else if (cell.level === 2) {
                      cellBg = "bg-primary/50 border border-transparent";
                    } else if (cell.level === 1) {
                      cellBg = "bg-primary/25 border border-transparent";
                    }

                    const todayOutline = cell.isToday
                      ? "ring-1.5 ring-primary ring-offset-1 ring-offset-card"
                      : "";

                    const formattedDate = formatHeatmapDate({
                      dateStr: cell.dateStr,
                    });
                    const statusText =
                      cell.count > 0
                        ? `${cell.count} chapter${cell.count === 1 ? "" : "s"}`
                        : cell.isFrozen
                          ? "Streak Freeze Used"
                          : cell.isToday
                            ? "Today (not read yet)"
                            : cell.isFuture
                              ? "Upcoming"
                              : "No reading logged";

                    return (
                      <div
                        key={cell.dateStr}
                        className={cn(
                          "w-full h-full rounded-[2.5px] transition-colors",
                          cellBg,
                          todayOutline
                        )}
                        title={`${formattedDate}: ${statusText}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric KPI Tiles */}
      <div className="grid grid-cols-3 divide-x divide-border/60 border-t border-border/60 pt-3 sm:pt-4 my-auto">
        {/* Metric 1: Current Streak */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-1.5 shadow-2xs">
            <Flame className="size-4.5 sm:size-5 fill-primary" />
          </div>
          <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {currentStreak}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">
            Current Days
          </span>
        </div>

        {/* Metric 2: Best Streak */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-muted border border-border text-foreground mb-1.5 shadow-2xs">
            <Trophy className="size-4.5 sm:size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {longestStreak}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">
            Best Record
          </span>
        </div>

        {/* Metric 3: Streak Freezes */}
        <div className="flex flex-col items-center text-center px-1">
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-muted border border-border text-sky-600 dark:text-sky-400 mb-1.5 shadow-2xs">
            <Snowflake className="size-4.5 sm:size-5" />
          </div>
          <span className="text-xl sm:text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
            {streakFreezes}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">
            Freezes Left
          </span>
        </div>
      </div>

      {/* Takeaway Line */}
      <div className="border-t border-border/60 pt-1.5 shrink-0">
        <p className="text-xs text-muted-foreground truncate">
          {takeaway}
        </p>
      </div>
    </div>
  );
}
