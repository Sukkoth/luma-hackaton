"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  planTemplates,
  planSections,
  planReadingItems,
  planInstances,
  planInstanceReadings,
  trackerChapterProgress,
  readingLogs,
  noteFolders,
  notes,
  readingTrackers,
} from "@/db/schema";
import {
  StartPlanSchema,
  TogglePlanReadingSchema,
  UpdatePlanSettingsSchema,
  DeletePlanInstanceSchema,
  CatchUpShiftSchema,
  CatchUpIncreasePaceSchema,
  PausePlanSchema,
  ResumePlanSchema,
} from "@/lib/schemas/plans";
import {
  getReadingPlanById,
  isPlanCanonCompatible,
  type PlanReadingItem,
} from "@/data/readingPlans";
import type { BibleCanon } from "@/data/bibleData";
import { syncUserStreak } from "@/lib/streak-service";

export type StartPlanResult =
  { success: true; instanceId: string } | { success: false; error: string };

export type StartPlanActionParams = {
  templateId: string;
  trackerId: string;
  mode: "scheduled" | "flexible";
  paceType: "by_daily_target" | "by_end_date" | "self_paced";
  allowCustomPace?: boolean;
  allowSelfPaced?: boolean;
  recommendedDays?: number;
  startDate: string;
  dailyTarget: number;
  targetEndDate?: string;
  activeDaysMask: string;
  autoCompletePastDays?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string;
  createNoteFolder?: boolean;
};

type EnsurePlanTemplateInDbParams = {
  templateId: string;
};

async function ensurePlanTemplateInDb({
  templateId,
}: EnsurePlanTemplateInDbParams): Promise<void> {
  const existing = await db.query.planTemplates.findFirst({
    where: eq(planTemplates.id, templateId),
  });
  if (existing) return;

  const blueprint = getReadingPlanById(templateId);
  if (!blueprint) {
    throw new Error(`Plan template '${templateId}' not found in readingPlans.`);
  }

  // 1. Insert Template
  await db
    .insert(planTemplates)
    .values({
      id: blueprint.id,
      title: blueprint.title,
      subtitle: blueprint.subtitle || "",
      description: blueprint.description || "",
      category: blueprint.category,
      icon: blueprint.icon || "calendar",
      accentColor: blueprint.accentColor || "#3B82F6",
      totalChapters: blueprint.totalChapters,
      defaultDailyTarget: blueprint.defaultDailyTarget,
      targetDays: blueprint.recommendedDays,
      canonCompatibility: blueprint.canonCompatibility ?? null,
      allowCustomPace: blueprint.allowCustomPace ?? true,
      allowSelfPaced: blueprint.allowSelfPaced ?? true,
      isCustom: false,
      isPublished: true,
    })
    .onConflictDoNothing();

  // 2. Insert Sections
  if (blueprint.sections.length > 0) {
    const sectionValues = blueprint.sections.map((sec, idx) => ({
      id: `${blueprint.id}_sec_${idx}`,
      templateId: blueprint.id,
      title: sec.title,
      subtitle: sec.subtitle || "",
      chaptersCount: sec.chaptersCount ?? 0,
      booksDescription: sec.booksDescription || "",
      sortOrder: idx,
    }));
    await db.insert(planSections).values(sectionValues).onConflictDoNothing();
  }

  // 3. Insert Reading Items in chunks
  if (blueprint.readings.length > 0) {
    const chunkSize = 200;
    for (let i = 0; i < blueprint.readings.length; i += chunkSize) {
      const chunk = blueprint.readings.slice(i, i + chunkSize);
      const readingValues = chunk.map((r, idx) => ({
        id: r.id || `${blueprint.id}_r_${i + idx}`,
        templateId: blueprint.id,
        bookId: r.bookId,
        chapter: r.chapter,
        startVerse: r.startVerse ?? null,
        endVerse: r.endVerse ?? null,
        verseRange: r.verseRange ?? null,
        versesLabel: r.versesLabel ?? null,
        track: r.track ?? null,
        displayText: r.displayText ?? `${r.bookName} ${r.chapter}`,
        orderIndex: r.order ?? i + idx + 1,
      }));
      await db
        .insert(planReadingItems)
        .values(readingValues)
        .onConflictDoNothing();
    }
  }
}

type CalculatePastReadingsParams = {
  readings: ReadonlyArray<PlanReadingItem>;
  startMidnight: Date;
  todayMidnight: Date;
  dailyTarget: number;
  activeDays: ReadonlyArray<number>;
};

