"use server";

import { headers } from "next/headers";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { readingTrackers, userSettings } from "@/db/schema";
import { OnboardingTrackerSchema } from "@/lib/schemas/onboarding";

export type CompleteOnboardingResult =
  { success: true; trackerId: string } | { success: false; error: string };

type CompleteOnboardingParams = {
  formData: FormData;
};

export async function completeOnboardingAction({
  formData,
}: CompleteOnboardingParams): Promise<CompleteOnboardingResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(OnboardingTrackerSchema, {
    name: formData.get("name"),
    canon: formData.get("canon"),
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
      // 1. Insert initial reading tracker
      await tx.insert(readingTrackers).values({
        id: trackerId,
        userId: session.user.id,
        name: parsed.output.name,
        canon: parsed.output.canon,
        color: parsed.output.color,
        icon: parsed.output.icon,
        description: `Primary ${parsed.output.canon.replace("_", " ")} reading tracker`,
      });

      // 2. Upsert user settings to mark onboarding as completed with 3 initial streak freezes
      await tx
        .insert(userSettings)
        .values({
          userId: session.user.id,
          activeTrackerId: trackerId,
          hasCompletedOnboarding: true,
          streakFreezesAvailable: 3,
          currentStreak: 0,
          longestStreak: 0,
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            activeTrackerId: trackerId,
            hasCompletedOnboarding: true,
            streakFreezesAvailable: 0,
            updatedAt: new Date(),
          },
        });
    });

    return { success: true, trackerId };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to save tracker.";
    console.error("Failed to complete onboarding:", message);
    return {
      success: false,
      error: "Failed to initialize your tracker. Please try again.",
    };
  }
}
