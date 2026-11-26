import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  planInstances,
  planInstanceReadings,
  planReadingItems,
  planTemplates,
} from "@/db/schema";
import type { PlanCatalogSummary, PlanCategory } from "@/data/planCatalogTypes";
import type { BibleCanon } from "@/data/bibleData";

export type UserPlanSummaryItem = {
  id: string;
  templateId: string;
  title: string;
  status: "active" | "paused" | "completed" | "archived";
  mode: string;
  paceType: string;
  dailyTarget: number;
  totalChapters: number;
  completedChapters: number;
  progressPercent: number;
  startDate: Date;
  targetEndDate: Date | null;
  completedAt: Date | null;
  activeDaysMask: string;
};

export type GetUserPlansForTrackerParams = {
  trackerId: string;
  userId: string;
};

export async function getUserPlansForTracker({
  trackerId,
  userId,
}: GetUserPlansForTrackerParams): Promise<ReadonlyArray<UserPlanSummaryItem>> {
  const instances = await db.query.planInstances.findMany({
    where: and(
      eq(planInstances.trackerId, trackerId),
      eq(planInstances.userId, userId),
      inArray(planInstances.status, ["active", "paused", "completed"])
    ),
    orderBy: [desc(planInstances.startDate)],
  });

  if (instances.length === 0) return [];

  const instanceIds = instances.map((inst) => inst.id);
  const completedCounts = await db
    .select({
      instanceId: planInstanceReadings.instanceId,
      completedCount: sql<number>`count(*)::int`,
    })
    .from(planInstanceReadings)
    .where(inArray(planInstanceReadings.instanceId, instanceIds))
    .groupBy(planInstanceReadings.instanceId);

  const countByInstanceId = new Map<string, number>(
    completedCounts.map((row) => [row.instanceId, Number(row.completedCount)])
  );

  return instances.map((inst) => {
    const completedChapters = countByInstanceId.get(inst.id) ?? 0;
    const totalChapters = inst.totalChapters || 1;
    const progressPercent = Math.min(
      100,
      Math.round((completedChapters / totalChapters) * 100)
    );

    return {
      id: inst.id,
      templateId: inst.templateId,
      title: inst.title,
      status: inst.status as "active" | "paused" | "completed" | "archived",
      mode: inst.mode,
      paceType: inst.paceType,
      dailyTarget: inst.dailyTarget,
      totalChapters: inst.totalChapters,
      completedChapters,
      progressPercent,
      startDate: inst.startDate,
      targetEndDate: inst.targetEndDate,
      completedAt: inst.completedAt,
      activeDaysMask: inst.activeDaysMask,
    };
  });
}

export type GetUserCustomPlanSummariesParams = {
  userId: string;
};

export async function getUserCustomPlanSummaries({
  userId,
}: GetUserCustomPlanSummariesParams): Promise<PlanCatalogSummary[]> {
  const dbTemplates = await db.query.planTemplates.findMany({
    where: and(
      eq(planTemplates.isCustom, true),
      eq(planTemplates.authorId, userId)
    ),
    with: {
      sections: true,
    },
    orderBy: [desc(planTemplates.createdAt)],
  });

  if (dbTemplates.length === 0) return [];

  const templateIds = dbTemplates.map((t) => t.id);
  const distinctBookRows = await db
    .selectDistinct({
      templateId: planReadingItems.templateId,
      bookId: planReadingItems.bookId,
    })
    .from(planReadingItems)
    .where(inArray(planReadingItems.templateId, templateIds));

  const bookIdsByTemplate = new Map<string, string[]>();
  for (const row of distinctBookRows) {
    const existing = bookIdsByTemplate.get(row.templateId);
    if (existing) {
      existing.push(row.bookId);
    } else {
      bookIdsByTemplate.set(row.templateId, [row.bookId]);
    }
  }

  return dbTemplates.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle,
    description: t.description,
    category: (t.category as PlanCategory) || "Custom",
    icon: t.icon,
    accentColor: t.accentColor,
    totalChapters: t.totalChapters,
    defaultDailyTarget: t.defaultDailyTarget,
    recommendedDays: t.targetDays,
    allowCustomPace: t.allowCustomPace,
    allowSelfPaced: t.allowSelfPaced,
    canonCompatibility: (t.canonCompatibility as BibleCanon) || undefined,
    sections: t.sections.map((s) => ({
      title: s.title,
      subtitle: s.subtitle,
      chaptersCount: s.chaptersCount,
      booksDescription: s.booksDescription,
    })),
    bookIds: bookIdsByTemplate.get(t.id) ?? [],
  }));
}