function calculatePastReadings({
  readings,
  startMidnight,
  todayMidnight,
  dailyTarget,
  activeDays,
}: CalculatePastReadingsParams): ReadonlyArray<PlanReadingItem> {
  if (startMidnight.getTime() >= todayMidnight.getTime()) {
    return [];
  }

  const safeDays = activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];
  const cursor = new Date(startMidnight.getTime());
  cursor.setHours(0, 0, 0, 0);

  // Advance cursor to the first active day
  while (!safeDays.includes(cursor.getDay())) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const past: PlanReadingItem[] = [];

  for (let i = 0; i < readings.length; i += dailyTarget) {
    const chunk = readings.slice(i, i + dailyTarget);

    if (i > 0) {
      cursor.setDate(cursor.getDate() + 1);
      while (!safeDays.includes(cursor.getDay())) {
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    if (cursor.getTime() < todayMidnight.getTime()) {
      past.push(...chunk);
    } else {
      break;
    }
  }

  return past;
}

export async function startPlanAction({
  templateId,
  trackerId,
  mode,
  paceType,
  startDate,
  dailyTarget,
  targetEndDate,
  activeDaysMask,
  autoCompletePastDays = true,
  reminderEnabled = false,
  reminderTime = "08:00",
  createNoteFolder = true,
}: StartPlanActionParams): Promise<StartPlanResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(StartPlanSchema, {
    templateId,
    trackerId,
    mode,
    paceType,
    startDate,
    dailyTarget,
    targetEndDate,
    activeDaysMask,
    autoCompletePastDays,
    reminderEnabled,
    reminderTime,
    createNoteFolder,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid plan parameters.",
    };
  }

  const input = parsed.output;

  try {
    // 1. Verify tracker ownership
    const tracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, input.trackerId),
        eq(readingTrackers.userId, session.user.id)
      ),
    });

    if (!tracker) {
      return { success: false, error: "Reading tracker not found." };
    }

    // 2. Ensure only 1 active or paused instance of this plan template exists in this tracker
    const existingInstance = await db.query.planInstances.findFirst({
      where: and(
        eq(planInstances.trackerId, input.trackerId),
        eq(planInstances.templateId, input.templateId),
        inArray(planInstances.status, ["active", "paused"])
      ),
    });

    if (existingInstance) {
      return {
        success: false,
        error:
          "This plan is already active or paused in this tracker. You can only run one active instance of a plan per tracker.",
      };
    }

    // 3. Ensure blueprint template exists in database
    await ensurePlanTemplateInDb({ templateId: input.templateId });
    const blueprint = getReadingPlanById(input.templateId);
    if (!blueprint) {
      return { success: false, error: "Blueprint template not found." };
    }

    // 4. Verify canon compatibility with the active tracker
    const trackerCanon = (tracker.canon as BibleCanon) || "protestant";
    if (!isPlanCanonCompatible({ plan: blueprint, trackerCanon })) {
      return {
        success: false,
        error: `This plan is incompatible with your tracker's canon (${trackerCanon.replace("_", " ")}).`,
      };
    }

    // 5. Process start date & active days mask
    const parts = input.startDate.split("-").map(Number);
    const startMidnight = new Date(
      parts[0] || 2026,
      (parts[1] || 1) - 1,
      parts[2] || 1
    );
    startMidnight.setHours(0, 0, 0, 0);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const startDateObj = startMidnight;

    const activeDays: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (input.activeDaysMask[i] === "1") {
        activeDays.push(i);
      }
    }
    const safeActiveDays =
      activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];

    // 4. Calculate past readings if migrating/started in past
    const isStartDateInPast = startMidnight.getTime() < todayMidnight.getTime();
    const shouldAutoCompletePast =
      input.mode === "scheduled" &&
      isStartDateInPast &&
      input.autoCompletePastDays === true;

    const pastReadings = shouldAutoCompletePast
      ? calculatePastReadings({
          readings: blueprint.readings,
          startMidnight,
          todayMidnight,
          dailyTarget: input.dailyTarget,
          activeDays: safeActiveDays,
        })
      : [];

    // Guard: Leave at least 1 reading for today or future
    if (
      input.mode === "scheduled" &&
      isStartDateInPast &&
      pastReadings.length >= blueprint.readings.length
    ) {
      return {
        success: false,
        error:
          "This plan has already ended in the past. Please select a more recent start date.",
      };
    }

    // 5. Build pacing segments JSON
    const segments =
      pastReadings.length > 0
        ? [
            {
              startDate: startMidnight.getTime(),
              dailyTarget: input.dailyTarget,
              startReadingIndex: 0,
              endReadingIndex: pastReadings.length,
              activeDaysMask: safeActiveDays,
            },
            {
              startDate: todayMidnight.getTime(),
              dailyTarget: input.dailyTarget,
              startReadingIndex: pastReadings.length,
              activeDaysMask: safeActiveDays,
            },
          ]
        : [
            {
              startDate: startMidnight.getTime(),
              dailyTarget: input.dailyTarget,
              startReadingIndex: 0,
              activeDaysMask: safeActiveDays,
            },
          ];

    // 6. Optional: Create dedicated note folder
    if (input.createNoteFolder) {
      const existingFolder = await db.query.noteFolders.findFirst({
        where: and(
          eq(noteFolders.userId, session.user.id),
          eq(noteFolders.name, blueprint.title)
        ),
      });

      if (!existingFolder) {
        await db
          .insert(noteFolders)
          .values({
            userId: session.user.id,
            name: blueprint.title,
            color: "#82ADD4",
            icon: "book-open",
            isPinned: false,
          })
          .onConflictDoNothing();
      }
    }

    // 7. Insert Plan Instance
    const instanceId = crypto.randomUUID();
    const targetEndDateVal = input.targetEndDate
      ? new Date(input.targetEndDate)
      : null;

    await db.insert(planInstances).values({
      id: instanceId,
      userId: session.user.id,
      trackerId: input.trackerId,
      templateId: input.templateId,
      title: blueprint.title,
      status: "active",
      mode: input.mode,
      paceType: input.paceType,
      startDate: startDateObj,
      targetEndDate: targetEndDateVal,
      dailyTarget: input.dailyTarget,
      totalChapters: blueprint.totalChapters,
      activeDaysMask: input.activeDaysMask,
      pacingSegmentsJson: JSON.stringify(segments),
      reminderEnabled: input.reminderEnabled ?? false,
      reminderTime: input.reminderTime ?? "08:00",
    });

    // 8. If past readings exist, dual-sync them
    if (pastReadings.length > 0) {
      // 8a. Insert plan instance readings
      const instanceReadingsValues = pastReadings.map((r) => ({
        instanceId,
        readingItemId: r.id,
        completedAt: startMidnight,
      }));

      const readingChunkSize = 200;
      for (
        let i = 0;
        i < instanceReadingsValues.length;
        i += readingChunkSize
      ) {
        await db
          .insert(planInstanceReadings)
          .values(instanceReadingsValues.slice(i, i + readingChunkSize))
          .onConflictDoNothing();
      }

      // 8b. Dual-sync to trackerChapterProgress
      const existingChapters = await db.query.trackerChapterProgress.findMany({
        where: eq(trackerChapterProgress.trackerId, input.trackerId),
      });
      const existingSet = new Set(
        existingChapters.map((c) => `${c.bookId}:${c.chapter}`)
      );

      const newChaptersToInsert: {
        trackerId: string;
        bookId: string;
        chapter: number;
        completedAt: Date;
      }[] = [];

      const newLogsToInsert: {
        userId: string;
        trackerId: string;
        bookId: string;
        bookName: string;
        chapter: number;
        planInstanceId: string;
        loggedAt: Date;
      }[] = [];

      for (const r of pastReadings) {
        const key = `${r.bookId}:${r.chapter}`;
        if (!existingSet.has(key)) {
          existingSet.add(key);
          newChaptersToInsert.push({
            trackerId: input.trackerId,
            bookId: r.bookId,
            chapter: r.chapter,
            completedAt: startMidnight,
          });
          newLogsToInsert.push({
            userId: session.user.id,
            trackerId: input.trackerId,
            bookId: r.bookId,
            bookName: r.bookName,
            chapter: r.chapter,
            planInstanceId: instanceId,
            loggedAt: startMidnight,
          });
        }
      }

      if (newChaptersToInsert.length > 0) {
        for (let i = 0; i < newChaptersToInsert.length; i += readingChunkSize) {
          await db
            .insert(trackerChapterProgress)
            .values(newChaptersToInsert.slice(i, i + readingChunkSize))
            .onConflictDoNothing();
        }
      }

      if (newLogsToInsert.length > 0) {
        for (let i = 0; i < newLogsToInsert.length; i += readingChunkSize) {
          await db
            .insert(readingLogs)
            .values(newLogsToInsert.slice(i, i + readingChunkSize))
            .onConflictDoNothing();
        }
      }

      // Sync user streaks
      await syncUserStreak({ userId: session.user.id });
    }

    revalidatePath("/plans");
    revalidatePath(`/plans/${instanceId}`);
    return { success: true, instanceId };
  } catch (err) {
    console.error("Failed to start reading plan:", err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to start reading plan.",
    };
  }
}

