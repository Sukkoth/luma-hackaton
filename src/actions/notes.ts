"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, asc, desc, sql, ilike, or, count } from "drizzle-orm";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes, noteFolders, planInstances } from "@/db/schema";
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  DeleteNoteSchema,
  CreateFolderSchema,
  DeleteFolderSchema,
  GetChapterNotesSchema,
  GetPaginatedNotesSchema,
  type CreateNoteInput,
  type UpdateNoteInput,
  type DeleteNoteInput,
  type CreateFolderInput,
  type DeleteFolderInput,
  type GetChapterNotesInput,
  type GetPaginatedNotesInput,
} from "@/lib/schemas/notes";
import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";
import { getReadingPlanById } from "@/data/readingPlans";
import {
  getUserNotesForUser,
  getSingleNoteForUser,
} from "@/lib/notes/queries";

export type NoteDetail = {
  id: string;
  userId: string;
  trackerId: string | null;
  folderId: string | null;
  folderName: string | null;
  planInstanceId: string | null;
  planTitle: string | null;
  planSessionId: number | null;
  planDayNumber: number | null;
  versionId: number | null;
  bookId: string | null;
  chapter: number | null;
  startVerse: number | null;
  startOffset: number | null;
  endVerse: number | null;
  endOffset: number | null;
  selectedText: string | null;
  title: string;
  bodyHtml: string;
  plainTextSnippet: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteFolderDetail = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isPinned: boolean;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GetUserNotesParams = {
  folderId?: string;
  planInstanceId?: string;
  searchQuery?: string;
  includeArchived?: boolean;
};

export type GetUserNotesResult =
  | {
      success: true;
      notes: NoteDetail[];
      folders: NoteFolderDetail[];
    }
  | { success: false; error: string };

export async function getUserNotesAction({
  folderId,
  planInstanceId,
  searchQuery,
  includeArchived,
}: GetUserNotesParams = {}): Promise<GetUserNotesResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const result = await getUserNotesForUser({
    userId: session.user.id,
    folderId,
    planInstanceId,
    searchQuery,
    includeArchived,
  });

  return {
    success: true,
    notes: result.notes,
    folders: result.folders,
  };
}

export type GetSingleNoteParams = { noteId: string };
export type GetSingleNoteResult =
  { success: true; note: NoteDetail } | { success: false; error: string };

export async function getSingleNoteAction({
  noteId,
}: GetSingleNoteParams): Promise<GetSingleNoteResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const note = await getSingleNoteForUser({
    userId: session.user.id,
    noteId,
  });

  if (!note) {
    return { success: false, error: "Note not found" };
  }

  return {
    success: true,
    note,
  };
}

export type CreateNoteParams = CreateNoteInput;

export type CreateNoteResult =
  { success: true; note: NoteDetail } | { success: false; error: string };

