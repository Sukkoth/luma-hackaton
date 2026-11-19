"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { UserDataExport } from "@/lib/schemas/data-export";
import { normalizeBackupToLatest } from "@/lib/data-export-migrations";
import {
  exportUserData,
  importUserData,
  type ImportCounts,
} from "@/lib/data-export-service";

export type ExportUserDataActionResult =
  | { success: true; data: UserDataExport }
  | { success: false; error: string };

export async function exportUserDataAction(): Promise<ExportUserDataActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  try {
    const data = await exportUserData({ userId: session.user.id });
    return { success: true, data };
  } catch (err: unknown) {
    const error =
      err instanceof Error ? err.message : "Failed to export user data.";
    return { success: false, error };
  }
}

export type ImportUserDataActionParams = {
  jsonString: string;
};

export type ImportUserDataActionResult =
  | { success: true; counts: ImportCounts }
  | { success: false; error: string };

export async function importUserDataAction({
  jsonString,
}: ImportUserDataActionParams): Promise<ImportUserDataActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(jsonString);
  } catch {
    return { success: false, error: "Invalid JSON format in uploaded file." };
  }

  let normalizedData: UserDataExport;
  try {
    normalizedData = normalizeBackupToLatest({ raw: parsedRaw });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Backup file does not match expected Scripture Tracker schema.";
    return { success: false, error: message };
  }

  try {
    const counts = await importUserData({
      userId: session.user.id,
      data: normalizedData,
    });

    revalidatePath("/settings");
    revalidatePath("/home");
    revalidatePath("/insights");
    revalidatePath("/plans");
    revalidatePath("/notes");
    revalidatePath("/bible");

    return { success: true, counts };
  } catch (err: unknown) {
    const error =
      err instanceof Error ? err.message : "Failed to import and merge backup.";
    return { success: false, error };
  }
}