export type UserActivePlanItem = {
  id: string;
  templateId: string;
  title: string;
  status: string;
  mode: string;
  paceType: string;
  dailyTarget: number;
  totalChapters: number;
  completedChapters: number;
  progressPercent: number;
  startDate: Date;
  targetEndDate: Date | null;
  activeDaysMask: string;
};

export type UserPlanItem = {
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

export type GetUserPlansParams = {
  trackerId: string;
};

export async function getUserPlansAction({
  trackerId,
}: GetUserPlansParams): Promise<ReadonlyArray<UserPlanItem>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const instances = await db.query.planInstances.findMany({
    where: and(
      eq(planInstances.trackerId, trackerId),
      eq(planInstances.userId, session.user.id),
      inArray(planInstances.status, ["active", "paused", "completed"])
    ),
    with: {
      completedReadings: true,
    },
    orderBy: [desc(planInstances.startDate)],
  });

  return instances.map((inst) => {
    const completedChapters = inst.completedReadings.length;
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

export type GetUserActivePlansParams = {
  trackerId: string;
};

export async function getUserActivePlansAction({
  trackerId,
}: GetUserActivePlansParams): Promise<ReadonlyArray<UserActivePlanItem>> {
  const all = await getUserPlansAction({ trackerId });
  return all.filter((p) => p.status === "active" || p.status === "paused");
}

export type PlanReadingSessionItem = {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  displayText?: string;
  order: number;
  isCompleted: boolean;
};

export type PlanSessionDetail = {
  sessionIndex: number;
  partIndex: number;
  title: string;
  isCompleted: boolean;
  completedCount: number;
  totalCount: number;
  readings: ReadonlyArray<PlanReadingSessionItem>;
  date?: string;
  dateLabel?: string;
  isToday?: boolean;
  isPastDue?: boolean;
};

export type PlanOverdueInfo = {
  overdueDaysCount: number;
  overdueChaptersCount: number;
  firstOverdueSessionIndex: number;
  firstOverdueSessionTitle: string;
  firstOverdueSessionDateLabel?: string;
  projectedEndDateLabel?: string;
  hasTargetEndDate?: boolean;
  targetEndDateLabel?: string;
  requiredDailyPace?: number;
};

export type PlanPartDetail = {
  partIndex: number;
  title: string;
  subtitle: string;
  startSessionIndex: number;
  endSessionIndex: number;
  completedSessions: number;
  totalSessions: number;
  isCompleted: boolean;
};

export type PlanInstanceDetail = {
  id: string;
  templateId: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  accentColor: string;
  status: "active" | "paused" | "completed" | "archived";
  mode: "scheduled" | "flexible";
  paceType: "by_daily_target" | "by_end_date" | "self_paced";
  allowCustomPace: boolean;
  allowSelfPaced: boolean;
  recommendedDays: number;
  startDate: string;
  targetEndDate: string | null;
  completedAt: string | null;
  dailyTarget: number;
  totalChapters: number;
  completedChapters: number;
  progressPercent: number;
  activeDaysMask: string;
  reminderEnabled: boolean;
  reminderTime: string | null;
  tracker: {
    id: string;
    name: string;
    canon: string;
    color: string;
    icon: string;
  };
  sessions: ReadonlyArray<PlanSessionDetail>;
  parts: ReadonlyArray<PlanPartDetail>;
  notesCount: number;
  overdueInfo: PlanOverdueInfo | null;
};

export type GetPlanInstanceDetailParams = {
  instanceId: string;
};

export async function getPlanInstanceDetailAction({
  instanceId,
}: GetPlanInstanceDetailParams): Promise<PlanInstanceDetail | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, instanceId),
      eq(planInstances.userId, session.user.id)
    ),
    with: {
      tracker: true,
      completedReadings: true,
    },
  });

  if (!instance) return null;

  const blueprint = getReadingPlanById(instance.templateId);
  const readings = blueprint?.readings || [];

  const completedSet = new Set(
    instance.completedReadings.map((r) => r.readingItemId)
  );

  const completedChapters = instance.completedReadings.length;
  const totalChapters = instance.totalChapters || readings.length || 1;
  const progressPercent = Math.min(
    100,
    Math.round((completedChapters / totalChapters) * 100)
  );

  // Group readings into sessions based on dailyTarget
  const dailyTarget = Math.max(1, instance.dailyTarget || 2);
  const sessions: PlanSessionDetail[] = [];

  const activeDayIndices: number[] = [];
  for (let d = 0; d < 7; d++) {
    if ((instance.activeDaysMask || "1111111")[d] === "1") {
      activeDayIndices.push(d);
    }
  }
  const safeDays =
    activeDayIndices.length > 0 ? activeDayIndices : [0, 1, 2, 3, 4, 5, 6];

  const nowMidnight = new Date();
  nowMidnight.setHours(0, 0, 0, 0);

  const cursorDate = new Date(instance.startDate);
  cursorDate.setHours(0, 0, 0, 0);
  while (!safeDays.includes(cursorDate.getDay())) {
    cursorDate.setDate(cursorDate.getDate() + 1);
  }

  const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const SHORT_MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 0; i < readings.length; i += dailyTarget) {
    const sessionIdx = Math.floor(i / dailyTarget) + 1;
    const partIdx = Math.floor((sessionIdx - 1) / 7) + 1;
    const chunk = readings.slice(i, i + dailyTarget);

    if (sessionIdx > 1) {
      cursorDate.setDate(cursorDate.getDate() + 1);
      while (!safeDays.includes(cursorDate.getDay())) {
        cursorDate.setDate(cursorDate.getDate() + 1);
      }
    }

    const sessionReadings: PlanReadingSessionItem[] = chunk.map((r) => ({
      id: r.id,
      bookId: r.bookId,
      bookName: r.bookName,
      chapter: r.chapter,
      displayText: r.displayText,
      order: r.order,
      isCompleted: completedSet.has(r.id),
    }));

    const sessionCompletedCount = sessionReadings.filter(
      (r) => r.isCompleted
    ).length;
    const isCompleted = sessionCompletedCount === sessionReadings.length;

    const sessionMidnightTime = cursorDate.getTime();
    const isToday = sessionMidnightTime === nowMidnight.getTime();
    const isPastDue =
      instance.mode === "scheduled" &&
      instance.status === "active" &&
      !isCompleted &&
      sessionMidnightTime < nowMidnight.getTime();

    const dateLabel = `${SHORT_WEEKDAYS[cursorDate.getDay()]}, ${
      SHORT_MONTHS[cursorDate.getMonth()]
    } ${cursorDate.getDate()}`;

    sessions.push({
      sessionIndex: sessionIdx,
      partIndex: partIdx,
      title: `Session ${sessionIdx}`,
      isCompleted,
      completedCount: sessionCompletedCount,
      totalCount: sessionReadings.length,
      readings: sessionReadings,
      date: cursorDate.toISOString(),
      dateLabel,
      isToday,
      isPastDue,
    });
  }

  // Calculate overdue schedule info (Watermelon parity)
  let overdueInfo: PlanOverdueInfo | null = null;
  if (instance.status === "active" && instance.mode === "scheduled") {
    const overdueSessions = sessions.filter((s) => s.isPastDue);
    if (overdueSessions.length > 0) {
      const overdueChaptersCount = overdueSessions.reduce(
        (acc, s) => acc + (s.totalCount - s.completedCount),
        0
      );
      const firstOverdue = overdueSessions[0];
      const firstOverdueIdx = firstOverdue.sessionIndex - 1;
      const remainingSessions = sessions.length - firstOverdueIdx;

      // Projected end date if shifted to today
      const projCursor = new Date(nowMidnight);
      let daysForward = Math.max(0, remainingSessions - 1);
      while (daysForward > 0) {
        projCursor.setDate(projCursor.getDate() + 1);
        if (safeDays.includes(projCursor.getDay())) {
          daysForward--;
        }
      }
      const projectedEndDateLabel = `${
        SHORT_WEEKDAYS[projCursor.getDay()]
      }, ${SHORT_MONTHS[projCursor.getMonth()]} ${projCursor.getDate()}`;

      // Required pace calculation
      const targetEnd = instance.targetEndDate
        ? new Date(instance.targetEndDate)
        : null;
      let requiredDailyPace = dailyTarget + 1;
      let hasTargetEndDate = false;
      let targetEndDateLabel: string | undefined = undefined;

      if (targetEnd && targetEnd.getTime() > nowMidnight.getTime()) {
        hasTargetEndDate = true;
        targetEndDateLabel = `${
          SHORT_WEEKDAYS[targetEnd.getDay()]
        }, ${SHORT_MONTHS[targetEnd.getMonth()]} ${targetEnd.getDate()}`;
        const daysUntilTargetEnd = Math.max(
          1,
          Math.ceil(
            (targetEnd.getTime() - nowMidnight.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        const unreadCount = Math.max(1, totalChapters - completedChapters);
        requiredDailyPace = Math.max(
          dailyTarget + 1,
          Math.ceil(unreadCount / daysUntilTargetEnd)
        );
      }

      overdueInfo = {
        overdueDaysCount: overdueSessions.length,
        overdueChaptersCount,
        firstOverdueSessionIndex: firstOverdue.sessionIndex,
        firstOverdueSessionTitle: firstOverdue.title,
        firstOverdueSessionDateLabel: firstOverdue.dateLabel,
        projectedEndDateLabel,
        hasTargetEndDate,
        targetEndDateLabel,
        requiredDailyPace,
      };
    }
  }

  // Group sessions into parts (7 sessions per part)
  const sessionsPerPart = 7;
  const totalParts = Math.max(1, Math.ceil(sessions.length / sessionsPerPart));
  const parts: PlanPartDetail[] = [];

  for (let pIdx = 1; pIdx <= totalParts; pIdx++) {
    const startSessionIdx = (pIdx - 1) * sessionsPerPart + 1;
    const endSessionIdx = Math.min(sessions.length, pIdx * sessionsPerPart);
    const partSessions = sessions.slice(startSessionIdx - 1, endSessionIdx);
    const completedSessions = partSessions.filter((s) => s.isCompleted).length;

    parts.push({
      partIndex: pIdx,
      title: `Part ${pIdx}`,
      subtitle: `Sessions ${startSessionIdx}–${endSessionIdx} • Part ${pIdx} of ${totalParts}`,
      startSessionIndex: startSessionIdx,
      endSessionIndex: endSessionIdx,
      completedSessions,
      totalSessions: partSessions.length,
      isCompleted:
        partSessions.length > 0 && completedSessions === partSessions.length,
    });
  }

  // Count notes for this plan instance
  const planNotes = await db.query.notes.findMany({
    where: and(
      eq(notes.userId, session.user.id),
      eq(notes.planInstanceId, instance.id)
    ),
  });

  return {
    id: instance.id,
    templateId: instance.templateId,
    title: instance.title,
    subtitle: blueprint?.subtitle || "",
    description: blueprint?.description || "",
    category: blueprint?.category || "Reading Plan",
    icon: blueprint?.icon || "book-open",
    accentColor: blueprint?.accentColor || "#82ADD4",
    status: instance.status as "active" | "paused" | "completed" | "archived",
    mode: instance.mode as "scheduled" | "flexible",
    paceType: instance.paceType as
      "by_daily_target" | "by_end_date" | "self_paced",
    allowCustomPace: blueprint?.allowCustomPace !== false,
    allowSelfPaced: blueprint?.allowSelfPaced !== false,
    recommendedDays: blueprint?.recommendedDays || 30,
    startDate: instance.startDate.toISOString(),
    targetEndDate: instance.targetEndDate
      ? instance.targetEndDate.toISOString()
      : null,
    completedAt: instance.completedAt
      ? instance.completedAt.toISOString()
      : null,
    dailyTarget: instance.dailyTarget,
    totalChapters: instance.totalChapters,
    completedChapters,
    progressPercent,
    activeDaysMask: instance.activeDaysMask,
    reminderEnabled: instance.reminderEnabled,
    reminderTime: instance.reminderTime,
    tracker: {
      id: instance.tracker.id,
      name: instance.tracker.name,
      canon: instance.tracker.canon,
      color: instance.tracker.color,
      icon: instance.tracker.icon,
    },
    sessions,
    parts,
    notesCount: planNotes.length,
    overdueInfo,
  };
}

export type TogglePlanReadingItemActionParams = {
  instanceId: string;
  readingItemId: string;
};

export type TogglePlanReadingResult =
  | {
      success: true;
      isCompleted: boolean;
      readingItemId: string;
      completedChapters: number;
      progressPercent: number;
    }
  | { success: false; error: string };

export async function togglePlanReadingItemAction({
  instanceId,
  readingItemId,
}: TogglePlanReadingItemActionParams): Promise<TogglePlanReadingResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = v.safeParse(TogglePlanReadingSchema, {
    instanceId,
    readingItemId,
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters" };
  }

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
    with: {
      completedReadings: true,
    },
  });

  if (!instance) {
    return { success: false, error: "Plan instance not found" };
  }

  if (instance.status === "paused") {
    return {
      success: false,
      error:
        "This reading plan is paused. Check marks are locked. Resume the plan to start logging your readings again.",
    };
  }

  const blueprint = getReadingPlanById(instance.templateId);
  const readingItem = blueprint?.readings.find(
    (r) => r.id === parsed.output.readingItemId
  );

  const isAlreadyCompleted = instance.completedReadings.some(
    (r) => r.readingItemId === parsed.output.readingItemId
  );

  // In scheduled pacing, prevent completing readings in locked future sessions
  if (instance.mode === "scheduled" && !isAlreadyCompleted && readingItem) {
    const readings = blueprint?.readings || [];
    const dailyTarget = Math.max(1, instance.dailyTarget || 2);
    const itemIndex = readings.findIndex(
      (r) => r.id === parsed.output.readingItemId
    );
    if (itemIndex >= dailyTarget) {
      const priorSessionEndIndex =
        Math.floor(itemIndex / dailyTarget) * dailyTarget;
      const priorReadings = readings.slice(0, priorSessionEndIndex);
      const completedSet = new Set(
        instance.completedReadings.map((r) => r.readingItemId)
      );
      const hasIncompletePrior = priorReadings.some(
        (r) => !completedSet.has(r.id)
      );
      if (hasIncompletePrior) {
        return {
          success: false,
          error: "Please complete previous sessions to unlock this reading.",
        };
      }
    }
  }

  const now = new Date();

  if (isAlreadyCompleted) {
    // Unmark reading item
    await db
      .delete(planInstanceReadings)
      .where(
        and(
          eq(planInstanceReadings.instanceId, instance.id),
          eq(planInstanceReadings.readingItemId, parsed.output.readingItemId)
        )
      );

    if (readingItem) {
      await db
        .delete(readingLogs)
        .where(
          and(
            eq(readingLogs.userId, session.user.id),
            eq(readingLogs.trackerId, instance.trackerId),
            eq(readingLogs.bookId, readingItem.bookId),
            eq(readingLogs.chapter, readingItem.chapter),
            eq(readingLogs.planInstanceId, instance.id)
          )
        );
    }

    if (instance.status === "completed") {
      await db
        .update(planInstances)
        .set({ status: "active", completedAt: null })
        .where(eq(planInstances.id, instance.id));
    }

    await syncUserStreak({ userId: session.user.id });

    const newCompletedCount = Math.max(
      0,
      instance.completedReadings.length - 1
    );
    const newProgressPercent = Math.min(
      100,
      Math.round((newCompletedCount / (instance.totalChapters || 1)) * 100)
    );

    revalidatePath(`/plans/${instance.id}`);
    revalidatePath("/plans");
    revalidatePath("/books");

    return {
      success: true,
      isCompleted: false,
      readingItemId: parsed.output.readingItemId,
      completedChapters: newCompletedCount,
      progressPercent: newProgressPercent,
    };
  }

  // Mark reading item as completed
  await db.insert(planInstanceReadings).values({
    id: crypto.randomUUID(),
    instanceId: instance.id,
    readingItemId: parsed.output.readingItemId,
    completedAt: now,
  });

  if (readingItem) {
    const existingProgress = await db.query.trackerChapterProgress.findFirst({
      where: and(
        eq(trackerChapterProgress.trackerId, instance.trackerId),
        eq(trackerChapterProgress.bookId, readingItem.bookId),
        eq(trackerChapterProgress.chapter, readingItem.chapter)
      ),
    });

    if (!existingProgress) {
      await db.insert(trackerChapterProgress).values({
        id: crypto.randomUUID(),
        trackerId: instance.trackerId,
        bookId: readingItem.bookId,
        chapter: readingItem.chapter,
        completedAt: now,
      });
    }

    await db.insert(readingLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      trackerId: instance.trackerId,
      bookId: readingItem.bookId,
      bookName: readingItem.bookName,
      chapter: readingItem.chapter,
      planInstanceId: instance.id,
      loggedAt: now,
    });
  }

  const newCompletedCount = instance.completedReadings.length + 1;
  const isPlanFinished = newCompletedCount >= instance.totalChapters;

  if (isPlanFinished) {
    await db
      .update(planInstances)
      .set({ status: "completed", completedAt: now })
      .where(eq(planInstances.id, instance.id));
  }

  await syncUserStreak({ userId: session.user.id });

  const newProgressPercent = Math.min(
    100,
    Math.round((newCompletedCount / (instance.totalChapters || 1)) * 100)
  );

  revalidatePath(`/plans/${instance.id}`);
  revalidatePath("/plans");
  revalidatePath("/books");

  return {
    success: true,
    isCompleted: true,
    readingItemId: parsed.output.readingItemId,
    completedChapters: newCompletedCount,
    progressPercent: newProgressPercent,
  };
}

