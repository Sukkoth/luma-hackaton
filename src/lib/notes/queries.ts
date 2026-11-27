import "server-only";

import { and, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { noteFolders, notes } from "@/db/schema";
import { getReadingPlanById } from "@/data/readingPlans";
import type { NoteDetail, NoteFolderDetail } from "@/actions/notes";

export type GetUserNotesForUserParams = {
  userId: string;
  folderId?: string;
  planInstanceId?: string;
  searchQuery?: string;
  includeArchived?: boolean;
};

export type GetUserNotesForUserResult = {
  notes: NoteDetail[];
  folders: NoteFolderDetail[];
};

export async function getUserNotesForUser({
  userId,
  folderId,
  planInstanceId,
  searchQuery,
  includeArchived,
}: GetUserNotesForUserParams): Promise<GetUserNotesForUserResult> {
  const conditions = [eq(notes.userId, userId)];
  if (!includeArchived) {
    conditions.push(eq(notes.isArchived, false));
  }

  if (folderId) {
    if (folderId === "uncategorized") {
      conditions.push(sql`${notes.folderId} IS NULL`);
    } else {
      conditions.push(eq(notes.folderId, folderId));
    }
  }

  if (planInstanceId) {
    conditions.push(eq(notes.planInstanceId, planInstanceId));
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const term = `%${searchQuery.trim()}%`;
    conditions.push(
      or(ilike(notes.title, term), ilike(notes.plainTextSnippet, term))!
    );
  }

  const [userNotes, userFolders, folderCounts] = await Promise.all([
    db.query.notes.findMany({
      where: and(...conditions),
      orderBy: [desc(notes.isPinned), desc(notes.updatedAt)],
      with: {
        folder: {
          columns: { name: true },
        },
        planInstance: {
          columns: { templateId: true },
        },
      },
    }),
    db.query.noteFolders.findMany({
      where: eq(noteFolders.userId, userId),
      orderBy: [desc(noteFolders.isPinned), desc(noteFolders.updatedAt)],
    }),
    db
      .select({
        folderId: notes.folderId,
        count: sql<number>`count(*)::int`,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.isArchived, false),
          isNotNull(notes.folderId)
        )
      )
      .groupBy(notes.folderId),
  ]);

  const countByFolderId = new Map<string, number>();
  for (const row of folderCounts) {
    if (row.folderId) {
      countByFolderId.set(row.folderId, Number(row.count));
    }
  }

  const formattedFolders: NoteFolderDetail[] = userFolders.map((f) => ({
    id: f.id,
    name: f.name,
    color: f.color,
    icon: f.icon,
    isPinned: f.isPinned,
    notesCount: countByFolderId.get(f.id) ?? 0,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  const formattedNotes: NoteDetail[] = userNotes.map((n) => {
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
    notes: formattedNotes,
    folders: formattedFolders,
  };
}

export type GetSingleNoteForUserParams = {
  userId: string;
  noteId: string;
};

export async function getSingleNoteForUser({
  userId,
  noteId,
}: GetSingleNoteForUserParams): Promise<NoteDetail | null> {
  const note = await db.query.notes.findFirst({
    where: and(eq(notes.id, noteId), eq(notes.userId, userId)),
    with: {
      folder: {
        columns: { name: true },
      },
      planInstance: {
        columns: { templateId: true },
      },
    },
  });

  if (!note) return null;

  let planTitle: string | null = null;
  if (note.planInstance) {
    const blueprint = getReadingPlanById(note.planInstance.templateId || "");
    planTitle = blueprint?.title || "Reading Plan";
  }

  return {
    id: note.id,
    userId: note.userId,
    trackerId: note.trackerId,
    folderId: note.folderId,
    folderName: note.folder?.name ?? null,
    planInstanceId: note.planInstanceId,
    planTitle,
    planSessionId: note.planSessionId,
    planDayNumber: note.planDayNumber,
    versionId: note.versionId,
    bookId: note.bookId,
    chapter: note.chapter,
    startVerse: note.startVerse,
    startOffset: note.startOffset,
    endVerse: note.endVerse,
    endOffset: note.endOffset,
    selectedText: note.selectedText,
    title: note.title,
    bodyHtml: note.bodyHtml,
    plainTextSnippet: note.plainTextSnippet,
    isPinned: note.isPinned,
    isArchived: note.isArchived,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
