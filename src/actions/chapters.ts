"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  readingTrackers,
  trackerChapterProgress,
  readingLogs,
} from "@/db/schema";
import {
  ToggleChapterSchema,
  MarkAllChaptersSchema,
  ClearAllChaptersSchema,
} from "@/lib/schemas/chapters";
import { syncUserStreak } from "@/lib/streak-service";

export type ToggleChapterResult =
  | { success: true; status: "completed" | "removed"; chapter: number }
  | { success: false; error: string };

export type ToggleChapterActionParams = {
  trackerId: string;
  bookId: string;
  bookName: string;
  chapter: number;
};

export async function toggleChapterAction({
  trackerId,
  bookId,
  bookName,
  chapter,
}: ToggleChapterActionParams): Promise<ToggleChapterResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(ToggleChapterSchema, {
    trackerId,
    bookId,
    bookName,
    chapter,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid chapter parameters.",
    };
  }

  try {
    // Verify tracker ownership
    const tracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, parsed.output.trackerId),
        eq(readingTrackers.userId, session.user.id)
      ),
    });

    if (!tracker) {
      return { success: false, error: "Tracker not found or unauthorized." };
    }

    // Check if chapter is currently completed
    const existing = await db.query.trackerChapterProgress.findFirst({
      where: and(
        eq(trackerChapterProgress.trackerId, parsed.output.trackerId),
        eq(trackerChapterProgress.bookId, parsed.output.bookId),
        eq(trackerChapterProgress.chapter, parsed.output.chapter)
      ),
    });

    if (existing) {
      // Toggle off: remove chapter progress
      await db
        .delete(trackerChapterProgress)
        .where(eq(trackerChapterProgress.id, existing.id));

      revalidatePath("/books");
      revalidatePath("/home");
      revalidatePath("/insights");

      return {
        success: true,
        status: "removed",
        chapter: parsed.output.chapter,
      };
    }

    // Toggle on: atomically record chapter progress and append reading log in parallel
    const now = new Date();
    await db.transaction(async (tx) => {
      await Promise.all([
        tx.insert(trackerChapterProgress).values({
          id: crypto.randomUUID(),
          trackerId: parsed.output.trackerId,
          bookId: parsed.output.bookId,
          chapter: parsed.output.chapter,
          completedAt: now,
        }),
        tx.insert(readingLogs).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          trackerId: parsed.output.trackerId,
          bookId: parsed.output.bookId,
          bookName: parsed.output.bookName,
          chapter: parsed.output.chapter,
          loggedAt: now,
        }),
      ]);
    });

    await syncUserStreak({ userId: session.user.id });

    revalidatePath("/books");
    revalidatePath("/home");
    revalidatePath("/insights");

    return {
      success: true,
      status: "completed",
      chapter: parsed.output.chapter,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while toggling chapter.",
    };
  }
}

export type MarkAllChaptersResult =
  { success: true; addedCount: number } | { success: false; error: string };

export type MarkAllChaptersActionParams = {
  trackerId: string;
  bookId: string;
  bookName: string;
  totalChapters: number;
};

export async function markAllChaptersAction({
  trackerId,
  bookId,
  bookName,
  totalChapters,
}: MarkAllChaptersActionParams): Promise<MarkAllChaptersResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(MarkAllChaptersSchema, {
    trackerId,
    bookId,
    bookName,
    totalChapters,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid parameters.",
    };
  }

  try {
    const tracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, parsed.output.trackerId),
        eq(readingTrackers.userId, session.user.id)
      ),
    });

    if (!tracker) {
      return { success: false, error: "Tracker not found or unauthorized." };
    }

    // Build all chapter items for this book
    const now = new Date();
    const allChapters = Array.from(
      { length: parsed.output.totalChapters },
      (_, i) => i + 1
    );

    let newlyInsertedCount = 0;

    await db.transaction(async (tx) => {
      // 1. Single multi-row insert; PostgreSQL skips existing chapters via unique index
      const inserted = await tx
        .insert(trackerChapterProgress)
        .values(
          allChapters.map((ch) => ({
            id: crypto.randomUUID(),
            trackerId: parsed.output.trackerId,
            bookId: parsed.output.bookId,
            chapter: ch,
            completedAt: now,
          }))
        )
        .onConflictDoNothing()
        .returning({
          chapter: trackerChapterProgress.chapter,
        });

      newlyInsertedCount = inserted.length;

      // 2. Only record reading logs for chapters that were newly completed
      if (inserted.length > 0) {
        await tx.insert(readingLogs).values(
          inserted.map((row) => ({
            id: crypto.randomUUID(),
            userId: session.user.id,
            trackerId: parsed.output.trackerId,
            bookId: parsed.output.bookId,
            bookName: parsed.output.bookName,
            chapter: row.chapter,
            loggedAt: now,
          }))
        );
      }
    });

    if (newlyInsertedCount > 0) {
      await syncUserStreak({ userId: session.user.id });
      revalidatePath("/books");
      revalidatePath("/home");
      revalidatePath("/insights");
    }

    return { success: true, addedCount: newlyInsertedCount };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark all chapters as completed.",
    };
  }
}

export type ClearAllChaptersResult =
  { success: true } | { success: false; error: string };

export type ClearAllChaptersActionParams = {
  trackerId: string;
  bookId: string;
};

export async function clearAllChaptersAction({
  trackerId,
  bookId,
}: ClearAllChaptersActionParams): Promise<ClearAllChaptersResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const parsed = v.safeParse(ClearAllChaptersSchema, {
    trackerId,
    bookId,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid parameters.",
    };
  }

  try {
    const tracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, parsed.output.trackerId),
        eq(readingTrackers.userId, session.user.id)
      ),
    });

    if (!tracker) {
      return { success: false, error: "Tracker not found or unauthorized." };
    }

    await db
      .delete(trackerChapterProgress)
      .where(
        and(
          eq(trackerChapterProgress.trackerId, parsed.output.trackerId),
          eq(trackerChapterProgress.bookId, parsed.output.bookId)
        )
      );

    revalidatePath("/books");
    revalidatePath("/home");
    revalidatePath("/insights");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reset chapters for this book.",
    };
  }
}