export type UpdatePlanSettingsActionParams = {
  instanceId: string;
  status?: "active" | "paused" | "archived";
  mode?: "scheduled" | "flexible";
  paceType?: "by_daily_target" | "by_end_date" | "self_paced";
  dailyTarget?: number;
  targetEndDate?: string;
  activeDaysMask?: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
  shiftScheduleOnResume?: boolean;
};

export type UpdatePlanSettingsResult =
  | { success: true; plan?: PlanInstanceDetail }
  | { success: false; error: string };

function calculateProjectedEndDate({
  startDate,
  remainingChapters,
  dailyTarget,
  activeDaysMask,
}: {
  startDate: Date;
  remainingChapters: number;
  dailyTarget: number;
  activeDaysMask: string;
}): Date {
  const safePace = Math.max(1, dailyTarget);
  const activeDayIndices: number[] = [];
  for (let i = 0; i < 7; i++) {
    if (activeDaysMask[i] === "1") activeDayIndices.push(i);
  }
  const safeDays =
    activeDayIndices.length > 0 ? activeDayIndices : [0, 1, 2, 3, 4, 5, 6];

  const totalReadingDaysNeeded = Math.max(
    1,
    Math.ceil(remainingChapters / safePace)
  );
  const cursor = new Date(startDate.getTime());
  cursor.setHours(0, 0, 0, 0);

  // Advance cursor to first active reading day
  while (!safeDays.includes(cursor.getDay())) {
    cursor.setDate(cursor.getDate() + 1);
  }

  let activeCount = 1;
  while (activeCount < totalReadingDaysNeeded) {
    cursor.setDate(cursor.getDate() + 1);
    if (safeDays.includes(cursor.getDay())) {
      activeCount++;
    }
  }

  return cursor;
}

