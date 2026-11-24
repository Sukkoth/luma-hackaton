import {
  savePushSubscriptionAction,
  deletePushSubscriptionAction,
  sendTestPushNotificationAction,
} from "@/actions/push";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLfMuQPA3eCzZ9nUEVpsal9DJHqT0Bh85XjhnEUE3oOp0M8dGDMz60sspuhJVOCuui63zvk3ZcxfGiCtpKJ78iw";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionResult = {
  success: boolean;
  permission: NotificationPermission | "unsupported";
  error?: string;
};

export async function requestAndSubscribePush(): Promise<PushPermissionResult> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("Notification" in window) ||
    !("PushManager" in window)
  ) {
    return {
      success: false,
      permission: "unsupported",
      error: "Push notifications are not supported in this browser.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        permission,
        error: "Notification permission was not granted.",
      };
    }

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js");
    }
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as BufferSource,
        });
      } catch (subErr) {
        // If subscribe failed, attempt clearing any stale/incompatible subscription and retry once
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey as BufferSource,
          });
        } else {
          throw subErr;
        }
      }
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return {
        success: false,
        permission: "granted",
        error: "Failed to generate complete push subscription keys.",
      };
    }

    const res = await savePushSubscriptionAction({
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      userAgent: navigator.userAgent,
    });

    if (!res.success) {
      return {
        success: false,
        permission: "granted",
        error: res.error || "Failed to save push subscription on server.",
      };
    }

    return {
      success: true,
      permission: "granted",
    };
  } catch (err: unknown) {
    let message =
      err instanceof Error
        ? err.message
        : "Error subscribing to push notifications";

    if (
      message.toLowerCase().includes("push service error") ||
      message.toLowerCase().includes("registration failed")
    ) {
      message =
        "Push service unavailable in browser. If you use Brave, enable 'Use Google services for push messaging' in brave://settings/privacy, or disable shields for this site.";
    }

    return {
      success: false,
      permission: Notification.permission,
      error: message,
    };
  }
}

export async function unsubscribePush(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return { success: true };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await deletePushSubscriptionAction({ endpoint });
    }

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error unsubscribing from push";
    return { success: false, error: message };
  }
}

export async function sendTestNotification(): Promise<{
  success: boolean;
  error?: string;
}> {
  return sendTestPushNotificationAction();
}
