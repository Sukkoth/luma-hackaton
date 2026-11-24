"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendPushToUser } from "@/lib/web-push";

export type SavePushSubscriptionParams = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export async function savePushSubscriptionAction({
  endpoint,
  p256dh,
  auth: authKey,
  userAgent,
}: SavePushSubscriptionParams): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!endpoint || !p256dh || !authKey) {
      return { success: false, error: "Invalid subscription parameters" };
    }

    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint,
        p256dh,
        auth: authKey,
        userAgent: userAgent || null,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: session.user.id,
          p256dh,
          auth: authKey,
          userAgent: userAgent || null,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save push subscription";
    return { success: false, error: message };
  }
}

export type DeletePushSubscriptionParams = {
  endpoint: string;
};

export async function deletePushSubscriptionAction({
  endpoint,
}: DeletePushSubscriptionParams): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to remove push subscription";
    return { success: false, error: message };
  }
}

export async function sendTestPushNotificationAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { sentCount } = await sendPushToUser({
      userId: session.user.id,
      payload: {
        title: "Luma Scripture Reminder",
        body: "Test notification: Your scripture reading reminders are working perfectly!",
        url: "/home",
      },
    });

    if (sentCount === 0) {
      return {
        success: false,
        error:
          "No active browser push subscription found. Please enable system alerts first.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to send test push notification";
    return { success: false, error: message };
  }
}