export async function updatePlanSettingsAction({
  instanceId,
  status,
  mode,
  paceType,
  dailyTarget,
  targetEndDate,
  activeDaysMask,
  reminderEnabled,
  reminderTime,
  shiftScheduleOnResume,
}: UpdatePlanSettingsActionParams): Promise<UpdatePlanSettingsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(UpdatePlanSettingsSchema, {
    instanceId,
    status,
    mode,
    paceType,
    dailyTarget,
    targetEndDate,
    activeDaysMask,
    reminderEnabled,
    reminderTime,
    shiftScheduleOnResume,
  });
  if (!parsed.success) return { success: false, error: "Invalid parameters" };

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
    with: {
      completedReadings: true,
    },
  });
  if (!instance) return { success: false, error: "Plan not found" };

  const updateValues: Partial<typeof planInstances.$inferInsert> = {};
  if (parsed.output.status) updateValues.status = parsed.output.status;
  if (parsed.output.mode) updateValues.mode = parsed.output.mode;
  if (parsed.output.paceType) updateValues.paceType = parsed.output.paceType;
  if (parsed.output.dailyTarget) {
    updateValues.dailyTarget = parsed.output.dailyTarget;
  }
  if (parsed.output.activeDaysMask) {
    updateValues.activeDaysMask = parsed.output.activeDaysMask;
  }
  if (parsed.output.reminderEnabled !== undefined) {
    updateValues.reminderEnabled = parsed.output.reminderEnabled;
  }
  if (parsed.output.reminderTime !== undefined) {
    updateValues.reminderTime = parsed.output.reminderTime;
  }

  // Handle schedule shift on resume (shifts start date to today)
  if (
    parsed.output.status === "active" &&
    parsed.output.shiftScheduleOnResume &&
    instance.status === "paused"
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    updateValues.startDate = today;
  }

  // Recalculate targetEndDate if needed
  const effectiveMode = parsed.output.mode || instance.mode;
  if (effectiveMode === "flexible") {
    updateValues.targetEndDate = null;
  } else if (parsed.output.targetEndDate) {
    updateValues.targetEndDate = new Date(parsed.output.targetEndDate);
  } else if (
    parsed.output.dailyTarget ||
    parsed.output.activeDaysMask ||
    updateValues.startDate
  ) {
    const remaining = Math.max(
      1,
      (instance.totalChapters || 1) - instance.completedReadings.length
    );
    const startForCalculation = updateValues.startDate || instance.startDate;
    const paceForCalculation =
      parsed.output.dailyTarget || instance.dailyTarget;
    const maskForCalculation =
      parsed.output.activeDaysMask || instance.activeDaysMask;

    const projectedEnd = calculateProjectedEndDate({
      startDate: startForCalculation,
      remainingChapters: remaining,
      dailyTarget: paceForCalculation,
      activeDaysMask: maskForCalculation,
    });
    updateValues.targetEndDate = projectedEnd;
  }

  await db
    .update(planInstances)
    .set(updateValues)
    .where(eq(planInstances.id, instance.id));

  revalidatePath(`/plans/${instance.id}`);
  revalidatePath("/plans");

  const updatedPlan = await getPlanInstanceDetailAction({
    instanceId: instance.id,
  });

  return { success: true, plan: updatedPlan ?? undefined };
}

