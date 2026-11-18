"use client";

import { X, Flame, Shield, Lock, CheckCircle2 } from "lucide-react";
import { shiftDateString } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  availableFreezes: number;
  isFreezeUnlocked: boolean;
  isTodayCompleted: boolean;
  frozenDates: string[];
  freezeRestorationDaysCount: number;
  todayStr: string;
  readingDates?: string[];
  dailyChapterCounts?: Record<string, number>;
};

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  streak: StreakData;
};

const NUM_WEEKS = 28;

export function StreakDetailModal({ isOpen, onCloseAction, streak }: Props) {
  if (!isOpen) return null;

  const readingDatesSet = new Set(streak.readingDates ?? []);
  const frozenDatesSet = new Set(streak.frozenDates);

  const totalChaptersRead = Object.values(
    streak.dailyChapterCounts ?? {}
  ).reduce((acc, curr) => acc + curr, 0);

  const parts = streak.todayStr.split("-").map(Number);
  const todayDate = new Date(
    Date.UTC(parts[0] ?? 2026, (parts[1] ?? 1) - 1, parts[2] ?? 1, 12)
  );
  const todayDayOfWeek = todayDate.getUTCDay();

  const currentWeekSunday = shiftDateString({
    dateStr: streak.todayStr,
    daysOffset: -todayDayOfWeek,
  });
  const gridStartDate = shiftDateString({
    dateStr: currentWeekSunday,
    daysOffset: -(NUM_WEEKS - 1) * 7,
  });

  type GridDay = {
    dateStr: string;
    dayOfWeek: number;
    chaptersCount: number;
    isFrozen: boolean;
    isToday: boolean;
    isFuture: boolean;
    tooltip: string;
    intensityLevel: 0 | 1 | 2 | 3 | 4;
  };

  type WeekColumn = {
    weekIndex: number;
    days: GridDay[];
    monthLabel?: string;
  };

  const columns: WeekColumn[] = [];

  for (let w = 0; w < NUM_WEEKS; w++) {
    const days: GridDay[] = [];
    const weekSundayDateStr = shiftDateString({
      dateStr: gridStartDate,
      daysOffset: w * 7,
    });
    const sParts = weekSundayDateStr.split("-").map(Number);
    const sObj = new Date(
      Date.UTC(sParts[0] ?? 2026, (sParts[1] ?? 1) - 1, sParts[2] ?? 1, 12)
    );
    const currentMonth = sObj.toLocaleDateString("en-US", { month: "short" });

    let monthLabel: string | undefined = undefined;
    if (w % 4 === 0) {
      monthLabel = currentMonth;
    }

    for (let d = 0; d < 7; d++) {
      const dateStr = shiftDateString({
        dateStr: weekSundayDateStr,
        daysOffset: d,
      });
      const isFuture = dateStr > streak.todayStr;
      const isToday = dateStr === streak.todayStr;
      const isFrozen = frozenDatesSet.has(dateStr);
      const chaptersCount = streak.dailyChapterCounts?.[dateStr] ?? 0;
      const hasRead = chaptersCount > 0 || readingDatesSet.has(dateStr);

      let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
      if (hasRead) {
        if (chaptersCount >= 7) intensityLevel = 4;
        else if (chaptersCount >= 4) intensityLevel = 3;
        else if (chaptersCount >= 2) intensityLevel = 2;
        else intensityLevel = 1;
      }

      let tooltip = `${dateStr}: No reading recorded`;
      if (isFuture) {
        tooltip = `${dateStr}: Upcoming`;
      } else if (isFrozen) {
        tooltip = `${dateStr}: Protected by Streak Freeze`;
      } else if (hasRead) {
        tooltip = `${dateStr}: ${chaptersCount || 1} chapter${chaptersCount === 1 ? "" : "s"} read`;
      }

      days.push({
        dateStr,
        dayOfWeek: d,
        chaptersCount,
        isFrozen,
        isToday,
        isFuture,
        tooltip,
        intensityLevel,
      });
    }

    columns.push({
      weekIndex: w,
      days,
      monthLabel,
    });
  }

  const WEEKDAY_ROW_LABELS = [
    { dayIndex: 1, label: "Mon" },
    { dayIndex: 3, label: "Wed" },
    { dayIndex: 5, label: "Fri" },
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4 animate-in fade-in"
    >
      <div className="ui-card relative flex w-full max-w-xl flex-col p-5 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Flame className="size-5 fill-primary" />
            </div>
            <div>
              <h3
                id="streak-dialog-title"
                className="text-base font-bold tracking-tight text-foreground"
              >
                Reading Habit Streak
              </h3>
              <p className="text-xs text-muted-foreground">
                Consecutive daily reading rhythm & momentum
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close streak dialog"
            onClick={onCloseAction}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="my-4 space-y-3">
          {/* Top Row: Side-by-side Streak Counter & Freeze Shields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Current Streak Tile */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">
                  Current Streak
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {streak.currentStreak}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {streak.currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-center">
                  {streak.isTodayCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      Completed today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                      Read today to keep streak active
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                Personal best:{" "}
                <strong className="font-semibold text-foreground">
                  {streak.longestStreak} days
                </strong>
              </div>
            </div>

            {/* Streak Freeze Shields Tile */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-4 text-sky-600 dark:text-sky-400" />
                    <h4 className="text-xs font-semibold text-foreground">
                      Freeze Shields
                    </h4>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {streak.isFreezeUnlocked
                      ? `${streak.availableFreezes}/3 Available`
                      : "Locked"}
                  </span>
                </div>

                {streak.isFreezeUnlocked ? (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((idx) => {
                        const isAvailable = idx < streak.availableFreezes;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-semibold transition-all",
                              isAvailable
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground/60"
                            )}
                          >
                            <Shield className="size-3" />
                            <span>{isAvailable ? "Active" : "Used"}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                      {streak.availableFreezes < 3
                        ? `3 consecutive days restore 1 shield (${streak.freezeRestorationDaysCount}/3d).`
                        : "Shields automatically protect up to 3 missed days."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2.5 rounded-xl border border-border bg-card p-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-semibold text-foreground">
                      <Lock className="size-3.5 text-primary" />
                      <span>Unlocks at 7-day streak</span>
                    </div>
                    <p className="mt-1 text-[11px]">
                      Build 7 consecutive days to unlock (Currently:{" "}
                      {streak.currentStreak}/7 days).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Heatmap Card */}
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Reading Activity History
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {totalChaptersRead}{" "}
                  {totalChaptersRead === 1 ? "chapter" : "chapters"} read across
                  the last {NUM_WEEKS} weeks
                </p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>Less</span>
                <span title="0 chapters" className="size-2 rounded-xs bg-muted border border-border" />
                <span title="1 chapter" className="size-2 rounded-xs bg-primary/25" />
                <span title="2-3 chapters" className="size-2 rounded-xs bg-primary/50" />
                <span title="4-6 chapters" className="size-2 rounded-xs bg-primary/80" />
                <span title="7+ chapters" className="size-2 rounded-xs bg-primary" />
                <span>More</span>
              </div>
            </div>

            {/* Matrix Container */}
            <div
              className="mt-3 grid w-full items-center gap-0.5 py-1"
              style={{
                gridTemplateColumns: `auto repeat(${NUM_WEEKS}, minmax(0, 1fr))`,
                gridTemplateRows: `14px repeat(7, minmax(0, 1fr))`,
              }}
            >
              {/* Row 1: Month labels */}
              {columns.map((col) => {
                if (!col.monthLabel) return null;
                return (
                  <div
                    key={`header-${col.weekIndex}`}
                    className="text-[9px] font-medium text-muted-foreground leading-none overflow-visible whitespace-nowrap"
                    style={{
                      gridColumnStart: col.weekIndex + 2,
                      gridRowStart: 1,
                    }}
                  >
                    {col.monthLabel}
                  </div>
                );
              })}

              {/* Col 1: Day of Week labels */}
              {WEEKDAY_ROW_LABELS.map((row) => (
                <div
                  key={`day-label-${row.dayIndex}`}
                  className="pr-1.5 text-right text-[9px] font-medium text-muted-foreground leading-none"
                  style={{
                    gridColumnStart: 1,
                    gridRowStart: row.dayIndex + 2,
                  }}
                >
                  {row.label}
                </div>
              ))}

              {/* Days Grid Cells */}
              {columns.map((col) =>
                col.days.map((day) => {
                  let cellBg = "bg-muted border border-border/60";
                  if (day.isFuture) {
                    cellBg = "bg-transparent border border-transparent";
                  } else if (day.isFrozen) {
                    cellBg =
                      "border border-dashed border-primary/60 bg-primary/20";
                  } else if (day.intensityLevel === 4) {
                    cellBg = "bg-primary border border-primary";
                  } else if (day.intensityLevel === 3) {
                    cellBg = "bg-primary/80 border border-transparent";
                  } else if (day.intensityLevel === 2) {
                    cellBg = "bg-primary/50 border border-transparent";
                  } else if (day.intensityLevel === 1) {
                    cellBg = "bg-primary/25 border border-transparent";
                  }

                  const todayRing = day.isToday
                    ? "ring-1.5 ring-primary ring-offset-1 ring-offset-card"
                    : "";

                  return (
                    <div
                      key={day.dateStr}
                      title={day.tooltip}
                      className={cn(
                        "aspect-square w-full rounded-[2px] transition-transform hover:scale-125",
                        cellBg,
                        todayRing
                      )}
                      style={{
                        gridColumnStart: col.weekIndex + 2,
                        gridRowStart: day.dayOfWeek + 2,
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
