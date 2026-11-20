"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { user } from "@/db/schema";
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
} from "@/lib/schemas/profile";

export type UpdateProfileActionResult =
  | {
      success: true;
      name: string;
      image: string | null;
    }
  | { success: false; error: string };

export type UpdateProfileActionParams = {
  formData: FormData;
};

export async function updateProfileAction({
  formData,
}: UpdateProfileActionParams): Promise<UpdateProfileActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const raw = {
    name: formData.get("name"),
    image: formData.get("image") || "",
  };

  const parsed = v.safeParse(UpdateProfileSchema, raw);

  if (!parsed.success) {
    const errorMsg = parsed.issues[0]?.message ?? "Invalid profile data";
    return { success: false, error: errorMsg };
  }

  const { name, image } = parsed.output;
  const normalizedImage = image ? image.trim() : null;

  try {
    // 1. Update user record directly in the DB
    await db
      .update(user)
      .set({
        name,
        image: normalizedImage,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // 2. Sync with Better Auth session state
    try {
      await auth.api.updateUser({
        body: {
          name,
          image: normalizedImage ?? undefined,
        },
        headers: await headers(),
      });
    } catch {
      // Direct DB update succeeded, ignore non-critical auth engine sync failure
    }

    revalidatePath("/settings");
    revalidatePath("/", "layout");

    return {
      success: true,
      name,
      image: normalizedImage,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return { success: false, error: message };
  }
}

export type ChangePasswordActionResult =
  { success: true } | { success: false; error: string };

export type ChangePasswordActionParams = {
  formData: FormData;
};

export async function changePasswordAction({
  formData,
}: ChangePasswordActionParams): Promise<ChangePasswordActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = v.safeParse(ChangePasswordSchema, raw);

  if (!parsed.success) {
    const errorMsg = parsed.issues[0]?.message ?? "Invalid password data";
    return { success: false, error: errorMsg };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.output.currentPassword,
        newPassword: parsed.output.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to change password. Please verify your current password.";
    return { success: false, error: message };
  }
}
