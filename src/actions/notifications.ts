"use server";

import { headers } from "next/headers";
import { and, desc, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { notifications } from "@/db/schema";
import {
  CreateNotificationSchema,
  NotificationIdSchema,
  type CreateNotificationInput,
  type NotificationType,
} from "@/lib/schemas/notifications";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type GetUserNotificationsActionParams = {
  limit?: number;
  unreadOnly?: boolean;
};

export type GetUserNotificationsActionResult =
  | { success: true; notifications: NotificationItem[]; unreadCount: number }
  | { success: false; error: string };

export async function getUserNotificationsAction({
  limit = 20,
  unreadOnly = false,
}: GetUserNotificationsActionParams = {}): Promise<GetUserNotificationsActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  try {
    const conditions = [eq(notifications.userId, session.user.id)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const items = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Get unread count
    const [unreadRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      );

    return {
      success: true,
      notifications: items as NotificationItem[],
      unreadCount: unreadRes?.count ?? 0,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch notifications.";
    return { success: false, error: msg };
  }
}

export type GetUnreadCountActionResult =
  | { success: true; count: number }
  | { success: false; error: string };

export async function getUnreadNotificationCountAction(): Promise<GetUnreadCountActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: true, count: 0 };
  }

  try {
    const [unreadRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { success: true, count: unreadRes?.count ?? 0 };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to fetch unread count.";
    return { success: false, error: msg };
  }
}

export type MarkNotificationAsReadActionParams = {
  notificationId: string;
};

export type MarkNotificationAsReadActionResult =
  | { success: true }
  | { success: false; error: string };

export async function markNotificationAsReadAction({
  notificationId,
}: MarkNotificationAsReadActionParams): Promise<MarkNotificationAsReadActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(NotificationIdSchema, { notificationId });
  if (!parsed.success) {
    return { success: false, error: "Invalid notification ID." };
  }

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as read.";
    return { success: false, error: msg };
  }
}

export type MarkAllNotificationsAsReadActionResult =
  | { success: true }
  | { success: false; error: string };

export async function markAllNotificationsAsReadAction(): Promise<MarkAllNotificationsAsReadActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to mark all notifications as read.";
    return { success: false, error: msg };
  }
}

export type DeleteNotificationActionParams = {
  notificationId: string;
};

export type DeleteNotificationActionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteNotificationAction({
  notificationId,
}: DeleteNotificationActionParams): Promise<DeleteNotificationActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(NotificationIdSchema, { notificationId });
  if (!parsed.success) {
    return { success: false, error: "Invalid notification ID." };
  }

  try {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to delete notification.";
    return { success: false, error: msg };
  }
}

export type CreateNotificationActionParams = {
  userId?: string;
  input: CreateNotificationInput;
};

export type CreateNotificationActionResult =
  | { success: true; notification: NotificationItem }
  | { success: false; error: string };

export async function createNotificationAction({
  userId,
  input,
}: CreateNotificationActionParams): Promise<CreateNotificationActionResult> {
  let targetUserId = userId;

  if (!targetUserId) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }
    targetUserId = session.user.id;
  }

  const parsed = v.safeParse(CreateNotificationSchema, input);
  if (!parsed.success) {
    const errorMsg = parsed.issues[0]?.message ?? "Invalid notification data.";
    return { success: false, error: errorMsg };
  }

  try {
    const [inserted] = await db
      .insert(notifications)
      .values({
        userId: targetUserId,
        type: parsed.output.type,
        title: parsed.output.title,
        body: parsed.output.body,
        actionUrl: parsed.output.actionUrl ?? null,
        isRead: false,
      })
      .returning();

    if (!inserted) {
      return { success: false, error: "Failed to insert notification." };
    }

    return {
      success: true,
      notification: inserted as NotificationItem,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to create notification.";
    return { success: false, error: msg };
  }
}
