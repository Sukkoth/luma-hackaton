import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userSettings, readingLogs } from "@/db/schema";
import { createNotificationAction } from "@/actions/notifications";
import { getLocalDateString } from "./timezone";
import { evaluateUserStreak, type StreakEvaluationResult } from "./streak";

export type UserStreakData = StreakEvaluationResult & {
  todayStr: string;
  readingDates: string[];
  dailyChapterCounts: Record<string, number>;
};

export type SyncUserStreakParams = {
  userId: string;
  timeZoneOverride?: string;
};

export async function syncUserStreak({
  userId,
  timeZoneOverride,
}: SyncUserStreakParams): Promise<UserStreakData> {
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  const timeZone = timeZoneOverride || settings?.timezone || "UTC";
  const todayStr = getLocalDateString({ timeZone });

  // Query all reading log timestamps for this user
  const logs = await db.query.readingLogs.findMany({
    where: eq(readingLogs.userId, userId),
    columns: {
      loggedAt: true,
    },
  });

  // Map UTC timestamps to local calendar dates and compute chapters read per day
  const readingDates = new Set<string>();
  const dailyChapterCounts: Record<string, number> = {};
  for (const log of logs) {
    const localDate = getLocalDateString({ date: log.loggedAt, timeZone });
    readingDates.add(localDate);
    dailyChapterCounts[localDate] = (dailyChapterCounts[localDate] ?? 0) + 1;
  }

  // Parse existing frozen dates
  const frozenDates = new Set<string>();
  if (settings?.frozenDatesJson) {
    try {
      const parsed = JSON.parse(settings.frozenDatesJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string") frozenDates.add(item);
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const result = evaluateUserStreak({
    readingDates,
    todayStr,
    previousLongestStreak: settings?.longestStreak ?? 0,
    existingFrozenDates: frozenDates,
  });

  // Persist updated streak state if settings exist
  if (settings) {
    const updatedFrozenJson = JSON.stringify(result.frozenDates);
    const lastRead = result.isTodayCompleted ? todayStr : settings.lastReadDate;

    await db
      .update(userSettings)
      .set({
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        streakFreezesAvailable: result.availableFreezes,
        freezeRestorationDaysCount: result.freezeRestorationDaysCount,
        frozenDatesJson: updatedFrozenJson,
        lastReadDate: lastRead,
        timezone: timeZone,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));

    // Check if a streak freeze was newly consumed
    if (result.frozenDates.length > frozenDates.size) {
      await createNotificationAction({
        userId,
        input: {
          type: "freeze_used",
          title: "Streak Protected",
          body: "A streak freeze was automatically used to protect your reading streak.",
          actionUrl: "/home",
        },
      });
    }

    // Check if a streak milestone was reached
    const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100, 365];
    if (
      result.currentStreak > settings.currentStreak &&
      STREAK_MILESTONES.includes(result.currentStreak)
    ) {
      await createNotificationAction({
        userId,
        input: {
          type: "streak_alert",
          title: `${result.currentStreak}-Day Streak!`,
          body: `Incredible dedication! You've kept your daily Bible reading active for ${result.currentStreak} consecutive days.`,
          actionUrl: "/home",
        },
      });
    }
  }

  return {
    ...result,
    todayStr,
    readingDates: Array.from(readingDates).sort(),
    dailyChapterCounts,
  };
}
