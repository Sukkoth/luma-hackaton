"use client";

import { X, Flame, Shield, Lock, CheckCircle2 } from "lucide-react";
import { shiftDateString } from "@/lib/timezone";

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

const NUM_WEEKS = 28; // ~7 months of continuous weekly activity columns

export function StreakDetailModal({ isOpen, onCloseAction, streak }: Props) {
  if (!isOpen) return null;

  const readingDatesSet = new Set(streak.readingDates ?? []);
  const frozenDatesSet = new Set(streak.frozenDates);

  // Compute total chapters read recorded in daily counts
  const totalChaptersRead = Object.values(
    streak.dailyChapterCounts ?? {}
  ).reduce((acc, curr) => acc + curr, 0);

  // Parse today's UTC day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const parts = streak.todayStr.split("-").map(Number);
  const todayDate = new Date(
    Date.UTC(parts[0] ?? 2026, (parts[1] ?? 1) - 1, parts[2] ?? 1, 12)
  );
  const todayDayOfWeek = todayDate.getUTCDay();

  // Find the Sunday of the current week, then step back (NUM_WEEKS - 1) full weeks
  const currentWeekSunday = shiftDateString({
    dateStr: streak.todayStr,
    daysOffset: -todayDayOfWeek,
  });
  const gridStartDate = shiftDateString({
    dateStr: currentWeekSunday,
    daysOffset: -(NUM_WEEKS - 1) * 7,
  });

  // Build the 28 week columns (each column contains 7 days: Sun = 0 to Sat = 6)
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
      const chaptersCount =
        streak.dailyChapterCounts?.[dateStr] ??
        (readingDatesSet.has(dateStr) ? 1 : 0);

      const dParts = dateStr.split("-").map(Number);
      const dObj = new Date(
        Date.UTC(dParts[0] ?? 2026, (dParts[1] ?? 1) - 1, dParts[2] ?? 1, 12)
      );
      const formattedDate = dObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      let tooltip = `No chapters on ${formattedDate}`;
      let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;

      if (chaptersCount > 0) {
        tooltip = `${chaptersCount} ${
          chaptersCount === 1 ? "chapter" : "chapters"
        } on ${formattedDate}`;
        if (chaptersCount === 1) intensityLevel = 1;
        else if (chaptersCount <= 3) intensityLevel = 2;
        else if (chaptersCount <= 6) intensityLevel = 3;
        else intensityLevel = 4;
      } else if (isFrozen) {
        tooltip = `Shielded by Streak Freeze on ${formattedDate}`;
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

  // Row labels for weekdays (Mon = 1, Wed = 3, Fri = 5)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="ui-card relative flex w-full max-w-xl flex-col p-4.5 shadow-2xl sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-[10px] border border-border bg-primary-muted text-primary">
              <Flame className="size-4.5 fill-current" />
            </div>
            <div>
              <h3
                id="streak-dialog-title"
                className="text-[16px] font-bold tracking-tight text-foreground"
              >
                Reading Habit Streak
              </h3>
              <p className="text-[11px] font-medium text-foreground-dim">
                Consecutive daily reading rhythm
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close streak dialog"
            onClick={onCloseAction}
            className="rounded-xl p-1.5 text-foreground-dim hover:bg-surface-elevated hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Section - Compact, strictly non-scrollable */}
        <div className="my-3 space-y-2.5">
          {/* Top Row: Side-by-side Streak Counter & Freeze Shields */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Current Streak Tile */}
            <div className="ui-card-elevated flex flex-col justify-between p-3 text-center">
              <div>
                <span className="text-[10px] font-medium tracking-wider text-foreground-dim uppercase">
                  Current Streak
                </span>
                <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
                  <span className="text-[32px] font-medium tracking-tight text-foreground">
                    {streak.currentStreak}
                  </span>
                  <span className="text-[13px] font-normal text-foreground-secondary">
                    {streak.currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-center">
                  {streak.isTodayCompleted ? (
                    <span className="ui-pill-primary text-[10px]">
                      <CheckCircle2 className="size-3" />
                      Read completed today
                    </span>
                  ) : (
                    <span className="ui-pill text-[10px]">
                      Read a chapter today to keep streak active
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 border-t border-border-subtle pt-1.5 text-[10px] text-foreground-dim">
                Record:{" "}
                <strong className="font-semibold text-foreground">
                  {streak.longestStreak} days
                </strong>
              </div>
            </div>

            {/* Streak Freeze Shields Tile */}
            <div className="ui-card-elevated flex flex-col justify-between p-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-3.5 text-foreground" />
                    <h4 className="text-[12px] font-medium text-foreground">
                      Freeze Shields
                    </h4>
                  </div>
                  <span className="text-[10px] font-medium text-foreground-dim">
                    {streak.isFreezeUnlocked
                      ? `${streak.availableFreezes}/3 Available`
                      : "Locked"}
                  </span>
                </div>

                {streak.isFreezeUnlocked ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((idx) => {
                        const isAvailable = idx < streak.availableFreezes;
                        return (
                          <div
                            key={idx}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-1 text-[10px] font-medium transition-all ${
                              isAvailable
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface text-foreground-dim"
                            }`}
                          >
                            <Shield className="size-2.5" />
                            <span>{isAvailable ? "Active" : "Used"}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[10px] text-foreground-dim">
                      {streak.availableFreezes < 3
                        ? `3 consecutive days restore 1 shield (${streak.freezeRestorationDaysCount}/3d).`
                        : "Shields automatically protect up to 3 missed days."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-1.5 rounded-lg border border-border bg-surface p-2 text-[11px] text-foreground-secondary">
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <Lock className="size-3 text-warning" />
                      <span>Unlocks at 7-day streak</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-foreground-dim">
                      Build 7 consecutive days to unlock (Currently:{" "}
                      {streak.currentStreak}/7 days).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Heatmap Card */}
          <div className="ui-card-elevated p-3.5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <div>
                <h4 className="text-[12px] font-medium text-black dark:text-white">
                  Reading Activity History
                </h4>
                <p className="text-[10px] text-[#777777] dark:text-[#9CA3AF]">
                  {totalChaptersRead}{" "}
                  {totalChaptersRead === 1 ? "chapter" : "chapters"} read across
                  the last {NUM_WEEKS} weeks
                </p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-1 text-[10px] text-foreground-dim">
                <span>Less</span>
                <span
                  title="0 chapters"
                  className="size-2.5 rounded-xs bg-border-subtle"
                />
                <span
                  title="1 chapter"
                  className="size-2.5 rounded-xs bg-border-strong opacity-40"
                />
                <span
                  title="2-3 chapters"
                  className="size-2.5 rounded-xs bg-border-strong opacity-70"
                />
                <span
                  title="4-6 chapters"
                  className="size-2.5 rounded-xs bg-border-strong"
                />
                <span
                  title="7+ chapters"
                  className="size-2.5 rounded-xs bg-primary"
                />
                <span>More</span>
                <span className="mx-1 opacity-40">•</span>
                <span
                  title="Shielded with Freeze"
                  className="size-2.5 rounded-xs border border-border-strong bg-surface-elevated"
                />
                <span>Shield</span>
              </div>
            </div>

            {/* Matrix Container - 100% full width unified grid */}
            <div
              className="mt-2.5 grid w-full items-center gap-0.5 py-1 sm:gap-0.75"
              style={{
                gridTemplateColumns: `auto repeat(${NUM_WEEKS}, minmax(0, 1fr))`,
                gridTemplateRows: `14px repeat(7, minmax(0, 1fr))`,
              }}
            >
              {/* Row 1: Month labels */}
              {columns.map((col) => {
                if (!col.monthLabel) return null;
                return (
                  <span
                    key={`month-${col.weekIndex}`}
                    style={{
                      gridColumnStart: col.weekIndex + 2,
                      gridRowStart: 1,
                    }}
                    className="overflow-visible text-[9px] font-medium leading-none whitespace-nowrap text-[#888888] select-none dark:text-[#777777]"
                  >
                    {col.monthLabel}
                  </span>
                );
              })}

              {/* Column 1: Weekday Labels (Mon = row 3, Wed = row 5, Fri = row 7) */}
              {WEEKDAY_ROW_LABELS.map(({ dayIndex, label }) => (
                <span
                  key={label}
                  style={{
                    gridColumnStart: 1,
                    gridRowStart: dayIndex + 2,
                  }}
                  className="pr-1 text-[9px] font-medium leading-none text-[#888888] select-none dark:text-[#777777]"
                  aria-hidden="true"
                >
                  {label}
                </span>
              ))}

              {/* Columns 2..29, Rows 2..8: The 28x7 Cells */}
              {columns.flatMap((col) =>
                col.days.map((day) => {
                  if (day.isFuture) {
                    return (
                      <span
                        key={day.dateStr}
                        style={{
                          gridColumnStart: col.weekIndex + 2,
                          gridRowStart: day.dayOfWeek + 2,
                        }}
                        className="aspect-square w-full rounded-xs opacity-0"
                        aria-hidden="true"
                      />
                    );
                  }

                  let cellClass =
                    "bg-border-subtle hover:ring-1 hover:ring-border-strong";

                  if (day.isFrozen) {
                    cellClass =
                      "border border-border-strong bg-surface-elevated";
                  } else if (day.chaptersCount > 0) {
                    if (day.intensityLevel === 1) {
                      cellClass =
                        "bg-border-strong opacity-40 hover:opacity-90";
                    } else if (day.intensityLevel === 2) {
                      cellClass =
                        "bg-border-strong opacity-70 hover:opacity-90";
                    } else if (day.intensityLevel === 3) {
                      cellClass = "bg-border-strong hover:opacity-90";
                    } else {
                      // Level 4 (7+ chapters)
                      cellClass = "bg-primary hover:opacity-90";
                    }
                  }

                  return (
                    <div
                      key={day.dateStr}
                      title={day.tooltip}
                      style={{
                        gridColumnStart: col.weekIndex + 2,
                        gridRowStart: day.dayOfWeek + 2,
                      }}
                      className={`aspect-square w-full rounded-xs transition-all hover:scale-125 sm:rounded-[2.5px] ${cellClass} ${
                        day.isToday ? "ring-1 ring-inset ring-primary" : ""
                      }`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border-subtle pt-3 text-right">
          <button
            type="button"
            onClick={onCloseAction}
            className="ui-btn-primary ui-btn-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
