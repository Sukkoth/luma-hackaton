import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  readingTrackers,
  trackerChapterProgress,
  trackerVerseProgress,
  noteFolders,
  notes,
  planInstances,
  planInstanceReadings,
  planDayOverrides,
  readingLogs,
  unlockedAchievements,
} from "@/db/schema";
import { getBibleBookById } from "@/data/bibleData";
import { syncUserStreak } from "@/lib/streak-service";
import type { UserDataExport } from "@/lib/schemas/data-export";

export type ExportUserDataParams = {
  userId: string;
};

function extractPlainTextSnippet({ html }: { html: string }): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

export async function exportUserData({
  userId,
}: ExportUserDataParams): Promise<UserDataExport> {
  const [
    trackersList,
    foldersList,
    notesList,
    plansList,
    logsList,
    achievementsList,
  ] = await Promise.all([
    db.query.readingTrackers.findMany({
      where: eq(readingTrackers.userId, userId),
      with: {
        chapterProgress: true,
        verseProgress: true,
      },
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.noteFolders.findMany({
      where: eq(noteFolders.userId, userId),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.notes.findMany({
      where: eq(notes.userId, userId),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.planInstances.findMany({
      where: eq(planInstances.userId, userId),
      with: {
        completedReadings: true,
        dayOverrides: true,
      },
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    }),
    db.query.readingLogs.findMany({
      where: eq(readingLogs.userId, userId),
      orderBy: (table, { asc }) => [asc(table.loggedAt)],
    }),
    db.query.unlockedAchievements.findMany({
      where: eq(unlockedAchievements.userId, userId),
      orderBy: (table, { asc }) => [asc(table.unlockedAt)],
    }),
  ]);

  // Synthetic references: short tokens to eliminate UUID duplication
  const trackerIdToRef = new Map<string, string>();
  const folderIdToRef = new Map<string, string>();
  const planIdToRef = new Map<string, string>();

  trackersList.forEach((t, i) => {
    trackerIdToRef.set(t.id, `t_${i}`);
  });

  foldersList.forEach((f, i) => {
    folderIdToRef.set(f.id, `f_${i}`);
  });

  plansList.forEach((p, i) => {
    planIdToRef.set(p.id, `p_${i}`);
  });

  // Compact Trackers with dictionary grouped progress
  const exportTrackers = trackersList.map((t) => {
    const ref = trackerIdToRef.get(t.id) ?? "t_0";

    // Compact dictionary: bookId -> sorted chapter numbers [1, 2, 3]
    const progress: Record<string, number[]> = {};
    for (const cp of t.chapterProgress) {
      if (!progress[cp.bookId]) progress[cp.bookId] = [];
      progress[cp.bookId]!.push(cp.chapter);
    }
    for (const book of Object.keys(progress)) {
      progress[book]!.sort((a, b) => a - b);
    }

    // Compact dictionary for verses (if any)
    const verses: Record<string, Record<string, number[]>> = {};
    for (const vp of t.verseProgress) {
      if (!verses[vp.bookId]) verses[vp.bookId] = {};
      const chStr = String(vp.chapter);
      if (!verses[vp.bookId]![chStr]) verses[vp.bookId]![chStr] = [];
      verses[vp.bookId]![chStr]!.push(vp.verse);
    }

    return {
      ref,
      name: t.name,
      canon: t.canon,
      icon: t.icon !== "book" ? t.icon : undefined,
      desc: t.description ? t.description : undefined,
      archived: t.isArchived ? true : undefined,
      created: t.createdAt.toISOString(),
      progress,
      verses: Object.keys(verses).length > 0 ? verses : undefined,
    };
  });

  // Compact Folders
  const exportFolders = foldersList.map((f) => ({
    ref: folderIdToRef.get(f.id) ?? "f_0",
    name: f.name,
    color: f.color ?? undefined,
    icon: f.icon ?? undefined,
    pinned: f.isPinned ? true : undefined,
    created: f.createdAt.toISOString(),
  }));

  // Compact Notes (omits plainTextSnippet as it is derived on import)
  const exportNotes = notesList.map((n) => ({
    title: n.title,
    body: n.bodyHtml || undefined,
    folder: n.folderId ? folderIdToRef.get(n.folderId) ?? null : undefined,
    tracker: n.trackerId ? trackerIdToRef.get(n.trackerId) ?? null : undefined,
    plan: n.planInstanceId ? planIdToRef.get(n.planInstanceId) ?? null : undefined,
    day: n.planDayNumber ?? undefined,
    session: n.planSessionId ?? undefined,
    pinned: n.isPinned ? true : undefined,
    archived: n.isArchived ? true : undefined,
    created: n.createdAt.toISOString(),
  }));

  // Compact Plans
  const exportPlans = plansList.map((p) => {
    const ref = planIdToRef.get(p.id) ?? "p_0";
    const tracker = trackerIdToRef.get(p.trackerId) ?? "t_0";

    return {
      ref,
      templateId: p.templateId,
      tracker,
      title: p.title,
      status: p.status,
      mode: p.mode,
      pace: p.paceType,
      start: p.startDate.toISOString(),
      targetEnd: p.targetEndDate ? p.targetEndDate.toISOString() : undefined,
      completedAt: p.completedAt ? p.completedAt.toISOString() : undefined,
      dailyTarget: p.dailyTarget,
      totalChapters: p.totalChapters,
      daysMask: p.activeDaysMask !== "1111111" ? p.activeDaysMask : undefined,
      pacingSegments: p.pacingSegmentsJson ?? undefined,
      created: p.createdAt.toISOString(),
      readings: p.completedReadings.map((r) => r.readingItemId),
      overrides: p.dayOverrides.map(
        (o) => [o.dayIndex, o.overrideDate.toISOString()] as [number, string]
      ),
    };
  });

  // Compact Reading Log Tuples: [trackerRef, bookId, chapter, loggedAtISO, planRef?]
  const exportLogs = logsList.map((l) => {
    const tRef = trackerIdToRef.get(l.trackerId) ?? "t_0";
    const pRef = l.planInstanceId ? planIdToRef.get(l.planInstanceId) ?? null : null;

    const tuple: [string, string, number, string, ...(string | null)[]] = pRef
      ? [tRef, l.bookId, l.chapter, l.loggedAt.toISOString(), pRef]
      : [tRef, l.bookId, l.chapter, l.loggedAt.toISOString()];
    return tuple;
  });

  // Compact Achievements Map: { achievementId: unlockedAtISO }
  const exportAchievements: Record<string, string> = {};
  for (const a of achievementsList) {
    exportAchievements[a.achievementId] = a.unlockedAt.toISOString();
  }

  return {
    v: 1,
    app: "Scripture Tracker",
    exportedAt: new Date().toISOString(),
    trackers: exportTrackers,
    folders: exportFolders.length > 0 ? exportFolders : undefined,
    notes: exportNotes.length > 0 ? exportNotes : undefined,
    plans: exportPlans.length > 0 ? exportPlans : undefined,
    logs: exportLogs.length > 0 ? exportLogs : undefined,
    achievements:
      Object.keys(exportAchievements).length > 0 ? exportAchievements : undefined,
  };
}

export type ImportCounts = {
  trackers: number;
  chapters: number;
  verses: number;
  folders: number;
  notes: number;
  plans: number;
  logs: number;
  achievements: number;
};

export type ImportUserDataParams = {
  userId: string;
  data: UserDataExport;
};

export async function importUserData({
  userId,
  data,
}: ImportUserDataParams): Promise<ImportCounts> {
  const counts: ImportCounts = {
    trackers: 0,
    chapters: 0,
    verses: 0,
    folders: 0,
    notes: 0,
    plans: 0,
    logs: 0,
    achievements: 0,
  };

  // Run the multi-table import inside a database transaction for complete ACID guarantees
  await db.transaction(async (tx) => {
    // 1. Fetch existing user records for non-duplicating merge
    const [existingTrackers, existingFolders, existingPlans, existingNotes] =
      await Promise.all([
        tx.query.readingTrackers.findMany({
          where: eq(readingTrackers.userId, userId),
        }),
        tx.query.noteFolders.findMany({
          where: eq(noteFolders.userId, userId),
        }),
        tx.query.planInstances.findMany({
          where: eq(planInstances.userId, userId),
        }),
        tx.query.notes.findMany({
          where: eq(notes.userId, userId),
          columns: { id: true, title: true, bodyHtml: true },
        }),
      ]);

    const trackerRefToDbId = new Map<string, string>();
    const folderRefToDbId = new Map<string, string>();
    const planRefToDbId = new Map<string, string>();

    // 2. Merge Reading Trackers
    for (const tracker of data.trackers) {
      let targetTrackerId: string | undefined;

      const existing = existingTrackers.find(
        (et) =>
          et.canon === tracker.canon &&
          et.name.trim().toLowerCase() === tracker.name.trim().toLowerCase()
      );

      if (existing) {
        targetTrackerId = existing.id;
      } else {
        const [newTracker] = await tx
          .insert(readingTrackers)
          .values({
            userId,
            name: tracker.name,
            description: tracker.desc ?? "",
            icon: tracker.icon ?? "book",
            canon: tracker.canon,
            isArchived: tracker.archived ?? false,
            createdAt: tracker.created ? new Date(tracker.created) : new Date(),
          })
          .returning({ id: readingTrackers.id });

        if (newTracker) {
          targetTrackerId = newTracker.id;
          counts.trackers += 1;
        }
      }

      if (targetTrackerId) {
        trackerRefToDbId.set(tracker.ref, targetTrackerId);

        // Merge grouped chapter progress
        for (const [bookId, chapters] of Object.entries(tracker.progress ?? {})) {
          for (const ch of chapters) {
            await tx
              .insert(trackerChapterProgress)
              .values({
                trackerId: targetTrackerId,
                bookId,
                chapter: ch,
                completedAt: new Date(),
              })
              .onConflictDoNothing();
            counts.chapters += 1;
          }
        }

        // Merge grouped verse progress (if present)
        for (const [bookId, chaptersObj] of Object.entries(tracker.verses ?? {})) {
          for (const [chStr, verses] of Object.entries(chaptersObj)) {
            const chNum = parseInt(chStr, 10);
            for (const vNum of verses) {
              await tx
                .insert(trackerVerseProgress)
                .values({
                  trackerId: targetTrackerId,
                  bookId,
                  chapter: chNum,
                  verse: vNum,
                  completedAt: new Date(),
                })
                .onConflictDoNothing();
              counts.verses += 1;
            }
          }
        }
      }
    }

    const fallbackTrackerId =
      trackerRefToDbId.values().next().value ?? existingTrackers[0]?.id;

    // 3. Merge Note Folders
    for (const folder of data.folders ?? []) {
      let targetFolderId: string | undefined;

      const existing = existingFolders.find(
        (ef) => ef.name.trim().toLowerCase() === folder.name.trim().toLowerCase()
      );

      if (existing) {
        targetFolderId = existing.id;
      } else {
        const [newFolder] = await tx
          .insert(noteFolders)
          .values({
            userId,
            name: folder.name,
            color: folder.color,
            icon: folder.icon,
            isPinned: folder.pinned ?? false,
            createdAt: folder.created ? new Date(folder.created) : new Date(),
          })
          .returning({ id: noteFolders.id });

        if (newFolder) {
          targetFolderId = newFolder.id;
          counts.folders += 1;
        }
      }

      if (targetFolderId) {
        folderRefToDbId.set(folder.ref, targetFolderId);
      }
    }

    // 4. Merge Plan Instances
    for (const plan of data.plans ?? []) {
      const targetTrackerId =
        trackerRefToDbId.get(plan.tracker) ?? fallbackTrackerId;
      if (!targetTrackerId) continue;

      let targetPlanId: string | undefined;

      const existing = existingPlans.find(
        (ep) =>
          ep.templateId === plan.templateId &&
          ep.title.trim().toLowerCase() === plan.title.trim().toLowerCase()
      );

      if (existing) {
        targetPlanId = existing.id;
      } else {
        const [newPlan] = await tx
          .insert(planInstances)
          .values({
            userId,
            trackerId: targetTrackerId,
            templateId: plan.templateId,
            title: plan.title,
            status: plan.status ?? "active",
            mode: plan.mode ?? "scheduled",
            paceType: plan.pace ?? "by_daily_target",
            startDate: new Date(plan.start),
            targetEndDate: plan.targetEnd ? new Date(plan.targetEnd) : null,
            completedAt: plan.completedAt ? new Date(plan.completedAt) : null,
            dailyTarget: plan.dailyTarget,
            totalChapters: plan.totalChapters,
            activeDaysMask: plan.daysMask ?? "1111111",
            pacingSegmentsJson: plan.pacingSegments,
            createdAt: plan.created ? new Date(plan.created) : new Date(),
          })
          .returning({ id: planInstances.id });

        if (newPlan) {
          targetPlanId = newPlan.id;
          counts.plans += 1;
        }
      }

      if (targetPlanId) {
        planRefToDbId.set(plan.ref, targetPlanId);

        for (const readingItemId of plan.readings ?? []) {
          await tx
            .insert(planInstanceReadings)
            .values({
              instanceId: targetPlanId,
              readingItemId,
              completedAt: new Date(),
            })
            .onConflictDoNothing();
        }

        for (const [dayIndex, overrideDate] of plan.overrides ?? []) {
          await tx
            .insert(planDayOverrides)
            .values({
              instanceId: targetPlanId,
              dayIndex,
              overrideDate: new Date(overrideDate),
            })
            .onConflictDoNothing();
        }
      }
    }

    // 5. Merge Notes
    for (const note of data.notes ?? []) {
      const isDuplicate = existingNotes.some(
        (en) =>
          en.title.trim() === note.title.trim() &&
          en.bodyHtml.trim() === (note.body ?? "").trim()
      );

      if (!isDuplicate) {
        const targetFolderId = note.folder
          ? folderRefToDbId.get(note.folder) ?? null
          : null;
        const targetTrackerId = note.tracker
          ? trackerRefToDbId.get(note.tracker) ?? null
          : null;
        const targetPlanId = note.plan
          ? planRefToDbId.get(note.plan) ?? null
          : null;

        const bodyHtml = note.body ?? "";
        const snippet = extractPlainTextSnippet({ html: bodyHtml });

        await tx.insert(notes).values({
          userId,
          folderId: targetFolderId,
          trackerId: targetTrackerId,
          planInstanceId: targetPlanId,
          planDayNumber: note.day,
          planSessionId: note.session,
          title: note.title,
          bodyHtml,
          plainTextSnippet: snippet,
          isPinned: note.pinned ?? false,
          isArchived: note.archived ?? false,
          createdAt: note.created ? new Date(note.created) : new Date(),
        });
        counts.notes += 1;
      }
    }

    // 6. Merge Reading Log Tuples: [trackerRef, bookId, chapter, loggedAtISO, planRef?]
    for (const logTuple of data.logs ?? []) {
      const [tRef, bookIdRaw, chapterRaw, loggedAtRaw, pRefRaw] = logTuple;
      if (!tRef || !bookIdRaw || chapterRaw === undefined || !loggedAtRaw) continue;

      const trackerRef = String(tRef);
      const bookId = String(bookIdRaw);
      const chapter = Number(chapterRaw);
      const loggedDate = new Date(String(loggedAtRaw));
      const planRef = pRefRaw ? String(pRefRaw) : null;

      const targetTrackerId =
        trackerRefToDbId.get(trackerRef) ?? fallbackTrackerId;
      if (!targetTrackerId) continue;

      const targetPlanId = planRef ? planRefToDbId.get(planRef) ?? null : null;

      const existingLog = await tx.query.readingLogs.findFirst({
        where: and(
          eq(readingLogs.userId, userId),
          eq(readingLogs.bookId, bookId),
          eq(readingLogs.chapter, chapter),
          eq(readingLogs.loggedAt, loggedDate)
        ),
      });

      if (!existingLog) {
        const normalizedId = bookId.toLowerCase();
        const book = getBibleBookById(normalizedId) || getBibleBookById(bookId);
        const bookName = book?.name || bookId;

        await tx.insert(readingLogs).values({
          userId,
          trackerId: targetTrackerId,
          planInstanceId: targetPlanId,
          bookId,
          bookName,
          chapter,
          loggedAt: loggedDate,
        });
        counts.logs += 1;
      }
    }

    // 7. Merge Achievements Map: { achievementId: unlockedAtISO }
    for (const [achievementId, unlockedAtStr] of Object.entries(
      data.achievements ?? {}
    )) {
      await tx
        .insert(unlockedAchievements)
        .values({
          userId,
          achievementId,
          unlockedAt: new Date(unlockedAtStr),
        })
        .onConflictDoNothing();
      counts.achievements += 1;
    }
  });

  // 8. Dynamic streak recalibration after transaction commits
  await syncUserStreak({ userId });

  return counts;
}
