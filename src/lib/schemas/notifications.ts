import * as v from "valibot";

export const NotificationTypeSchema = v.picklist([
  "streak_alert",
  "freeze_used",
  "plan_reminder",
  "group_activity",
  "achievement",
  "system",
]);

export type NotificationType = v.InferOutput<typeof NotificationTypeSchema>;

export const CreateNotificationSchema = v.object({
  type: NotificationTypeSchema,
  title: v.pipe(v.string(), v.minLength(1, "Title is required")),
  body: v.pipe(v.string(), v.minLength(1, "Body is required")),
  actionUrl: v.optional(v.string()),
});

export type CreateNotificationInput = v.InferInput<
  typeof CreateNotificationSchema
>;
export type CreateNotificationOutput = v.InferOutput<
  typeof CreateNotificationSchema
>;

export const GetNotificationsQuerySchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100))),
  unreadOnly: v.optional(v.boolean()),
});

export type GetNotificationsQueryInput = v.InferInput<
  typeof GetNotificationsQuerySchema
>;

export const NotificationIdSchema = v.object({
  notificationId: v.pipe(
    v.string(),
    v.minLength(1, "Notification ID is required")
  ),
});

export type NotificationIdInput = v.InferInput<typeof NotificationIdSchema>;
