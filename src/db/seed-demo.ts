import { db } from "@/db";
import {
  user,
  userSettings,
  readingTrackers,
  trackerChapterProgress,
  readingLogs,
  planInstances,
  planInstanceReadings,
  planReadingItems,
  noteFolders,
  notes,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import { shiftDateString, getLocalDateString } from "@/lib/timezone";

type SeedDayPlan = {
  daysAgo: number;
  chapters: {
    tracker: "tracker1" | "tracker2";
    bookId: string;
    bookName: string;
    chapter: number;
    hour: number;
    planTemplateId?: string;
    readingItemId?: string;
  }[];
  isFrozen?: boolean;
};

export async function seedDemoData(): Promise<void> {
  console.log("==========================================");
  console.log("       SEEDING 3-MONTH DEMO DATA          ");
  console.log("==========================================");

  const demoEmail = "demo@example.com";
  const demoPassword = "Password123!";
  const demoName = "Demo Reader";
  const timeZone = "UTC";

  const todayStr = getLocalDateString({ date: new Date(), timeZone });
  console.log(`Anchor today: ${todayStr} (${timeZone})`);

  // 1. Find or create demo user
  let existingUser = await db.query.user.findFirst({
    where: eq(user.email, demoEmail),
  });

  if (!existingUser) {
    console.log(`Creating demo user: ${demoEmail}...`);
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: demoEmail,
        password: demoPassword,
        name: demoName,
      },
    });

    if (!signUpResult?.user?.id) {
      throw new Error("Failed to create demo user via Better Auth");
    }

    existingUser = await db.query.user.findFirst({
      where: eq(user.email, demoEmail),
    });

    if (!existingUser) {
      throw new Error("User was created but could not be queried");
    }
  } else {
    console.log(
      `Demo user already exists (id: ${existingUser.id}). Cleaning existing data...`
    );
    // Clean up existing trackers, progress, logs, plan instances, notes
    const userTrackers = await db.query.readingTrackers.findMany({
      where: eq(readingTrackers.userId, existingUser.id),
      columns: { id: true },
    });
    const trackerIds = userTrackers.map((t) => t.id);

    if (trackerIds.length > 0) {
      await db
        .delete(trackerChapterProgress)
        .where(inArray(trackerChapterProgress.trackerId, trackerIds));
      await db
        .delete(planInstances)
        .where(inArray(planInstances.trackerId, trackerIds));
      await db
        .delete(readingLogs)
        .where(inArray(readingLogs.trackerId, trackerIds));
      await db
        .delete(readingTrackers)
        .where(inArray(readingTrackers.id, trackerIds));
    }

    await db.delete(noteFolders).where(eq(noteFolders.userId, existingUser.id));
    await db.delete(notes).where(eq(notes.userId, existingUser.id));
  }

  const userId = existingUser.id;

  // 2. Create Tracker 1: Personal Reading (Protestant Canon)
  const tracker1Id = crypto.randomUUID();
  console.log(`Creating Tracker 1: 'Personal Reading' (${tracker1Id})...`);
  await db.insert(readingTrackers).values({
    id: tracker1Id,
    userId,
    name: "Personal Reading",
    canon: "protestant",
    color: "#10B981",
    icon: "book",
    description: "Daily personal walk through Scripture (Standard 66 Books)",
  });

  // 3. Create Tracker 2: Gospels & Devotional Study
  const tracker2Id = crypto.randomUUID();
  console.log(`Creating Tracker 2: 'Gospels & Study' (${tracker2Id})...`);
  await db.insert(readingTrackers).values({
    id: tracker2Id,
    userId,
    name: "Gospels & Study",
    canon: "protestant",
    color: "#6366F1",
    icon: "bookmark",
    description: "Deep dive into the Gospels and Epistles",
  });

  // 4. Enroll in Plans
  console.log("Setting up active reading plans...");

  // Plan 1 in Tracker 1: Romans - The Gospel of Grace (16 chapters)
  const plan1InstanceId = crypto.randomUUID();
  const plan1StartDate = new Date(Date.now() - 14 * 86400000);
  plan1StartDate.setHours(0, 0, 0, 0);

  await db.insert(planInstances).values({
    id: plan1InstanceId,
    userId,
    trackerId: tracker1Id,
    templateId: "romans_grace_16",
    title: "Romans: The Gospel of Grace",
    status: "active",
    mode: "scheduled",
    paceType: "by_daily_target",
    startDate: plan1StartDate,
    dailyTarget: 1,
    totalChapters: 16,
    activeDaysMask: "1111111",
  });

  // Plan 2 in Tracker 2: The Four Gospels in 30 Days (89 chapters)
  const plan2InstanceId = crypto.randomUUID();
  const plan2StartDate = new Date(Date.now() - 35 * 86400000);
  plan2StartDate.setHours(0, 0, 0, 0);

  await db.insert(planInstances).values({
    id: plan2InstanceId,
    userId,
    trackerId: tracker2Id,
    templateId: "the_four_gospels_30",
    title: "The Four Gospels in 30 Days",
    status: "active",
    mode: "scheduled",
    paceType: "by_daily_target",
    startDate: plan2StartDate,
    dailyTarget: 3,
    totalChapters: 89,
    activeDaysMask: "1111111",
  });

  // Query template reading items to link plan progress
  const romansItems = await db
    .select()
    .from(planReadingItems)
    .where(eq(planReadingItems.templateId, "romans_grace_16"))
    .orderBy(planReadingItems.orderIndex);

  const gospelsItems = await db
    .select()
    .from(planReadingItems)
    .where(eq(planReadingItems.templateId, "the_four_gospels_30"))
    .orderBy(planReadingItems.orderIndex);

  // 5. Construct 3-Month Daily Schedule (-89 days to 0 days ago)
  // Total 90 calendar days
  const frozenDates: string[] = [];

  // Streak Freeze days:
  // Day -62: Missed reading, saved by freeze #1
  // Day -38: Missed reading, saved by freeze #2
  // Day -15: Missed reading, saved by freeze #3
  const freezeOffsets = [62, 38, 15];
  for (const offset of freezeOffsets) {
    const fStr = shiftDateString({ dateStr: todayStr, daysOffset: -offset });
    frozenDates.push(fStr);
  }
  frozenDates.sort();

  console.log(`Configuring 3 Streak Freezes on: ${frozenDates.join(", ")}`);

  // Build daily reading schedule
  const schedule: SeedDayPlan[] = [];

  // OT Chapters sequence (Genesis 1-40, Psalms 1-25, Isaiah 1-10)
  let genIndex = 1;
  let psaIndex = 1;
  let isaIndex = 1;

  // NT Chapters sequence for Tracker 1 (Romans 1-12, Matthew 1-12)
  let romIndex = 1;
  let matIndex = 1;

  // NT Chapters sequence for Tracker 2 (Mark 1-16 completed, Luke 1-15)
  let mrkIndex = 1;
  let lukIndex = 1;

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const dateStr = shiftDateString({
      dateStr: todayStr,
      daysOffset: -daysAgo,
    });

    if (frozenDates.includes(dateStr)) {
      // User did not read on this day — covered by Streak Freeze shield!
      schedule.push({
        daysAgo,
        chapters: [],
        isFrozen: true,
      });
      continue;
    }

    const dayChapters: SeedDayPlan["chapters"] = [];

    // Realistic variation of chapters read per day (1 to 4 chapters)
    // Days -14 to 0: Recent sprint with Romans in Tracker 1
    if (daysAgo <= 14) {
      // Tracker 1: Romans Plan
      if (romIndex <= 12) {
        const item = romansItems[romIndex - 1];
        dayChapters.push({
          tracker: "tracker1",
          bookId: "rom",
          bookName: "Romans",
          chapter: romIndex,
          hour: 8,
          planTemplateId: "romans_grace_16",
          readingItemId: item?.id,
        });
        romIndex++;
      }

      // Add evening Genesis / Psalm reading
      if (daysAgo % 2 === 0 && genIndex <= 40) {
        dayChapters.push({
          tracker: "tracker1",
          bookId: "gen",
          bookName: "Genesis",
          chapter: genIndex,
          hour: 21,
        });
        genIndex++;
      }

      // Tracker 2: Occasional Luke reading
      if (daysAgo % 3 === 0 && lukIndex <= 15) {
        dayChapters.push({
          tracker: "tracker2",
          bookId: "luk",
          bookName: "Luke",
          chapter: lukIndex,
          hour: 13,
        });
        lukIndex++;
      }
    } else if (daysAgo <= 45) {
      // Days -45 to -16: Mid-period readings
      // Tracker 1: Psalms & Matthew
      if (psaIndex <= 25) {
        dayChapters.push({
          tracker: "tracker1",
          bookId: "psa",
          bookName: "Psalms",
          chapter: psaIndex,
          hour: 7,
        });
        psaIndex++;
      }

      if (matIndex <= 12 && daysAgo % 2 === 0) {
        dayChapters.push({
          tracker: "tracker1",
          bookId: "mat",
          bookName: "Matthew",
          chapter: matIndex,
          hour: 20,
        });
        matIndex++;
      }

      // Tracker 2: Gospel of Mark in full!
      if (mrkIndex <= 16) {
        const item = gospelsItems.find(
          (g) => g.bookId === "mrk" && g.chapter === mrkIndex
        );
        dayChapters.push({
          tracker: "tracker2",
          bookId: "mrk",
          bookName: "Mark",
          chapter: mrkIndex,
          hour: 12,
          planTemplateId: "the_four_gospels_30",
          readingItemId: item?.id,
        });
        mrkIndex++;
      }
    } else {
      // Days -89 to -46: Early period readings (Genesis & Isaiah)
      if (genIndex <= 30) {
        dayChapters.push({
          tracker: "tracker1",
          bookId: "gen",
          bookName: "Genesis",
          chapter: genIndex,
          hour: 21,
        });
        genIndex++;
      }

      if (daysAgo % 3 === 0 && isaIndex <= 10) {
        dayChapters.push({
          tracker: "tracker1",
          bookId: "isa",
          bookName: "Isaiah",
          chapter: isaIndex,
          hour: 18,
        });
        isaIndex++;
      }

      // Tracker 2: Matthew in Gospels Plan
      if (daysAgo % 2 === 0 && mrkIndex <= 5) {
        dayChapters.push({
          tracker: "tracker2",
          bookId: "mrk",
          bookName: "Mark",
          chapter: mrkIndex,
          hour: 12,
        });
        mrkIndex++;
      }
    }

    // Guarantee at least 1 reading on non-frozen days to preserve streak
    if (dayChapters.length === 0) {
      dayChapters.push({
        tracker: "tracker1",
        bookId: "psa",
        bookName: "Psalms",
        chapter: (daysAgo % 20) + 1,
        hour: 20,
      });
    }

    schedule.push({
      daysAgo,
      chapters: dayChapters,
      isFrozen: false,
    });
  }

  // 6. Insert all chapter progress & reading logs
  console.log("Seeding reading chapters and logs into database...");

  const baseNowMs = Date.now();
  let totalLogsCount = 0;
  const plan1CompletedReadings: { readingItemId: string; completedAt: Date }[] =
    [];
  const plan2CompletedReadings: { readingItemId: string; completedAt: Date }[] =
    [];

  for (const day of schedule) {
    if (day.isFrozen || day.chapters.length === 0) continue;

    for (const ch of day.chapters) {
      const trackerId = ch.tracker === "tracker1" ? tracker1Id : tracker2Id;

      // Realistic timestamp
      const logDate = new Date(baseNowMs - day.daysAgo * 86400000);
      logDate.setHours(ch.hour, Math.floor(Math.random() * 45) + 5, 0, 0);

      // Tracker chapter progress (unique per tracker + book + chapter)
      await db
        .insert(trackerChapterProgress)
        .values({
          trackerId,
          bookId: ch.bookId,
          chapter: ch.chapter,
          completedAt: logDate,
        })
        .onConflictDoNothing();

      // Reading log entry
      const planInstanceId =
        ch.tracker === "tracker1" && ch.planTemplateId === "romans_grace_16"
          ? plan1InstanceId
          : ch.tracker === "tracker2" &&
              ch.planTemplateId === "the_four_gospels_30"
            ? plan2InstanceId
            : null;

      await db.insert(readingLogs).values({
        userId,
        trackerId,
        bookId: ch.bookId,
        bookName: ch.bookName,
        chapter: ch.chapter,
        planInstanceId,
        loggedAt: logDate,
      });

      if (ch.readingItemId) {
        if (ch.planTemplateId === "romans_grace_16") {
          plan1CompletedReadings.push({
            readingItemId: ch.readingItemId,
            completedAt: logDate,
          });
        } else if (ch.planTemplateId === "the_four_gospels_30") {
          plan2CompletedReadings.push({
            readingItemId: ch.readingItemId,
            completedAt: logDate,
          });
        }
      }

      totalLogsCount++;
    }
  }

  // 7. Insert completed plan instance readings with realistic daily completion dates
  for (const item of plan1CompletedReadings) {
    await db
      .insert(planInstanceReadings)
      .values({
        instanceId: plan1InstanceId,
        readingItemId: item.readingItemId,
        completedAt: item.completedAt,
      })
      .onConflictDoNothing();
  }

  for (const item of plan2CompletedReadings) {
    await db
      .insert(planInstanceReadings)
      .values({
        instanceId: plan2InstanceId,
        readingItemId: item.readingItemId,
        completedAt: item.completedAt,
      })
      .onConflictDoNothing();
  }

  // 8. Configure User Settings
  // Streak metrics:
  // - Current streak is continuous since freeze #3 (Day -14): 15 consecutive days
  // - Longest streak was achieved between freeze #1 and freeze #2: 36 days
  // - 2 streak freeze shields currently available
  // - 3 streak freeze dates recorded in frozenDatesJson
  console.log("Configuring User Settings and Streak stats...");
  await db
    .insert(userSettings)
    .values({
      userId,
      activeTrackerId: tracker1Id,
      hasCompletedOnboarding: true,
      currentStreak: 15,
      longestStreak: 36,
      lastReadDate: todayStr,
      timezone: timeZone,
      streakFreezesAvailable: 2,
      frozenDatesJson: JSON.stringify(frozenDates),
      freezeRestorationDaysCount: 1,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        activeTrackerId: tracker1Id,
        hasCompletedOnboarding: true,
        currentStreak: 15,
        longestStreak: 36,
        lastReadDate: todayStr,
        timezone: timeZone,
        streakFreezesAvailable: 2,
        frozenDatesJson: JSON.stringify(frozenDates),
        freezeRestorationDaysCount: 1,
        updatedAt: new Date(),
      },
    });

  console.log("==========================================");
  console.log("✓ SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`- User: ${demoEmail} / ${demoPassword}`);
  console.log(
    `- Tracker 1: 'Personal Reading' (Protestant canon, 12 Romans, 40 Genesis, 25 Psalms)`
  );
  console.log(
    `- Tracker 2: 'Gospels & Study' (Protestant canon, 16 Mark complete, 15 Luke)`
  );
  console.log(
    `- Plan 1: 'Romans: The Gospel of Grace' (${plan1CompletedReadings.length}/16 ch completed)`
  );
  console.log(
    `- Plan 2: 'The Four Gospels in 30 Days' (${plan2CompletedReadings.length}/89 ch completed)`
  );
  console.log(`- Total Logs: ${totalLogsCount} readings across 90 days`);
  console.log(`- Streak: 15 current, 36 best, 2 freezes available`);
  console.log(`- Freeze Days Used (3): ${frozenDates.join(", ")}`);
  console.log("==========================================");
}

// Execute directly if run as CLI script
if (
  process.argv[1]?.endsWith("seed-demo.ts") ||
  process.argv[1]?.includes("seed-demo")
) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
