import "server-only";

import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  groupMemberEnrollments,
  groupMembers,
  notes,
  planInstances,
  readingTrackers,
  trackerChapterProgress,
  unlockedAchievements,
} from "@/db/schema";
import {
  ACHIEVEMENTS,
  type GroupAchievementStats,
} from "@/data/achievements";
import { syncUserStreak, type UserStreakData } from "@/lib/streak-service";
import type {
  UserAchievementItem,
  UserAchievementsStats,
} from "@/actions/achievements";

export type GetUserAchievementsForUserParams = {
  userId: string;
};

export type GetUserAchievementsForUserResult = {
  achievements: ReadonlyArray<UserAchievementItem>;
  stats: UserAchievementsStats;
  streak: UserStreakData;
};

async function fetchGroupAchievementStats({
  userId,
}: {
  userId: string;
}): Promise<GroupAchievementStats> {
  const [memberships, enrollments, sharedNotesRes] = await Promise.all([
    db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active"))
      ),
    db
      .select({ status: planInstances.status })
      .from(groupMemberEnrollments)
      .innerJoin(
        planInstances,
        eq(groupMemberEnrollments.planInstanceId, planInstances.id)
      )
      .where(eq(groupMemberEnrollments.userId, userId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isSharedWithCommunity, true),
          isNotNull(notes.planInstanceId),
          eq(notes.isArchived, false)
        )
      ),
  ]);

  let ledGroupsCount = 0;
  for (const m of memberships) {
    if (m.role === "owner" || m.role === "admin") {
      ledGroupsCount++;
    }
  }

  let completedGroupPlansCount = 0;
  for (const e of enrollments) {
    if (e.status === "completed" || e.status === "finished") {
      completedGroupPlansCount++;
    }
  }

  return {
    activeMembershipsCount: memberships.length,
    ledGroupsCount,
    enrolledGroupPlansCount: enrollments.length,
    completedGroupPlansCount,
    sharedReflectionsCount: Number(sharedNotesRes[0]?.count ?? 0),
  };
}

export async function getUserAchievementsForUser({
  userId,
}: GetUserAchievementsForUserParams): Promise<GetUserAchievementsForUserResult> {
  const userTrackers = await db.query.readingTrackers.findMany({
    where: eq(readingTrackers.userId, userId),
    columns: { id: true },
  });
  const trackerIds = userTrackers.map((t) => t.id);

  const [
    progressRows,
    completedPlansCountRes,
    unlockedRows,
    streak,
    groupStats,
  ] = await Promise.all([
    trackerIds.length > 0
      ? db.query.trackerChapterProgress.findMany({
          where: inArray(trackerChapterProgress.trackerId, trackerIds),
          columns: { bookId: true, chapter: true },
        })
      : Promise.resolve([]),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(planInstances)
      .where(
        and(
          eq(planInstances.userId, userId),
          inArray(planInstances.status, ["completed", "finished"])
        )
      ),
    db.query.unlockedAchievements.findMany({
      where: eq(unlockedAchievements.userId, userId),
    }),
    syncUserStreak({ userId }),
    fetchGroupAchievementStats({ userId }),
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

  const unlockedMap = new Map(unlockedRows.map((r) => [r.achievementId, r]));

  const trackerCount = userTrackers.length;
  const streakCount = streak.currentStreak;
  const completedPlansCount = Number(completedPlansCountRes[0]?.count ?? 0);

  const achievements: UserAchievementItem[] = [];
  const newlyDiscoveredToBackfill: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    const existing = unlockedMap.get(ach.id);
    const evalResult = ach.checkUnlocked(
      globalProgress,
      trackerCount,
      totalChaptersRead,
      streakCount,
      completedPlansCount,
      groupStats
    );

    const isUnlocked = !!existing || evalResult.unlocked;

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

  if (newlyDiscoveredToBackfill.length > 0) {
    void db
      .insert(unlockedAchievements)
      .values(
        newlyDiscoveredToBackfill.map((achId) => ({
          userId,
          achievementId: achId,
          unlockedAt: new Date(),
          celebratedAt: new Date(),
        }))
      )
      .onConflictDoNothing();
  }

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  return {
    achievements,
    streak,
    stats: {
      total: totalCount,
      unlocked: unlockedCount,
      locked: totalCount - unlockedCount,
      percentage:
        totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
    },
  };
}
