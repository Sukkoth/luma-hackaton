import * as v from "valibot";

export const CreateNoteSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Title cannot be empty"),
    v.maxLength(200, "Title cannot exceed 200 characters")
  ),
  bodyHtml: v.optional(v.string(), ""),
  plainTextSnippet: v.optional(v.string(), ""),
  folderId: v.optional(v.nullable(v.string())),
  trackerId: v.optional(v.nullable(v.string())),
  planInstanceId: v.optional(v.nullable(v.string())),
  planDayNumber: v.optional(v.nullable(v.number())),
  planSessionId: v.optional(v.nullable(v.number())),
  versionId: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
  ),
  bookId: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)))
  ),
  chapter: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
  ),
  startVerse: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
  ),
  startOffset: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))
  ),
  endVerse: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
  ),
  endOffset: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
  ),
  selectedText: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(8000)))),
});

export const GetChapterNotesSchema = v.object({
  versionId: v.pipe(v.number(), v.integer(), v.minValue(1)),
  bookId: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)),
  chapter: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export type GetChapterNotesInput = v.InferOutput<typeof GetChapterNotesSchema>;

export const GetPaginatedNotesSchema = v.object({
  page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(50)),
    20
  ),
  bookId: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(16)))
  ),
  chapter: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))
  ),
  searchQuery: v.optional(v.pipe(v.string(), v.maxLength(200))),
  sortBy: v.optional(v.picklist(["createdAt", "book"]), "createdAt"),
  sortDir: v.optional(v.picklist(["asc", "desc"]), "desc"),
});

export type GetPaginatedNotesInput = v.InferOutput<
  typeof GetPaginatedNotesSchema
>;

export type CreateNoteInput = v.InferOutput<typeof CreateNoteSchema>;

export const UpdateNoteSchema = v.object({
  noteId: v.pipe(v.string(), v.minLength(1, "Note ID is required")),
  title: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, "Title cannot be empty"),
      v.maxLength(200, "Title cannot exceed 200 characters")
    )
  ),
  bodyHtml: v.optional(v.string()),
  plainTextSnippet: v.optional(v.string()),
  folderId: v.optional(v.nullable(v.string())),
  isPinned: v.optional(v.boolean()),
  isArchived: v.optional(v.boolean()),
});

export type UpdateNoteInput = v.InferOutput<typeof UpdateNoteSchema>;

export const DeleteNoteSchema = v.object({
  noteId: v.pipe(v.string(), v.minLength(1, "Note ID is required")),
});

export type DeleteNoteInput = v.InferOutput<typeof DeleteNoteSchema>;

export const CreateFolderSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Folder name cannot be empty"),
    v.maxLength(60, "Folder name cannot exceed 60 characters")
  ),
  color: v.optional(v.string()),
  icon: v.optional(v.string()),
});

export type CreateFolderInput = v.InferOutput<typeof CreateFolderSchema>;

export const DeleteFolderSchema = v.object({
  folderId: v.pipe(v.string(), v.minLength(1, "Folder ID is required")),
  deleteNotes: v.optional(v.boolean(), false),
});

export type DeleteFolderInput = v.InferOutput<typeof DeleteFolderSchema>;
