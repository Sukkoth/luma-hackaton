import { getDaysDifference, shiftDateString } from "./timezone";

export type StreakEvaluationParams = {
  readingDates: Set<string>;
  todayStr: string;
  previousLongestStreak?: number;
  existingFrozenDates?: Set<string>;
};

export type StreakEvaluationResult = {
  currentStreak: number;
  longestStreak: number;
  availableFreezes: number;
  freezeRestorationDaysCount: number;
  frozenDates: string[];
  isTodayCompleted: boolean;
  isFreezeUnlocked: boolean;
  consecutiveFreezesUsed: number;
};

export const MAX_FREEZE_SHIELDS = 3;
export const FREEZE_UNLOCK_THRESHOLD = 7;
export const DAYS_TO_RESTORE_FREEZE = 3;

/**
 * Pure evaluation function that calculates habit streak and freeze protections.
 *
 * Rules:
 * 1. Freezes unlock ONLY when user achieves a streak of >= 7 consecutive reading days.
 * 2. An eligible user can use up to 3 freezes consecutively (e.g. days 8, 9, 10 if break at 7).
 * 3. Freezes ONLY preserve active streaks; they are NOT counted as streak days themselves.
 * 4. Every 3 consecutive active reading days restores +1 freeze shield (capped at 3).
 * 5. If > 3 consecutive days are missed, or if a day is missed when streak < 7, streak breaks to 0.
 * 6. Today has a grace period until midnight local time (not counted as missed yet).
 */
export function evaluateUserStreak({
  readingDates,
  todayStr,
  previousLongestStreak = 0,
  existingFrozenDates,
}: StreakEvaluationParams): StreakEvaluationResult {
  const isTodayCompleted = readingDates.has(todayStr);

  const sortedReadingDates = Array.from(readingDates)
    .filter((d) => d <= todayStr)
    .sort();

  if (sortedReadingDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: previousLongestStreak,
      availableFreezes: 0,
      freezeRestorationDaysCount: 0,
      frozenDates: [],
      isTodayCompleted: false,
      isFreezeUnlocked: false,
      consecutiveFreezesUsed: 0,
    };
  }

  const frozenDatesSet = new Set<string>(existingFrozenDates ?? []);
  let currentStreak = 0;
  let longestStreak = previousLongestStreak;
  let availableFreezes = 0;
  let freezeRestorationDaysCount = 0;
  let consecutiveFreezesUsed = 0;

  let cursorDate = sortedReadingDates[0]!;

  while (cursorDate <= todayStr) {
    // If today is reached and user hasn't read yet today, today is in progress (grace period)
    if (cursorDate === todayStr && !readingDates.has(todayStr)) {
      break;
    }

    if (readingDates.has(cursorDate)) {
      // User completed reading on cursorDate
      consecutiveFreezesUsed = 0;
      currentStreak += 1;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      if (currentStreak === FREEZE_UNLOCK_THRESHOLD) {
        // Unlocked! Initialized to max freeze shields
        availableFreezes = MAX_FREEZE_SHIELDS;
        freezeRestorationDaysCount = 0;
      } else if (currentStreak > FREEZE_UNLOCK_THRESHOLD) {
        // Once unlocked, every 3 consecutive reading days restores 1 shield
        if (availableFreezes < MAX_FREEZE_SHIELDS) {
          freezeRestorationDaysCount += 1;
          if (freezeRestorationDaysCount >= DAYS_TO_RESTORE_FREEZE) {
            availableFreezes = Math.min(
              MAX_FREEZE_SHIELDS,
              availableFreezes + 1
            );
            freezeRestorationDaysCount = 0;
          }
        } else {
          freezeRestorationDaysCount = 0;
        }
      }
    } else {
      // User did not read on this past calendar date
      const isEligibleForFreeze =
        currentStreak >= FREEZE_UNLOCK_THRESHOLD &&
        availableFreezes > 0 &&
        consecutiveFreezesUsed < MAX_FREEZE_SHIELDS;

      if (isEligibleForFreeze) {
        // Freeze shield consumes and protects streak (does not increment streak)
        consecutiveFreezesUsed += 1;
        availableFreezes -= 1;
        frozenDatesSet.add(cursorDate);
        freezeRestorationDaysCount = 0;
      } else {
        // Streak is broken
        currentStreak = 0;
        consecutiveFreezesUsed = 0;
        availableFreezes = 0;
        freezeRestorationDaysCount = 0;
      }
    }

    // Check if next date is far away (> 4 days gap with no readings)
    // Any gap > 4 days is guaranteed to break streak to 0, allowing an O(1) jump
    const nextDate = shiftDateString({ dateStr: cursorDate, daysOffset: 1 });
    if (nextDate <= todayStr && !readingDates.has(nextDate)) {
      const nextReadings = sortedReadingDates.filter((d) => d > cursorDate);
      if (nextReadings.length > 0) {
        const nextActive = nextReadings[0]!;
        const gap = getDaysDifference({
          startDateStr: cursorDate,
          endDateStr: nextActive,
        });
        if (gap > MAX_FREEZE_SHIELDS + 1) {
          // Streak broke during the gap
          currentStreak = 0;
          consecutiveFreezesUsed = 0;
          availableFreezes = 0;
          freezeRestorationDaysCount = 0;
          cursorDate = nextActive;
          continue;
        }
      }
    }

    cursorDate = nextDate;
  }

  const isFreezeUnlocked = currentStreak >= FREEZE_UNLOCK_THRESHOLD;

  return {
    currentStreak,
    longestStreak,
    availableFreezes,
    freezeRestorationDaysCount,
    frozenDates: Array.from(frozenDatesSet).sort(),
    isTodayCompleted,
    isFreezeUnlocked,
    consecutiveFreezesUsed,
  };
}