export type DeletePlanInstanceParams = {
  instanceId: string;
};

export type DeletePlanInstanceResult =
  { success: true } | { success: false; error: string };

export async function deletePlanInstanceAction({
  instanceId,
}: DeletePlanInstanceParams): Promise<DeletePlanInstanceResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(DeletePlanInstanceSchema, { instanceId });
  if (!parsed.success) return { success: false, error: "Invalid parameters" };

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
  });
  if (!instance) return { success: false, error: "Plan not found" };

  await db.delete(planInstances).where(eq(planInstances.id, instance.id));

  revalidatePath("/plans");

  return { success: true };
}

type CalculateShiftedPlanDatesParams = {
  firstIncompleteSessionIndex: number;
  totalSessions: number;
  activeDaysMask: string;
};

function calculateShiftedPlanDates({
  firstIncompleteSessionIndex,
  totalSessions,
  activeDaysMask,
}: CalculateShiftedPlanDatesParams): {
  newStartDate: Date;
  newTargetEndDate: Date;
} {
  const nowMidnight = new Date();
  nowMidnight.setHours(0, 0, 0, 0);

  const activeDayIndices: number[] = [];
  for (let i = 0; i < 7; i++) {
    if ((activeDaysMask || "1111111")[i] === "1") {
      activeDayIndices.push(i);
    }
  }
  const safeDays =
    activeDayIndices.length > 0 ? activeDayIndices : [0, 1, 2, 3, 4, 5, 6];

  const newStartDate = new Date(nowMidnight);
  let daysToStepBack = firstIncompleteSessionIndex;
  while (daysToStepBack > 0) {
    newStartDate.setDate(newStartDate.getDate() - 1);
    if (safeDays.includes(newStartDate.getDay())) {
      daysToStepBack--;
    }
  }
  newStartDate.setHours(0, 0, 0, 0);

  const newTargetEndDate = new Date(nowMidnight);
  let daysToStepForward = Math.max(
    0,
    totalSessions - 1 - firstIncompleteSessionIndex
  );
  while (daysToStepForward > 0) {
    newTargetEndDate.setDate(newTargetEndDate.getDate() + 1);
    if (safeDays.includes(newTargetEndDate.getDay())) {
      daysToStepForward--;
    }
  }
  newTargetEndDate.setHours(23, 59, 59, 999);

  return { newStartDate, newTargetEndDate };
}

