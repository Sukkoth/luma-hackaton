"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { userSettings } from "@/db/schema";
import {
  UpdateUserSettingsSchema,
  type UpdateUserSettingsInput,
} from "@/lib/schemas/settings";

export type UpdateUserSettingsActionResult =
  { success: true } | { success: false; error: string };

export type UpdateUserSettingsActionParams = {
  settings: UpdateUserSettingsInput;
};

export async function updateUserSettingsAction({
  settings,
}: UpdateUserSettingsActionParams): Promise<UpdateUserSettingsActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(UpdateUserSettingsSchema, settings);

  if (!parsed.success) {
    const errorMsg =
      parsed.issues[0]?.message ?? "Invalid settings configuration.";
    return { success: false, error: errorMsg };
  }

  const { dailyReminderEnabled, dailyReminderTime } = parsed.output;

  try {
    const updates: Partial<typeof userSettings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dailyReminderEnabled !== undefined) {
      updates.dailyReminderEnabled = dailyReminderEnabled;
    }
    if (dailyReminderTime !== undefined) {
      updates.dailyReminderTime = dailyReminderTime;
    }

    await db
      .insert(userSettings)
      .values({
        userId: session.user.id,
        ...updates,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: updates,
      });

    revalidatePath("/settings");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update settings.";
    return { success: false, error: message };
  }
}
