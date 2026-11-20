"use server";

import { headers } from "next/headers";
import { and, desc, eq, ne, lt, sql } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { notifications, groupActivities, groupMembers } from "@/db/schema";
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
    const personalConditions = [eq(notifications.userId, session.user.id)];
    if (unreadOnly) {
      personalConditions.push(eq(notifications.isRead, false));
    }

    const groupConditions = [
      eq(groupMembers.userId, session.user.id),
      eq(groupMembers.status, "active"),
      ne(groupActivities.actorId, session.user.id),
    ];
    if (unreadOnly) {
      groupConditions.push(
        sql`${groupActivities.createdAt} > ${groupMembers.lastViewedAt}`
      );
    }

    // Parallel fetch using Promise.all for personal notifications, group notice board activities, and unread counts
    const [personalItems, groupItems, [unreadPersonalRes], [unreadGroupRes]] =
      await Promise.all([
        db
          .select()
          .from(notifications)
          .where(and(...personalConditions))
          .orderBy(desc(notifications.createdAt))
          .limit(limit),
        db
          .select({
            id: groupActivities.id,
            type: groupActivities.type,
            title: groupActivities.title,
            body: groupActivities.body,
            actionUrl: groupActivities.actionUrl,
            createdAt: groupActivities.createdAt,
            lastViewedAt: groupMembers.lastViewedAt,
          })
          .from(groupActivities)
          .innerJoin(
            groupMembers,
            eq(groupActivities.groupId, groupMembers.groupId)
          )
          .where(and(...groupConditions))
          .orderBy(desc(groupActivities.createdAt))
          .limit(limit),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, session.user.id),
              eq(notifications.isRead, false)
            )
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(groupActivities)
          .innerJoin(
            groupMembers,
            eq(groupActivities.groupId, groupMembers.groupId)
          )
          .where(
            and(
              eq(groupMembers.userId, session.user.id),
              eq(groupMembers.status, "active"),
              ne(groupActivities.actorId, session.user.id),
              sql`${groupActivities.createdAt} > ${groupMembers.lastViewedAt}`
            )
          ),
      ]);

    const mappedGroupItems: NotificationItem[] = groupItems.map((item) => ({
      id: item.id,
      userId: session.user.id,
      type: "group_activity",
      title: item.title,
      body: item.body,
      actionUrl: item.actionUrl,
      isRead: item.createdAt <= item.lastViewedAt,
      createdAt: item.createdAt,
    }));

    const combinedNotifications = [...personalItems, ...mappedGroupItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    const totalUnreadCount =
      (unreadPersonalRes?.count ?? 0) + (unreadGroupRes?.count ?? 0);

    return {
      success: true,
      notifications: combinedNotifications as NotificationItem[],
      unreadCount: totalUnreadCount,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch notifications.";
    return { success: false, error: msg };
  }
}

export type GetUnreadCountActionResult =
  { success: true; count: number } | { success: false; error: string };

export async function getUnreadNotificationCountAction(): Promise<GetUnreadCountActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: true, count: 0 };
  }

  try {
    const [[personalRes], [groupRes]] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(groupActivities)
        .innerJoin(
          groupMembers,
          eq(groupActivities.groupId, groupMembers.groupId)
        )
        .where(
          and(
            eq(groupMembers.userId, session.user.id),
            eq(groupMembers.status, "active"),
            ne(groupActivities.actorId, session.user.id),
            sql`${groupActivities.createdAt} > ${groupMembers.lastViewedAt}`
          )
        ),
    ]);

    const totalCount = (personalRes?.count ?? 0) + (groupRes?.count ?? 0);
    return { success: true, count: totalCount };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch unread count.";
    return { success: false, error: msg };
  }
}

export type MarkNotificationAsReadActionParams = {
  notificationId: string;
};

export type MarkNotificationAsReadActionResult =
  { success: true } | { success: false; error: string };

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
    const [updatedPersonal] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      )
      .returning({ id: notifications.id });

    // If not in personal notifications, check group notice board
    if (!updatedPersonal) {
      const activity = await db.query.groupActivities.findFirst({
        where: eq(groupActivities.id, notificationId),
        columns: { groupId: true },
      });

      if (activity) {
        await db
          .update(groupMembers)
          .set({ lastViewedAt: new Date() })
          .where(
            and(
              eq(groupMembers.groupId, activity.groupId),
              eq(groupMembers.userId, session.user.id)
            )
          );
      }
    }

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
  { success: true } | { success: false; error: string };

export async function markAllNotificationsAsReadAction(): Promise<MarkAllNotificationsAsReadActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  try {
    await Promise.all([
      db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        ),
      db
        .update(groupMembers)
        .set({ lastViewedAt: new Date() })
        .where(eq(groupMembers.userId, session.user.id)),
    ]);

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
  { success: true } | { success: false; error: string };

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
    const [deletedPersonal] = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.user.id)
        )
      )
      .returning({ id: notifications.id });

    if (!deletedPersonal) {
      const activity = await db.query.groupActivities.findFirst({
        where: eq(groupActivities.id, notificationId),
        columns: { groupId: true },
      });

      if (activity) {
        await db
          .update(groupMembers)
          .set({ lastViewedAt: new Date() })
          .where(
            and(
              eq(groupMembers.groupId, activity.groupId),
              eq(groupMembers.userId, session.user.id)
            )
          );
      }
    }

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

export type PurgeOldNotificationsActionResult =
  | { success: true; deletedPersonal: number; deletedActivities: number }
  | { success: false; error: string };

export async function purgeOldNotificationsAction(): Promise<PurgeOldNotificationsActionResult> {
  try {
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [deletedPersonal, deletedActivities] = await Promise.all([
      db
        .delete(notifications)
        .where(
          and(
            eq(notifications.isRead, true),
            lt(notifications.createdAt, fortyFiveDaysAgo)
          )
        )
        .returning({ id: notifications.id }),
      db
        .delete(groupActivities)
        .where(lt(groupActivities.createdAt, sixtyDaysAgo))
        .returning({ id: groupActivities.id }),
    ]);

    return {
      success: true,
      deletedPersonal: deletedPersonal.length,
      deletedActivities: deletedActivities.length,
    };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to purge old notifications.";
    return { success: false, error: msg };
  }
}