export type PausePlanActionParams = {
  instanceId: string;
};

export type PausePlanResult =
  | { success: true; plan?: PlanInstanceDetail }
  | { success: false; error: string };

export async function pausePlanAction({
  instanceId,
}: PausePlanActionParams): Promise<PausePlanResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(PausePlanSchema, { instanceId });
  if (!parsed.success) return { success: false, error: "Invalid parameters" };

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
  });
  if (!instance) return { success: false, error: "Plan not found" };

  await db
    .update(planInstances)
    .set({ status: "paused" })
    .where(eq(planInstances.id, instance.id));

  revalidatePath(`/plans/${instance.id}`);
  revalidatePath("/plans");

  const updatedPlan = await getPlanInstanceDetailAction({
    instanceId: instance.id,
  });

  return { success: true, plan: updatedPlan ?? undefined };
}

export type ResumePlanActionParams = {
  instanceId: string;
};

export type ResumePlanResult =
  | { success: true; plan?: PlanInstanceDetail }
  | { success: false; error: string };

export async function resumePlanAction({
  instanceId,
}: ResumePlanActionParams): Promise<ResumePlanResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ResumePlanSchema, { instanceId });
  if (!parsed.success) return { success: false, error: "Invalid parameters" };

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
    with: {
      completedReadings: true,
    },
  });
  if (!instance) return { success: false, error: "Plan not found" };

  const blueprint = getReadingPlanById(instance.templateId);
  const readings = blueprint?.readings || [];
  const dailyTarget = Math.max(1, instance.dailyTarget || 2);
  const totalSessions = Math.max(1, Math.ceil(readings.length / dailyTarget));

  const completedSet = new Set(
    instance.completedReadings.map((r) => r.readingItemId)
  );

  let firstIncompleteIdx = 0;
  for (let s = 0; s < totalSessions; s++) {
    const chunk = readings.slice(s * dailyTarget, (s + 1) * dailyTarget);
    const hasIncomplete = chunk.some((r) => !completedSet.has(r.id));
    if (hasIncomplete) {
      firstIncompleteIdx = s;
      break;
    }
  }

  const { newStartDate, newTargetEndDate } = calculateShiftedPlanDates({
    firstIncompleteSessionIndex: firstIncompleteIdx,
    totalSessions,
    activeDaysMask: instance.activeDaysMask,
  });

  await db
    .update(planInstances)
    .set({
      status: "active",
      startDate: newStartDate,
      targetEndDate: instance.mode === "scheduled" ? newTargetEndDate : null,
    })
    .where(eq(planInstances.id, instance.id));

  revalidatePath(`/plans/${instance.id}`);
  revalidatePath("/plans");

  const updatedPlan = await getPlanInstanceDetailAction({
    instanceId: instance.id,
  });

  return { success: true, plan: updatedPlan ?? undefined };
}

