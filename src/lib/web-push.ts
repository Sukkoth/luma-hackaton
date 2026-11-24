import { setVapidDetails, sendNotification } from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLfMuQPA3eCzZ9nUEVpsal9DJHqT0Bh85XjhnEUE3oOp0M8dGDMz60sspuhJVOCuui63zvk3ZcxfGiCtpKJ78iw";

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "M8NMbCjypV1NzimWqvBwKdomAzjXycYrOK83Ll-YHak";

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:notifications@luma-scripture.app";

let isVapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (isVapidConfigured) return true;
  try {
    setVapidDetails(
      VAPID_SUBJECT,
      DEFAULT_VAPID_PUBLIC_KEY,
      DEFAULT_VAPID_PRIVATE_KEY
    );
    isVapidConfigured = true;
    return true;
  } catch (err: unknown) {
    console.error("[WebPush] Failed to set VAPID details:", err);
    return false;
  }
}

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  badge?: string;
  icon?: string;
  tag?: string;
};

export type SendWebPushParams = {
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  };
  payload: WebPushPayload;
};

export async function sendWebPushNotification({
  subscription,
  payload,
}: SendWebPushParams): Promise<{
  success: boolean;
  isExpired?: boolean;
  error?: string;
}> {
  if (!ensureVapidConfigured()) {
    return { success: false, error: "VAPID configuration failed" };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number; message?: string };
    const statusCode = errorObj.statusCode;
    // 404 or 410 means the subscription is no longer valid or unsubscribed by the user
    if (statusCode === 404 || statusCode === 410) {
      return {
        success: false,
        isExpired: true,
        error: "Subscription expired or unsubscribed",
      };
    }
    return {
      success: false,
      isExpired: false,
      error: errorObj.message || "Failed to deliver push notification",
    };
  }
}

export type SendPushToUserParams = {
  userId: string;
  payload: WebPushPayload;
};

export async function sendPushToUser({
  userId,
  payload,
}: SendPushToUserParams): Promise<{ sentCount: number; failedCount: number }> {
  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) {
    return { sentCount: 0, failedCount: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;
  const expiredEndpoints: string[] = [];

  for (const sub of subscriptions) {
    const res = await sendWebPushNotification({
      subscription: {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
      payload,
    });

    if (res.success) {
      sentCount++;
    } else {
      failedCount++;
      if (res.isExpired) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  // Purge dead subscriptions to prevent future redundant network calls
  if (expiredEndpoints.length > 0) {
    await db
      .delete(pushSubscriptions)
      .where(inArray(pushSubscriptions.endpoint, expiredEndpoints));
  }

  return { sentCount, failedCount };
}
