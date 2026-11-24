import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  userSettings,
  planInstances,
  notifications,
  readingLogs,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getLocalDateString } from "@/lib/timezone";
import { snapToNearestThirtyMinutes } from "@/lib/time-format";
import { sendPushToUser } from "@/lib/web-push";

function getLocalHourMinute({
  date,
  timeZone,
}: {
  date: Date;
  timeZone: string;
}): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(date);
  } catch {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return formatter.format(date);
  }
}

export async function GET(request: Request) {
  return handleCronReminders(request);
}

export async function POST(request: Request) {
  return handleCronReminders(request);
}

async function handleCronReminders(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");
  const queryKey =
    url.searchParams.get("key") ||
    url.searchParams.get("apiKey") ||
    url.searchParams.get("secret");

  const expectedKey = process.env.CRON_API_KEY || process.env.CRON_SECRET;

  if (expectedKey) {
    const isAuthorized =
      authHeader === `Bearer ${expectedKey}` ||
      apiKeyHeader === expectedKey ||
      queryKey === expectedKey;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized. Provide valid cron API key." },
        { status: 401 }
      );
    }
  }

  const now = new Date();
  let dailyRemindersSent = 0;
  let planRemindersSent = 0;
  const processedUsersCount = { total: 0 };

  try {
    // 1. Process Daily General Reading Reminders
    const allSettings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.dailyReminderEnabled, true));

    processedUsersCount.total = allSettings.length;

    for (const setting of allSettings) {
      const userTz = setting.timezone || "UTC";
      const localTime = getLocalHourMinute({ date: now, timeZone: userTz });
      const currentSlot = snapToNearestThirtyMinutes({ timeString: localTime });
      const targetSlot = snapToNearestThirtyMinutes({
        timeString: setting.dailyReminderTime || "20:00",
      });

      // Check if current 30-minute interval matches the user's selected time
      if (currentSlot !== targetSlot) {
        continue;
      }

      const todayStr = getLocalDateString({ date: now, timeZone: userTz });

      // Edge case 1: If user has already read today, do not disturb them
      if (setting.lastReadDate === todayStr) {
        continue;
      }

      // Edge case 2: Deduplication - do not send multiple daily reminders on the same calendar day
      const existingNotif = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, setting.userId),
            eq(notifications.type, "plan_reminder"),
            sql`DATE(${notifications.createdAt} AT TIME ZONE ${userTz}) = ${todayStr}::date`
          )
        )
        .limit(1);

      if (existingNotif.length > 0) {
        continue;
      }

      // Send Web Push notification
      await sendPushToUser({
        userId: setting.userId,
        payload: {
          title: "Luma Scripture Reminder",
          body: "Time for your daily scripture reading! Continue your spiritual habit today.",
          url: "/home",
          tag: `daily-reminder-${todayStr}`,
        },
      });

      // Insert In-App Notification record
      await db.insert(notifications).values({
        userId: setting.userId,
        type: "plan_reminder",
        title: "Daily Scripture Reminder",
        body: "Time for your daily devotional reflection. Maintain your spiritual momentum!",
        actionUrl: "/home",
      });

      dailyRemindersSent++;
    }

    // 2. Process Plan-Specific Reminders
    const activePlansWithReminders = await db
      .select()
      .from(planInstances)
      .where(
        and(
          eq(planInstances.status, "active"),
          eq(planInstances.reminderEnabled, true)
        )
      );

    for (const plan of activePlansWithReminders) {
      if (!plan.reminderTime) continue;

      const userSetting = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, plan.userId),
      });
      const userTz = userSetting?.timezone || "UTC";
      const localTime = getLocalHourMinute({ date: now, timeZone: userTz });
      const currentSlot = snapToNearestThirtyMinutes({ timeString: localTime });
      const targetSlot = snapToNearestThirtyMinutes({
        timeString: plan.reminderTime,
      });

      if (currentSlot !== targetSlot) {
        continue;
      }

      const todayStr = getLocalDateString({ date: now, timeZone: userTz });
      const localDayOfWeek = new Date(`${todayStr}T12:00:00Z`).getUTCDay();
      const activeMask = plan.activeDaysMask || "1111111";

      // Edge case 1: Skip if today is not an active reading day for this plan
      if (activeMask[localDayOfWeek] !== "1") {
        continue;
      }

      // Edge case 2: Check if user already logged reading for this plan today
      const logsToday = await db
        .select({ id: readingLogs.id })
        .from(readingLogs)
        .where(
          and(
            eq(readingLogs.planInstanceId, plan.id),
            sql`DATE(${readingLogs.loggedAt} AT TIME ZONE ${userTz}) = ${todayStr}::date`
          )
        )
        .limit(1);

      if (logsToday.length > 0) {
        continue;
      }

      // Deduplication per plan per day
      const existingPlanNotif = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, plan.userId),
            eq(notifications.actionUrl, `/plans/${plan.id}`),
            sql`DATE(${notifications.createdAt} AT TIME ZONE ${userTz}) = ${todayStr}::date`
          )
        )
        .limit(1);

      if (existingPlanNotif.length > 0) {
        continue;
      }

      await sendPushToUser({
        userId: plan.userId,
        payload: {
          title: `${plan.title} Reminder`,
          body: `Today's readings are ready in ${plan.title}. Keep your cadence going!`,
          url: `/plans/${plan.id}`,
          tag: `plan-reminder-${plan.id}-${todayStr}`,
        },
      });

      await db.insert(notifications).values({
        userId: plan.userId,
        type: "plan_reminder",
        title: `${plan.title} Scheduled Reading`,
        body: `You have chapters scheduled for today in ${plan.title}. Tap to resume reading.`,
        actionUrl: `/plans/${plan.id}`,
      });

      planRemindersSent++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      dailyRemindersSent,
      planRemindersSent,
      processedUsersCount: processedUsersCount.total,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to execute cron reminders";
    console.error("[Cron Reminders] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
