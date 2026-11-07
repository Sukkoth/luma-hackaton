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
});

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
