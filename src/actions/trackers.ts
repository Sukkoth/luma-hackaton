"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { readingTrackers, userSettings } from "@/db/schema";
import {
  CreateTrackerSchema,
  UpdateTrackerSchema,
  SwitchTrackerSchema,
} from "@/lib/schemas/trackers";

export type UserTrackerSummary = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  canon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTrackerActionResult =
  { success: true; trackerId: string } | { success: false; error: string };

export type CreateTrackerActionParams = {
  formData: FormData;
};

export async function createTrackerAction({
  formData,
}: CreateTrackerActionParams): Promise<CreateTrackerActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(CreateTrackerSchema, {
    name: formData.get("name"),
    canon: formData.get("canon"),
    description: formData.get("description") ?? "",
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid tracker configuration.",
    };
  }

  try {
    const trackerId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // 1. Insert new tracker
      await tx.insert(readingTrackers).values({
        id: trackerId,
        userId: session.user.id,
        name: parsed.output.name,
        canon: parsed.output.canon,
        color: parsed.output.color,
        icon: parsed.output.icon,
        description: parsed.output.description ?? "",
      });

      // 2. Set newly created tracker as the user's active tracker
      await tx
        .update(userSettings)
        .set({
          activeTrackerId: trackerId,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, session.user.id));
    });

    revalidatePath("/home");
    revalidatePath("/books");
    revalidatePath("/insights");
    revalidatePath("/notes");
    revalidatePath("/plans");
    revalidatePath("/settings");

    return { success: true, trackerId };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create tracker.";
    console.error("Failed to create tracker:", message);
    return {
      success: false,
      error: "Failed to create tracker. Please try again.",
    };
  }
}

export type UpdateTrackerActionResult =
  { success: true; trackerId: string } | { success: false; error: string };

export type UpdateTrackerActionParams = {
  formData: FormData;
};

export async function updateTrackerAction({
  formData,
}: UpdateTrackerActionParams): Promise<UpdateTrackerActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(UpdateTrackerSchema, {
    trackerId: formData.get("trackerId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    color: formData.get("color"),
    icon: formData.get("icon"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid tracker details.",
    };
  }

  try {
    const existing = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, parsed.output.trackerId),
        eq(readingTrackers.userId, session.user.id)
      ),
    });

    if (!existing) {
      return { success: false, error: "Tracker not found or unauthorized." };
    }

    // Invariant: Canon cannot be updated. Only update name, description, color, and icon.
    await db
      .update(readingTrackers)
      .set({
        name: parsed.output.name,
        description: parsed.output.description ?? "",
        color: parsed.output.color,
        icon: parsed.output.icon,
        updatedAt: new Date(),
      })
      .where(eq(readingTrackers.id, existing.id));

    revalidatePath("/home");
    revalidatePath("/books");
    revalidatePath("/insights");
    revalidatePath("/notes");
    revalidatePath("/plans");
    revalidatePath("/settings");

    return { success: true, trackerId: existing.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to update tracker.";
    console.error("Failed to update tracker:", message);
    return {
      success: false,
      error: "Failed to update tracker. Please try again.",
    };
  }
}

export type SwitchTrackerActionResult =
  { success: true; trackerId: string } | { success: false; error: string };

export type SwitchTrackerActionParams = {
  trackerId: string;
};

export async function switchTrackerAction({
  trackerId,
}: SwitchTrackerActionParams): Promise<SwitchTrackerActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(SwitchTrackerSchema, { trackerId });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid tracker ID.",
    };
  }

  try {
    const tracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, parsed.output.trackerId),
        eq(readingTrackers.userId, session.user.id),
        eq(readingTrackers.isArchived, false)
      ),
    });

    if (!tracker) {
      return { success: false, error: "Tracker not found or unauthorized." };
    }

    await db
      .update(userSettings)
      .set({
        activeTrackerId: tracker.id,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, session.user.id));

    revalidatePath("/home");
    revalidatePath("/books");
    revalidatePath("/insights");
    revalidatePath("/notes");
    revalidatePath("/plans");
    revalidatePath("/settings");

    return { success: true, trackerId: tracker.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to switch tracker.";
    console.error("Failed to switch tracker:", message);
    return {
      success: false,
      error: "Failed to switch tracker. Please try again.",
    };
  }
}

export type GetUserTrackersDataParams = {
  userId: string;
};

export async function getUserTrackersData({
  userId,
}: GetUserTrackersDataParams): Promise<{
  trackers: UserTrackerSummary[];
  activeTracker: UserTrackerSummary | null;
}> {
  const [trackers, settings] = await Promise.all([
    db.query.readingTrackers.findMany({
      where: and(
        eq(readingTrackers.userId, userId),
        eq(readingTrackers.isArchived, false)
      ),
      orderBy: (readingTrackers, { asc }) => [asc(readingTrackers.createdAt)],
    }),
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    }),
  ]);

  const activeTracker =
    trackers.find((t) => t.id === settings?.activeTrackerId) ??
    trackers[0] ??
    null;

  return {
    trackers,
    activeTracker,
  };
}
