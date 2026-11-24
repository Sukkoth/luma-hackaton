"use server";

import { headers } from "next/headers";
import { and, asc, eq } from "drizzle-orm";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bibleHighlights } from "@/db/schema";
import {
  CreateHighlightSchema,
  DeleteHighlightSchema,
  GetChapterHighlightsSchema,
  HIGHLIGHT_COLORS,
  UpdateHighlightColorSchema,
  type CreateHighlightInput,
  type DeleteHighlightInput,
  type GetChapterHighlightsInput,
  type HighlightColor,
  type UpdateHighlightColorInput,
} from "@/lib/schemas/highlights";

export type BibleHighlightDetail = {
  id: string;
  versionId: number;
  bookId: string;
  chapter: number;
  startVerse: number;
  startOffset: number;
  endVerse: number;
  endOffset: number;
  color: HighlightColor;
  selectedText: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeHighlightColor({ color }: { color: string }): HighlightColor {
  return HIGHLIGHT_COLORS.includes(color as HighlightColor)
    ? (color as HighlightColor)
    : "amber";
}

function mapHighlightRow({
  row,
}: {
  row: typeof bibleHighlights.$inferSelect;
}): BibleHighlightDetail {
  return {
    id: row.id,
    versionId: row.versionId,
    bookId: row.bookId,
    chapter: row.chapter,
    startVerse: row.startVerse,
    startOffset: row.startOffset,
    endVerse: row.endVerse,
    endOffset: row.endOffset,
    color: normalizeHighlightColor({ color: row.color }),
    selectedText: row.selectedText,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type GetChapterHighlightsResult =
  | { success: true; highlights: BibleHighlightDetail[] }
  | { success: false; error: string };

export async function getChapterHighlightsAction(
  params: GetChapterHighlightsInput
): Promise<GetChapterHighlightsResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(GetChapterHighlightsSchema, params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid highlight query",
    };
  }

  const { versionId, bookId, chapter } = parsed.output;
  const rows = await db
    .select()
    .from(bibleHighlights)
    .where(
      and(
        eq(bibleHighlights.userId, session.user.id),
        eq(bibleHighlights.versionId, versionId),
        eq(bibleHighlights.bookId, bookId),
        eq(bibleHighlights.chapter, chapter)
      )
    )
    .orderBy(
      asc(bibleHighlights.startVerse),
      asc(bibleHighlights.startOffset),
      asc(bibleHighlights.createdAt)
    );

  return {
    success: true,
    highlights: rows.map((row) => mapHighlightRow({ row })),
  };
}

export type CreateHighlightResult =
  | { success: true; highlight: BibleHighlightDetail }
  | { success: false; error: string };

export async function createHighlightAction(
  params: CreateHighlightInput
): Promise<CreateHighlightResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Please sign in to save highlights." };

  const parsed = v.safeParse(CreateHighlightSchema, params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid highlight range",
    };
  }

  const [created] = await db
    .insert(bibleHighlights)
    .values({
      userId: session.user.id,
      versionId: parsed.output.versionId,
      bookId: parsed.output.bookId,
      chapter: parsed.output.chapter,
      startVerse: parsed.output.startVerse,
      startOffset: parsed.output.startOffset,
      endVerse: parsed.output.endVerse,
      endOffset: parsed.output.endOffset,
      color: parsed.output.color,
      selectedText: parsed.output.selectedText,
    })
    .returning();

  if (!created) {
    return { success: false, error: "Failed to save highlight" };
  }

  return {
    success: true,
    highlight: mapHighlightRow({ row: created }),
  };
}

export type UpdateHighlightColorResult =
  | { success: true; highlight: BibleHighlightDetail }
  | { success: false; error: string };

export async function updateHighlightColorAction(
  params: UpdateHighlightColorInput
): Promise<UpdateHighlightColorResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(UpdateHighlightColorSchema, params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid highlight update",
    };
  }

  const [updated] = await db
    .update(bibleHighlights)
    .set({ color: parsed.output.color })
    .where(
      and(
        eq(bibleHighlights.id, parsed.output.highlightId),
        eq(bibleHighlights.userId, session.user.id)
      )
    )
    .returning();

  if (!updated) {
    return { success: false, error: "Highlight not found" };
  }

  return {
    success: true,
    highlight: mapHighlightRow({ row: updated }),
  };
}

export type DeleteHighlightResult =
  | { success: true; highlightId: string }
  | { success: false; error: string };

export async function deleteHighlightAction(
  params: DeleteHighlightInput
): Promise<DeleteHighlightResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(DeleteHighlightSchema, params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid highlight ID",
    };
  }

  const [deleted] = await db
    .delete(bibleHighlights)
    .where(
      and(
        eq(bibleHighlights.id, parsed.output.highlightId),
        eq(bibleHighlights.userId, session.user.id)
      )
    )
    .returning({ id: bibleHighlights.id });

  if (!deleted) {
    return { success: false, error: "Highlight not found" };
  }

  return { success: true, highlightId: deleted.id };
}