export async function createNoteAction({
  title,
  bodyHtml = "",
  plainTextSnippet = "",
  folderId,
  trackerId,
  planInstanceId,
  planDayNumber,
  planSessionId,
  versionId,
  bookId,
  chapter,
  startVerse,
  startOffset,
  endVerse,
  endOffset,
  selectedText,
}: CreateNoteParams): Promise<CreateNoteResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(CreateNoteSchema, {
    title,
    bodyHtml,
    plainTextSnippet,
    folderId,
    trackerId,
    planInstanceId,
    planDayNumber,
    planSessionId,
    versionId,
    bookId,
    chapter,
    startVerse,
    startOffset,
    endVerse,
    endOffset,
    selectedText,
  });

  if (!parsed.success) {
    const errorMsg = parsed.issues[0]?.message || "Invalid input";
    return { success: false, error: errorMsg };
  }

  const snippet =
    plainTextSnippet.trim() ||
    bodyHtml
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150);

  let resolvedFolderId = parsed.output.folderId || null;
  if (parsed.output.planInstanceId) {
    const inst = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, parsed.output.planInstanceId),
    });
    if (inst) {
      const nowMidnight = new Date();
      nowMidnight.setHours(0, 0, 0, 0);
      const planStart = new Date(inst.startDate);
      planStart.setHours(0, 0, 0, 0);
      if (
        inst.mode === "scheduled" &&
        planStart.getTime() > nowMidnight.getTime()
      ) {
        return {
          success: false,
          error: "Notes are locked until the cohort plan start date.",
        };
      }

      if (!resolvedFolderId) {
        const folder = await db.query.noteFolders.findFirst({
          where: and(
            eq(noteFolders.userId, session.user.id),
            eq(noteFolders.name, inst.title)
          ),
        });
        if (folder) {
          resolvedFolderId = folder.id;
        }
      }
    }
  }

  const [inserted] = await db
    .insert(notes)
    .values({
      userId: session.user.id,
      title: parsed.output.title,
      bodyHtml: parsed.output.bodyHtml,
      plainTextSnippet: snippet,
      folderId: resolvedFolderId,
      trackerId: parsed.output.trackerId || null,
      planInstanceId: parsed.output.planInstanceId || null,
      planDayNumber: parsed.output.planDayNumber || null,
      planSessionId: parsed.output.planSessionId || null,
      versionId: parsed.output.versionId ?? null,
      bookId: parsed.output.bookId ?? null,
      chapter: parsed.output.chapter ?? null,
      startVerse: parsed.output.startVerse ?? null,
      startOffset: parsed.output.startOffset ?? null,
      endVerse: parsed.output.endVerse ?? null,
      endOffset: parsed.output.endOffset ?? null,
      selectedText: parsed.output.selectedText ?? null,
    })
    .returning();

  if (!inserted) {
    return { success: false, error: "Failed to create note" };
  }

  revalidatePath("/notes");
  if (inserted.planInstanceId) {
    revalidatePath(`/plans/${inserted.planInstanceId}`);
  }

  // Fetch full details
  let folderName: string | null = null;
  if (inserted.folderId) {
    const f = await db.query.noteFolders.findFirst({
      where: eq(noteFolders.id, inserted.folderId),
    });
    folderName = f?.name ?? null;
  }

  let planTitle: string | null = null;
  if (inserted.planInstanceId) {
    const inst = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, inserted.planInstanceId),
    });
    if (inst) {
      const blueprint = getReadingPlanById(inst.templateId || "");
      planTitle = blueprint?.title || "Reading Plan";
    }
  }

  return {
    success: true,
    note: {
      id: inserted.id,
      userId: inserted.userId,
      trackerId: inserted.trackerId,
      folderId: inserted.folderId,
      folderName,
      planInstanceId: inserted.planInstanceId,
      planTitle,
      planSessionId: inserted.planSessionId,
      planDayNumber: inserted.planDayNumber,
      versionId: inserted.versionId,
      bookId: inserted.bookId,
      chapter: inserted.chapter,
      startVerse: inserted.startVerse,
      startOffset: inserted.startOffset,
      endVerse: inserted.endVerse,
      endOffset: inserted.endOffset,
      selectedText: inserted.selectedText,
      title: inserted.title,
      bodyHtml: inserted.bodyHtml,
      plainTextSnippet: inserted.plainTextSnippet,
      isPinned: inserted.isPinned,
      isArchived: inserted.isArchived,
      createdAt: inserted.createdAt.toISOString(),
      updatedAt: inserted.updatedAt.toISOString(),
    },
  };
}

export type UpdateNoteParams = UpdateNoteInput;

export type UpdateNoteResult =
  { success: true; note: NoteDetail } | { success: false; error: string };

