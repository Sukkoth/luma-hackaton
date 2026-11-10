"use server";

import { headers } from "next/headers";
import { and, eq, inArray, isNull } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  readingTrackers,
  trackerChapterProgress,
  planInstances,
  unlockedAchievements,
} from "@/db/schema";
import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementCategory,
  type SerializableAchievement,
  toSerializableAchievement,
} from "@/data/achievements";
import { syncUserStreak } from "@/lib/streak-service";
import {
  MarkAchievementCelebratedSchema,
  type MarkAchievementCelebratedInput,
} from "@/lib/schemas/achievements";

export type UserAchievementItem = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  accentColor: string;
  bgLight: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  celebratedAt: string | null;
  current: number;
  total: number;
  percentage: number;
};

export type UserAchievementsStats = {
  total: number;
  unlocked: number;
  locked: number;
  percentage: number;
};

export type UserAchievementsData = {
  achievements: ReadonlyArray<UserAchievementItem>;
  stats: UserAchievementsStats;
};

export type GetUserAchievementsDataParams = {
  userId: string;
};

export async function getUserAchievementsData({
  userId,
}: GetUserAchievementsDataParams): Promise<UserAchievementsData> {
  // 1. Fetch user's trackers
  const userTrackers = await db.query.readingTrackers.findMany({
    where: eq(readingTrackers.userId, userId),
  });
  const trackerIds = userTrackers.map((t) => t.id);

  // 2. Fetch progress, completed plans, already unlocked achievements, and streak in parallel
  const [progressRows, completedPlans, unlockedRows, streak] =
    await Promise.all([
      trackerIds.length > 0
        ? db.query.trackerChapterProgress.findMany({
            where: inArray(trackerChapterProgress.trackerId, trackerIds),
          })
        : Promise.resolve([]),
      db.query.planInstances.findMany({
        where: and(
          eq(planInstances.userId, userId),
          inArray(planInstances.status, ["completed", "finished"])
        ),
      }),
      db.query.unlockedAchievements.findMany({
        where: eq(unlockedAchievements.userId, userId),
      }),
      syncUserStreak({ userId }),
    ]);

  // 3. Assemble global progress map (bookId -> list of chapter numbers)
  const globalProgress: Record<string, number[]> = {};
  for (const row of progressRows) {
    if (!globalProgress[row.bookId]) {
      globalProgress[row.bookId] = [];
    }
    globalProgress[row.bookId]!.push(row.chapter);
  }

  // Calculate unique total chapters read across all books
  let totalChaptersRead = 0;
  for (const bookId in globalProgress) {
    const chapters = globalProgress[bookId];
    if (chapters) {
      totalChaptersRead += new Set(chapters).size;
    }
  }

  const unlockedMap = new Map(unlockedRows.map((r) => [r.achievementId, r]));

  const trackerCount = userTrackers.length;
  const streakCount = streak.currentStreak;
  const completedPlansCount = completedPlans.length;

  const achievements: UserAchievementItem[] = [];
  const newlyDiscoveredToBackfill: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    const existing = unlockedMap.get(ach.id);
    const evalResult = ach.checkUnlocked(
      globalProgress,
      trackerCount,
      totalChaptersRead,
      streakCount,
      completedPlansCount
    );

    const isUnlocked = !!existing || evalResult.unlocked;

    // If criteria is met but no row exists yet in DB, stage for silent backfill
    if (!existing && evalResult.unlocked) {
      newlyDiscoveredToBackfill.push(ach.id);
    }

    const currentCount = isUnlocked
      ? Math.max(evalResult.current, evalResult.total)
      : evalResult.current;

    const percentage = isUnlocked
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (evalResult.current / Math.max(1, evalResult.total)) * 100
            )
          )
        );

    achievements.push({
      id: ach.id,
      title: ach.title,
      description: ach.description,
      category: ach.category,
      iconName: ach.iconName,
      accentColor: ach.accentColor,
      bgLight: ach.bgLight,
      isUnlocked,
      unlockedAt: existing
        ? existing.unlockedAt.toISOString()
        : isUnlocked
          ? new Date().toISOString()
          : null,
      celebratedAt: existing?.celebratedAt
        ? existing.celebratedAt.toISOString()
        : null,
      current: currentCount,
      total: evalResult.total,
      percentage,
    });
  }

  // Silently record existing unlocked achievements in database if missing
  if (newlyDiscoveredToBackfill.length > 0) {
    void db
      .insert(unlockedAchievements)
      .values(
        newlyDiscoveredToBackfill.map((achId) => ({
          userId,
          achievementId: achId,
          unlockedAt: new Date(),
          celebratedAt: new Date(), // Baseline silently recorded as celebrated
        }))
      )
      .onConflictDoNothing();
  }

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const overallPercentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    achievements,
    stats: {
      total: totalCount,
      unlocked: unlockedCount,
      locked: totalCount - unlockedCount,
      percentage: overallPercentage,
    },
  };
}

