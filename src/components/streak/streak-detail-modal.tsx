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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="glass-panel relative flex w-full max-w-xl flex-col rounded-3xl border border-white/90 bg-white p-4.5 shadow-2xl backdrop-blur-2xl sm:p-5 dark:border-white/10 dark:bg-[#121215]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/6 pb-3 dark:border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[#DDFD2C]/25 text-black dark:bg-[#DDFD2C]/20 dark:text-[#DDFD2C]">
              <Flame className="size-4.5 fill-[#a6c710] text-[#8fa80c] dark:fill-[#DDFD2C] dark:text-[#DDFD2C]" />
            </div>
            <div>
              <h3
                id="streak-dialog-title"
                className="text-[16px] font-medium tracking-tight text-black dark:text-white"
              >
                Reading Habit Streak
              </h3>
              <p className="text-[11px] text-[#666666] dark:text-[#9CA3AF]">
                Consecutive daily reading rhythm
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close streak dialog"
            onClick={onCloseAction}
            className="flex size-7.5 items-center justify-center rounded-xl bg-black/5 text-[#555555] transition-colors hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-[#9CA3AF] dark:hover:bg-white/20 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Section - Compact, strictly non-scrollable */}
        <div className="my-3 space-y-2.5">
          {/* Top Row: Side-by-side Streak Counter & Freeze Shields */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {/* Current Streak Tile */}
            <div className="flex flex-col justify-between rounded-2xl border border-black/6 bg-white/70 p-3 text-center shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/4">
              <div>
                <span className="text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
                  Current Streak
                </span>
                <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
                  <span className="text-[32px] font-medium tracking-tight text-black dark:text-[#DDFD2C]">
                    {streak.currentStreak}
                  </span>
                  <span className="text-[13px] font-normal text-[#666666] dark:text-[#9CA3AF]">
                    {streak.currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-center">
                  {streak.isTodayCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#DDFD2C]/30 px-2 py-0.5 text-[10px] font-semibold text-black dark:bg-[#DDFD2C]/20 dark:text-[#DDFD2C]">
                      <CheckCircle2 className="size-3" />
                      Read completed today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-[#666666] dark:bg-white/5 dark:text-[#9CA3AF]">
                      Read a chapter today to keep streak active
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 border-t border-black/4 pt-1.5 text-[10px] text-[#777777] dark:border-white/6 dark:text-[#9CA3AF]">
                Record:{" "}
                <strong className="font-semibold text-black dark:text-[#DDFD2C]">
                  {streak.longestStreak} days
                </strong>
              </div>
            </div>

            {/* Streak Freeze Shields Tile */}
            <div className="flex flex-col justify-between rounded-2xl border border-black/6 bg-white/70 p-3 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="size-3.5 text-[#82ADD4]" />
                    <h4 className="text-[12px] font-medium text-black dark:text-white">
                      Freeze Shields
                    </h4>
                  </div>
                  <span className="text-[10px] font-medium text-[#777777] dark:text-[#9CA3AF]">
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
                                ? "border-[#82ADD4]/40 bg-[#82ADD4]/15 text-[#507ea6] dark:border-[#82ADD4]/40 dark:bg-[#82ADD4]/25 dark:text-[#82ADD4]"
                                : "border-black/6 bg-black/4 text-[#999999] dark:border-white/6 dark:bg-white/3 dark:text-[#777777]"
                            }`}
                          >
                            <Shield className="size-2.5" />
                            <span>{isAvailable ? "Active" : "Used"}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#777777] dark:text-[#9CA3AF]">
                      {streak.availableFreezes < 3
                        ? `3 consecutive days restore 1 shield (${streak.freezeRestorationDaysCount}/3d).`
                        : "Shields automatically protect up to 3 missed days."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-1.5 rounded-lg border border-black/5 bg-black/3 p-2 text-[11px] text-[#666666] dark:border-white/6 dark:bg-white/2 dark:text-[#9CA3AF]">
                    <div className="flex items-center gap-1 font-medium text-black dark:text-white">
                      <Lock className="size-3 text-amber-500" />
                      <span>Unlocks at 7-day streak</span>
                    </div>
                    <p className="mt-0.5 text-[10px]">
                      Build 7 consecutive days to unlock (Currently:{" "}
                      {streak.currentStreak}/7 days).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Heatmap Card */}
          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/4">
            <div className="flex items-center justify-between border-b border-black/4 pb-2 dark:border-white/6">
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
              <div className="flex items-center gap-1 text-[10px] text-[#777777] dark:text-[#9CA3AF]">
                <span>Less</span>
                <span
                  title="0 chapters"
                  className="size-2.5 rounded-xs bg-black/5 dark:bg-[#181a1b] dark:border dark:border-white/5"
                />
                <span
                  title="1 chapter"
                  className="size-2.5 rounded-xs bg-[#DDFD2C]/35 border border-[#b8d617]/50 dark:bg-[#DDFD2C]/20 dark:border-[#DDFD2C]/30"
                />
                <span
                  title="2-3 chapters"
                  className="size-2.5 rounded-xs bg-[#DDFD2C]/65 border border-[#a2bf10]/65 dark:bg-[#DDFD2C]/45 dark:border-[#DDFD2C]/55"
                />
                <span
                  title="4-6 chapters"
                  className="size-2.5 rounded-xs bg-[#c3e31c] border border-[#8fa80c] dark:bg-[#DDFD2C]/75 dark:border-[#DDFD2C]"
                />
                <span
                  title="7+ chapters"
                  className="size-2.5 rounded-xs bg-[#a4c210] border border-[#788f06] dark:bg-[#DDFD2C] dark:border-[#c6e625]"
                />
                <span>More</span>
                <span className="mx-1 opacity-40">•</span>
                <span
                  title="Shielded with Freeze"
                  className="size-2.5 rounded-xs bg-cyan-400 ring-1 ring-cyan-300"
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
                    "bg-black/5 dark:bg-[#181a1b] dark:border dark:border-white/5 hover:ring-1 hover:ring-black/20 dark:hover:border-white/20";

                  if (day.isFrozen) {
                    cellClass =
                      "bg-cyan-400 dark:bg-cyan-400 ring-1 ring-cyan-300 shadow-2xs";
                  } else if (day.chaptersCount > 0) {
                    if (day.intensityLevel === 1) {
                      cellClass =
                        "bg-[#DDFD2C]/35 border border-[#b8d617]/50 dark:bg-[#DDFD2C]/20 dark:border-[#DDFD2C]/30 hover:opacity-90";
                    } else if (day.intensityLevel === 2) {
                      cellClass =
                        "bg-[#DDFD2C]/65 border border-[#a2bf10]/65 dark:bg-[#DDFD2C]/45 dark:border-[#DDFD2C]/55 hover:opacity-90";
                    } else if (day.intensityLevel === 3) {
                      cellClass =
                        "bg-[#c3e31c] border border-[#8fa80c] dark:bg-[#DDFD2C]/75 dark:border-[#DDFD2C] hover:opacity-90";
                    } else {
                      // Level 4 (7+ chapters)
                      cellClass =
                        "bg-[#a4c210] border border-[#788f06] dark:bg-[#DDFD2C] dark:border-[#c6e625] shadow-[0_0_6px_rgba(221,253,44,0.35)]";
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
                        day.isToday
                          ? "ring-1 ring-inset ring-black/20 dark:ring-inset dark:ring-white/25"
                          : ""
                      }`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-black/6 pt-2.5 text-right dark:border-white/8">
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-xl bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