export type CatchUpShiftActionParams = {
  instanceId: string;
};

export type CatchUpShiftResult =
  | { success: true; plan?: PlanInstanceDetail }
  | { success: false; error: string };

export async function catchUpShiftAction({
  instanceId,
}: CatchUpShiftActionParams): Promise<CatchUpShiftResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(CatchUpShiftSchema, { instanceId });
  if (!parsed.success) return { success: false, error: "Invalid parameters" };

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
    with: {
      completedReadings: true,
    },
  });
  if (!instance) return { success: false, error: "Plan not found" };

  const blueprint = getReadingPlanById(instance.templateId);
  const readings = blueprint?.readings || [];
  const dailyTarget = Math.max(1, instance.dailyTarget || 2);
  const totalSessions = Math.max(1, Math.ceil(readings.length / dailyTarget));

  const completedSet = new Set(
    instance.completedReadings.map((r) => r.readingItemId)
  );

  let firstIncompleteIdx = 0;
  for (let s = 0; s < totalSessions; s++) {
    const chunk = readings.slice(s * dailyTarget, (s + 1) * dailyTarget);
    const hasIncomplete = chunk.some((r) => !completedSet.has(r.id));
    if (hasIncomplete) {
      firstIncompleteIdx = s;
      break;
    }
  }

  const { newStartDate, newTargetEndDate } = calculateShiftedPlanDates({
    firstIncompleteSessionIndex: firstIncompleteIdx,
    totalSessions,
    activeDaysMask: instance.activeDaysMask,
  });

  await db
    .update(planInstances)
    .set({
      startDate: newStartDate,
      targetEndDate: newTargetEndDate,
    })
    .where(eq(planInstances.id, instance.id));

  revalidatePath(`/plans/${instance.id}`);
  revalidatePath("/plans");

  const updatedPlan = await getPlanInstanceDetailAction({
    instanceId: instance.id,
  });

  return { success: true, plan: updatedPlan ?? undefined };
}

export type CatchUpIncreasePaceActionParams = {
  instanceId: string;
  newDailyTarget: number;
};

export type CatchUpIncreasePaceResult =
  | { success: true; plan?: PlanInstanceDetail }
  | { success: false; error: string };

export async function catchUpIncreasePaceAction({
  instanceId,
  newDailyTarget,
}: CatchUpIncreasePaceActionParams): Promise<CatchUpIncreasePaceResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(CatchUpIncreasePaceSchema, {
    instanceId,
    newDailyTarget,
  });
  if (!parsed.success) return { success: false, error: "Invalid parameters" };

  const instance = await db.query.planInstances.findFirst({
    where: and(
      eq(planInstances.id, parsed.output.instanceId),
      eq(planInstances.userId, session.user.id)
    ),
    with: {
      completedReadings: true,
    },
  });
  if (!instance) return { success: false, error: "Plan not found" };

  const remaining = Math.max(
    1,
    (instance.totalChapters || 1) - instance.completedReadings.length
  );

  const projectedEnd = calculateProjectedEndDate({
    startDate: new Date(),
    remainingChapters: remaining,
    dailyTarget: parsed.output.newDailyTarget,
    activeDaysMask: instance.activeDaysMask,
  });

  await db
    .update(planInstances)
    .set({
      dailyTarget: parsed.output.newDailyTarget,
      targetEndDate: instance.mode === "scheduled" ? projectedEnd : null,
    })
    .where(eq(planInstances.id, instance.id));

  revalidatePath(`/plans/${instance.id}`);
  revalidatePath("/plans");

  const updatedPlan = await getPlanInstanceDetailAction({
    instanceId: instance.id,
  });

  return { success: true, plan: updatedPlan ?? undefined };
}
