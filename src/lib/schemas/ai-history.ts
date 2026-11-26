import * as v from "valibot";
import { AiStudioModeSchema, type AiStudioMode } from "./ai-plans";

export const AiCanonSchema = v.picklist([
  "protestant",
  "catholic",
  "eastern_orthodox",
  "ethiopian_orthodox",
]);

export const CreateAiFolderSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Folder name is required"),
    v.maxLength(60, "Folder name cannot exceed 60 characters")
  ),
});

export const RenameAiFolderSchema = v.object({
  folderId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Folder name is required"),
    v.maxLength(60, "Folder name cannot exceed 60 characters")
  ),
});

export const FolderIdSchema = v.object({
  folderId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export const CreateAiConversationSchema = v.object({
  id: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  mode: AiStudioModeSchema,
  canon: v.optional(AiCanonSchema, "protestant"),
  folderId: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.minLength(1)))
  ),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Title is required"),
    v.maxLength(120, "Title cannot exceed 120 characters")
  ),
});

export const UpdateAiConversationSchema = v.object({
  conversationId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  title: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, "Title is required"),
      v.maxLength(120, "Title cannot exceed 120 characters")
    )
  ),
  folderId: v.optional(
    v.nullable(v.pipe(v.string(), v.trim(), v.minLength(1)))
  ),
  isPinned: v.optional(v.boolean()),
  isArchived: v.optional(v.boolean()),
});

export const ConversationIdSchema = v.object({
  conversationId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export const AppendAiTurnSchema = v.object({
  conversationId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  userContent: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(8000)),
  assistantContent: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(64000)
  ),
  provider: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
});

export type AiFolderSummary = {
  id: string;
  name: string;
  isPinned: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type AiConversationSummary = {
  id: string;
  folderId: string | null;
  mode: AiStudioMode;
  canon: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  messageCount: number;
  lastMessageSequence: number;
  updatedAt: string;
};

export type AiMessageRecord = {
  id: string;
  sequence: number;
  role: "user" | "assistant";
  content: string;
  meta?: string;
  createdAt: string;
};