export async function updateNoteAction({
  noteId,
  title,
  bodyHtml,
  plainTextSnippet,
  folderId,
  isPinned,
  isArchived,
}: UpdateNoteParams): Promise<UpdateNoteResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(UpdateNoteSchema, {
    noteId,
    title,
    bodyHtml,
    plainTextSnippet,
    folderId,
    isPinned,
    isArchived,
  });

  if (!parsed.success) {
    const errorMsg = parsed.issues[0]?.message || "Invalid input";
    return { success: false, error: errorMsg };
  }

  const existing = await db.query.notes.findFirst({
    where: and(
      eq(notes.id, parsed.output.noteId),
      eq(notes.userId, session.user.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Note not found" };
  }

  const updates: Partial<typeof notes.$inferInsert> = {};
  if (parsed.output.title !== undefined) updates.title = parsed.output.title;
  if (parsed.output.bodyHtml !== undefined) {
    updates.bodyHtml = parsed.output.bodyHtml;
    updates.plainTextSnippet =
      parsed.output.plainTextSnippet ??
      parsed.output.bodyHtml
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 150);
  }
  if (parsed.output.folderId !== undefined) {
    updates.folderId = parsed.output.folderId;
  }
  if (parsed.output.isPinned !== undefined) {
    updates.isPinned = parsed.output.isPinned;
  }
  if (parsed.output.isArchived !== undefined) {
    updates.isArchived = parsed.output.isArchived;
  }

  const [updated] = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, existing.id))
    .returning();

  if (!updated) {
    return { success: false, error: "Failed to update note" };
  }

  revalidatePath("/notes");
  if (updated.planInstanceId) {
    revalidatePath(`/plans/${updated.planInstanceId}`);
  }

  let folderName: string | null = null;
  if (updated.folderId) {
    const f = await db.query.noteFolders.findFirst({
      where: eq(noteFolders.id, updated.folderId),
    });
    folderName = f?.name ?? null;
  }

  let planTitle: string | null = null;
  if (updated.planInstanceId) {
    const inst = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, updated.planInstanceId),
    });
    if (inst) {
      const blueprint = getReadingPlanById(inst.templateId || "");
      planTitle = blueprint?.title || "Reading Plan";
    }
  }

  return {
    success: true,
    note: {
      id: updated.id,
      userId: updated.userId,
      trackerId: updated.trackerId,
      folderId: updated.folderId,
      folderName,
      planInstanceId: updated.planInstanceId,
      planTitle,
      planSessionId: updated.planSessionId,
      planDayNumber: updated.planDayNumber,
      versionId: updated.versionId,
      bookId: updated.bookId,
      chapter: updated.chapter,
      startVerse: updated.startVerse,
      startOffset: updated.startOffset,
      endVerse: updated.endVerse,
      endOffset: updated.endOffset,
      selectedText: updated.selectedText,
      title: updated.title,
      bodyHtml: updated.bodyHtml,
      plainTextSnippet: updated.plainTextSnippet,
      isPinned: updated.isPinned,
      isArchived: updated.isArchived,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export type DeleteNoteParams = DeleteNoteInput;

export type DeleteNoteResult =
  { success: true } | { success: false; error: string };

export async function deleteNoteAction({
  noteId,
}: DeleteNoteParams): Promise<DeleteNoteResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(DeleteNoteSchema, { noteId });
  if (!parsed.success) return { success: false, error: "Invalid note ID" };

  const existing = await db.query.notes.findFirst({
    where: and(
      eq(notes.id, parsed.output.noteId),
      eq(notes.userId, session.user.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Note not found" };
  }

  await db.delete(notes).where(eq(notes.id, existing.id));

  revalidatePath("/notes");
  if (existing.planInstanceId) {
    revalidatePath(`/plans/${existing.planInstanceId}`);
  }
  return { success: true };
}

export type CreateFolderParams = CreateFolderInput;

export type CreateFolderResult =
  | { success: true; folder: NoteFolderDetail }
  | { success: false; error: string };

export async function createFolderAction({
  name,
  color,
  icon,
}: CreateFolderParams): Promise<CreateFolderResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(CreateFolderSchema, { name, color, icon });
  if (!parsed.success) {
    const errorMsg = parsed.issues[0]?.message || "Invalid folder input";
    return { success: false, error: errorMsg };
  }

  const [inserted] = await db
    .insert(noteFolders)
    .values({
      userId: session.user.id,
      name: parsed.output.name,
      color: parsed.output.color || "#18181B",
      icon: parsed.output.icon || "Folder",
    })
    .returning();

  if (!inserted) {
    return { success: false, error: "Failed to create folder" };
  }

  revalidatePath("/notes");

  return {
    success: true,
    folder: {
      id: inserted.id,
      name: inserted.name,
      color: inserted.color,
      icon: inserted.icon,
      isPinned: inserted.isPinned,
      notesCount: 0,
      createdAt: inserted.createdAt.toISOString(),
      updatedAt: inserted.updatedAt.toISOString(),
    },
  };
}

export type DeleteFolderParams = DeleteFolderInput;

export type DeleteFolderResult =
  { success: true } | { success: false; error: string };

export async function deleteFolderAction({
  folderId,
  deleteNotes = false,
}: DeleteFolderParams): Promise<DeleteFolderResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(DeleteFolderSchema, { folderId, deleteNotes });
  if (!parsed.success)
    return { success: false, error: "Invalid folder parameters" };

  const existing = await db.query.noteFolders.findFirst({
    where: and(
      eq(noteFolders.id, parsed.output.folderId),
      eq(noteFolders.userId, session.user.id)
    ),
  });

  if (!existing) {
    return { success: false, error: "Folder not found" };
  }

  if (parsed.output.deleteNotes) {
    await db
      .delete(notes)
      .where(
        and(eq(notes.folderId, existing.id), eq(notes.userId, session.user.id))
      );
  } else {
    await db
      .update(notes)
      .set({ folderId: null })
      .where(
        and(eq(notes.folderId, existing.id), eq(notes.userId, session.user.id))
      );
  }

  await db.delete(noteFolders).where(eq(noteFolders.id, existing.id));

  revalidatePath("/notes");
  return { success: true };
}

export type GetChapterNotesResult =
  { success: true; notes: NoteDetail[] } | { success: false; error: string };

export async function getChapterNotesAction(
  params: GetChapterNotesInput
): Promise<GetChapterNotesResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(GetChapterNotesSchema, params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid passage query",
    };
  }

  const { versionId, bookId, chapter } = parsed.output;
  const rows = await db.query.notes.findMany({
    where: and(
      eq(notes.userId, session.user.id),
      eq(notes.versionId, versionId),
      eq(notes.bookId, bookId),
      eq(notes.chapter, chapter),
      eq(notes.isArchived, false)
    ),
    orderBy: [
      asc(notes.startVerse),
      asc(notes.startOffset),
      desc(notes.updatedAt),
    ],
    with: {
      folder: true,
      planInstance: true,
    },
  });

  const formatted: NoteDetail[] = rows.map((n) => {
    let planTitle: string | null = null;
    if (n.planInstance) {
      const blueprint = getReadingPlanById(n.planInstance.templateId || "");
      planTitle = blueprint?.title || "Reading Plan";
    }
    return {
      id: n.id,
      userId: n.userId,
      trackerId: n.trackerId,
      folderId: n.folderId,
      folderName: n.folder?.name ?? null,
      planInstanceId: n.planInstanceId,
      planTitle,
      planSessionId: n.planSessionId,
      planDayNumber: n.planDayNumber,
      versionId: n.versionId,
      bookId: n.bookId,
      chapter: n.chapter,
      startVerse: n.startVerse,
      startOffset: n.startOffset,
      endVerse: n.endVerse,
      endOffset: n.endOffset,
      selectedText: n.selectedText,
      title: n.title,
      bodyHtml: n.bodyHtml,
      plainTextSnippet: n.plainTextSnippet,
      isPinned: n.isPinned,
      isArchived: n.isArchived,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  });

  return { success: true, notes: formatted };
}

export type GetPaginatedNotesParams = Partial<GetPaginatedNotesInput>;

export type GetPaginatedNotesResult =
  | {
      success: true;
      notes: NoteDetail[];
      totalCount: number;
      hasMore: boolean;
    }
  | { success: false; error: string };

const CANONICAL_BOOK_ORDER_SQL = sql<number>`CASE LOWER(${notes.bookId}) ${sql.join(
  PROTESTANT_BIBLE_BOOKS.map((book) => sql`WHEN ${book.id} THEN ${book.order}`),
  sql` `
)} ELSE 999 END`;

export async function getPaginatedNotesAction(
  params: GetPaginatedNotesParams = {}
): Promise<GetPaginatedNotesResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(GetPaginatedNotesSchema, params);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid notes query",
    };
  }

  const { page, limit, bookId, chapter, searchQuery, sortBy, sortDir } =
    parsed.output;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(notes.userId, session.user.id),
    eq(notes.isArchived, false),
  ];

  if (bookId) {
    conditions.push(eq(notes.bookId, bookId.toLowerCase()));
  }
  if (chapter) {
    conditions.push(eq(notes.chapter, chapter));
  }
  if (searchQuery && searchQuery.trim().length > 0) {
    const term = `%${searchQuery.trim()}%`;
    conditions.push(
      or(
        ilike(notes.title, term),
        ilike(notes.plainTextSnippet, term),
        ilike(notes.selectedText, term),
        ilike(notes.bookId, term)
      )!
    );
  }

  const whereClause = and(...conditions);
  const dirFn = sortDir === "asc" ? asc : desc;
  const orderBy =
    sortBy === "book"
      ? [
          dirFn(CANONICAL_BOOK_ORDER_SQL),
          dirFn(notes.chapter),
          dirFn(notes.startVerse),
          dirFn(notes.startOffset),
          dirFn(notes.createdAt),
        ]
      : [dirFn(notes.createdAt)];

  const [countRows, rows] = await Promise.all([
    db.select({ total: count() }).from(notes).where(whereClause),
    db.query.notes.findMany({
      where: whereClause,
      orderBy,
      limit,
      offset,
      with: {
        folder: true,
        planInstance: true,
      },
    }),
  ]);

  const totalCount = Number(countRows[0]?.total ?? 0);
  const formatted: NoteDetail[] = rows.map((n) => {
    let planTitle: string | null = null;
    if (n.planInstance) {
      const blueprint = getReadingPlanById(n.planInstance.templateId || "");
      planTitle = blueprint?.title || "Reading Plan";
    }
    return {
      id: n.id,
      userId: n.userId,
      trackerId: n.trackerId,
      folderId: n.folderId,
      folderName: n.folder?.name ?? null,
      planInstanceId: n.planInstanceId,
      planTitle,
      planSessionId: n.planSessionId,
      planDayNumber: n.planDayNumber,
      versionId: n.versionId,
      bookId: n.bookId,
      chapter: n.chapter,
      startVerse: n.startVerse,
      startOffset: n.startOffset,
      endVerse: n.endVerse,
      endOffset: n.endOffset,
      selectedText: n.selectedText,
      title: n.title,
      bodyHtml: n.bodyHtml,
      plainTextSnippet: n.plainTextSnippet,
      isPinned: n.isPinned,
      isArchived: n.isArchived,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  });

  return {
    success: true,
    notes: formatted,
    totalCount,
    hasMore: offset + formatted.length < totalCount,
  };
}