export type EvaluateAndUnlockAchievementsParams = {
  userId: string;
};

export type EvaluateAndUnlockResult = {
  newlyUnlocked: ReadonlyArray<SerializableAchievement>;
};

export async function evaluateAndUnlockAchievementsAction({
  userId,
}: EvaluateAndUnlockAchievementsParams): Promise<EvaluateAndUnlockResult> {
  const userTrackers = await db.query.readingTrackers.findMany({
    where: eq(readingTrackers.userId, userId),
  });
  const trackerIds = userTrackers.map((t) => t.id);

  const [progressRows, completedPlans, unlockedRows, streak] =
    await Promise.all([
      trackerIds.length > 0
        ? db.query.trackerChapterProgress.findMany({
            where: inArray(trackerChapterProgress.trackerId, trackerIds),
          })
        : Promise.resolve([]),
      db.query.planInstances.findMany({
        where: and(
          eq(planInstances.userId, userId),
          inArray(planInstances.status, ["completed", "finished"])
        ),
      }),
      db.query.unlockedAchievements.findMany({
        where: eq(unlockedAchievements.userId, userId),
      }),
      syncUserStreak({ userId }),
    ]);

  const globalProgress: Record<string, number[]> = {};
  for (const row of progressRows) {
    if (!globalProgress[row.bookId]) {
      globalProgress[row.bookId] = [];
    }
    globalProgress[row.bookId]!.push(row.chapter);
  }

  let totalChaptersRead = 0;
  for (const bookId in globalProgress) {
    const chapters = globalProgress[bookId];
    if (chapters) {
      totalChaptersRead += new Set(chapters).size;
    }
  }

  const knownUnlockedSet = new Set(unlockedRows.map((r) => r.achievementId));
  const trackerCount = userTrackers.length;
  const streakCount = streak.currentStreak;
  const completedPlansCount = completedPlans.length;

  const newlyUnlocked: Achievement[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (knownUnlockedSet.has(ach.id)) continue;

    const evalResult = ach.checkUnlocked(
      globalProgress,
      trackerCount,
      totalChaptersRead,
      streakCount,
      completedPlansCount
    );

    if (evalResult.unlocked) {
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0) {
    await db
      .insert(unlockedAchievements)
      .values(
        newlyUnlocked.map((ach) => ({
          userId,
          achievementId: ach.id,
          unlockedAt: new Date(),
          celebratedAt: null, // Pending celebration toast
        }))
      )
      .onConflictDoNothing();
  }

  return {
    newlyUnlocked: newlyUnlocked.map((ach) =>
      toSerializableAchievement({ achievement: ach })
    ),
  };
}

export type MarkAchievementCelebratedActionParams =
  MarkAchievementCelebratedInput;

export type MarkAchievementCelebratedResult =
  { success: true } | { success: false; error: string };

export async function markAchievementCelebratedAction({
  achievementId,
}: MarkAchievementCelebratedActionParams): Promise<MarkAchievementCelebratedResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = v.safeParse(MarkAchievementCelebratedSchema, {
    achievementId,
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid achievement ID" };
  }

  await db
    .update(unlockedAchievements)
    .set({
      celebratedAt: new Date(),
    })
    .where(
      and(
        eq(unlockedAchievements.userId, session.user.id),
        eq(unlockedAchievements.achievementId, parsed.output.achievementId)
      )
    );

  return { success: true };
}

export type GetPendingCelebrationsResult = {
  pending: ReadonlyArray<SerializableAchievement>;
};

export async function getPendingCelebrationsAction(): Promise<GetPendingCelebrationsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { pending: [] };
  }

  const uncelebrated = await db.query.unlockedAchievements.findMany({
    where: and(
      eq(unlockedAchievements.userId, session.user.id),
      isNull(unlockedAchievements.celebratedAt)
    ),
  });

  if (uncelebrated.length === 0) {
    return { pending: [] };
  }

  const achMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));
  const pending = uncelebrated
    .map((u) => achMap.get(u.achievementId))
    .filter((a): a is Achievement => !!a);

  return {
    pending: pending.map((ach) =>
      toSerializableAchievement({ achievement: ach })
    ),
  };
}
