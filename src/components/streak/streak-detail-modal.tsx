"use client";

import { Flame, Shield, Lock, Trophy } from "lucide-react";
import { shiftDateString } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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

    const colParts = weekSundayDateStr.split("-").map(Number);
    const colDate = new Date(
      Date.UTC(colParts[0] ?? 2026, (colParts[1] ?? 1) - 1, colParts[2] ?? 1, 12)
    );
    const dayOfMonth = colDate.getUTCDate();

    let monthLabel: string | undefined = undefined;
    if (dayOfMonth <= 7) {
      monthLabel = colDate.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      });
    }

    for (let d = 0; d < 7; d++) {
      const cellDateStr = shiftDateString({
        dateStr: weekSundayDateStr,
        daysOffset: d,
      });

      const isFuture = cellDateStr > streak.todayStr;
      const isToday = cellDateStr === streak.todayStr;
      const isFrozen = frozenDatesSet.has(cellDateStr);
      const hasRead = readingDatesSet.has(cellDateStr);
      const chaptersCount = streak.dailyChapterCounts?.[cellDateStr] ?? 0;

      let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
      if (chaptersCount >= 7) intensityLevel = 4;
      else if (chaptersCount >= 4) intensityLevel = 3;
      else if (chaptersCount >= 2) intensityLevel = 2;
      else if (chaptersCount >= 1 || hasRead) intensityLevel = 1;

      let tooltip = `${cellDateStr}: No reading`;
      if (isToday && !hasRead) {
        tooltip = `${cellDateStr} (Today): Keep your rhythm!`;
      } else if (isFrozen) {
        tooltip = `${cellDateStr}: Streak freeze shield used`;
      } else if (chaptersCount > 0) {
        tooltip = `${cellDateStr}: ${chaptersCount} ${
          chaptersCount === 1 ? "chapter" : "chapters"
        } read`;
      }

      days.push({
        dateStr: cellDateStr,
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
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onCloseAction(); }}>
      <SheetContent
        side="bottom"
        showHandle={true}
        showCloseButton={true}
        className="max-h-[88dvh] max-w-2xl sm:mx-auto rounded-t-[28px] border-border/80 bg-card p-0 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Sheet Top Header */}
        <div className="px-5 pt-1 pb-3 border-b border-border/60 shrink-0">
          <SheetHeader className="flex flex-row items-center gap-3 space-y-0 pr-8">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Flame className="size-5 fill-primary" />
            </div>
            <div className="space-y-0.5">
              <SheetTitle
                id="streak-dialog-title"
                className="text-base font-bold tracking-tight text-foreground"
              >
                Reading Habit Streak
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Consecutive daily reading rhythm & momentum
              </SheetDescription>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable Body - Optimized for Mobile Thumb Reach and Responsiveness */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain pb-8 sm:pb-6">
          {/* Top Row: Side-by-side Streak Counter & Freeze Shields */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Current Streak Card */}
            <div className="rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-500/12 via-amber-500/[0.03] to-surface-elevated p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Flame className="size-3.5 text-primary" />
                    Current Streak
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/60">
                    <Trophy className="size-3 text-muted-foreground" />
                    Best: <strong className="font-semibold text-foreground">{streak.longestStreak}d</strong>
                  </span>
                </div>

                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {streak.currentStreak}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {streak.currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Personal best:{" "}
                  <strong className="font-semibold text-foreground">
                    {streak.longestStreak} days
                  </strong>
                </p>
              </div>
            </div>

            {/* Streak Freeze Shields Card */}
            <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/12 via-primary/[0.03] to-surface-elevated p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Shield className="size-3.5 text-primary" />
                    Freeze Shields
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/60">
                    {streak.isFreezeUnlocked ? "Active" : "Locked"}
                  </span>
                </div>

                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {streak.isFreezeUnlocked ? streak.availableFreezes : 0}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {streak.isFreezeUnlocked ? "of 3 available" : "available"}
                  </span>
                </div>
              </div>

              <div>
                {streak.isFreezeUnlocked ? (
                  <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2 text-xs text-muted-foreground">
                    {streak.availableFreezes < 3
                      ? `3 consecutive days restore 1 shield (${streak.freezeRestorationDaysCount}/3d).`
                      : "Shields automatically protect up to 3 missed days."}
                  </div>
                ) : (
                  <div className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2 text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Lock className="size-3.5 text-primary" />
                        Unlocks at 7-day streak
                      </span>
                      <span className="text-primary tabular-nums">
                        {Math.min(streak.currentStreak, 7)}/7
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Build 7 consecutive days to unlock 3 shields.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Heatmap Card - With smooth horizontal scroll on mobile */}
          <div className="rounded-2xl border border-border/70 bg-surface-elevated p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Reading Activity History
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">
                    {totalChaptersRead}
                  </span>{" "}
                  {totalChaptersRead === 1 ? "chapter" : "chapters"} read across
                  the last {NUM_WEEKS} weeks
                </p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground self-start sm:self-center">
                <span>Less</span>
                <span title="0 chapters" className="size-2.5 rounded-xs bg-muted border border-border/80" />
                <span title="1 chapter" className="size-2.5 rounded-xs bg-primary/25" />
                <span title="2-3 chapters" className="size-2.5 rounded-xs bg-primary/50" />
                <span title="4-6 chapters" className="size-2.5 rounded-xs bg-primary/80" />
                <span title="7+ chapters" className="size-2.5 rounded-xs bg-primary" />
                <span>More</span>
              </div>
            </div>

            {/* Matrix Container: Horizontal scrolling on mobile prevents crushed cells */}
            <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
              <div
                className="grid min-w-[540px] w-full items-center gap-0.5 py-1"
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
                          "aspect-square w-full rounded-[2px] transition-transform hover:scale-125 cursor-default",
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

        {/* Bottom Action Footer for Mobile & Desktop */}
        <div className="px-5 py-3 border-t border-border/60 bg-card shrink-0 flex items-center justify-end">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onCloseAction}
            className="w-full sm:w-auto rounded-xl font-semibold px-6"
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
