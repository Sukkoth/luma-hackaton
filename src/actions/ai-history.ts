"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import * as v from "valibot";
import { db } from "@/db";
import { aiConversations, aiFolders, aiMessages } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  AppendAiTurnSchema,
  ConversationIdSchema,
  CreateAiConversationSchema,
  CreateAiFolderSchema,
  FolderIdSchema,
  RenameAiFolderSchema,
  UpdateAiConversationSchema,
  type AiConversationSummary,
  type AiFolderSummary,
  type AiMessageRecord,
} from "@/lib/schemas/ai-history";
import type { AiStudioMode } from "@/lib/schemas/ai-plans";

export async function getAiSidebarData({
  userId,
}: {
  userId: string;
}): Promise<{
  folders: AiFolderSummary[];
  conversations: AiConversationSummary[];
}> {
  const [folderRows, conversationRows] = await Promise.all([
    db
      .select({
        id: aiFolders.id,
        name: aiFolders.name,
        isPinned: aiFolders.isPinned,
        sortOrder: aiFolders.sortOrder,
        updatedAt: aiFolders.updatedAt,
      })
      .from(aiFolders)
      .where(eq(aiFolders.userId, userId))
      .orderBy(
        desc(aiFolders.isPinned),
        asc(aiFolders.sortOrder),
        asc(aiFolders.name)
      ),
    db
      .select({
        id: aiConversations.id,
        folderId: aiConversations.folderId,
        mode: aiConversations.mode,
        canon: aiConversations.canon,
        title: aiConversations.title,
        isPinned: aiConversations.isPinned,
        messageCount: aiConversations.messageCount,
        lastMessageSequence: aiConversations.lastMessageSequence,
        updatedAt: aiConversations.updatedAt,
      })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.userId, userId),
          eq(aiConversations.isArchived, false)
        )
      )
      .orderBy(desc(aiConversations.isPinned), desc(aiConversations.updatedAt)),
  ]);

  return {
    folders: folderRows.map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString(),
    })),
    conversations: conversationRows.map((row) => ({
      ...row,
      mode: row.mode === "chat" ? ("chat" as const) : ("plan" as const),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

export async function getAiSidebarDataAction(): Promise<
  | {
      success: true;
      folders: AiFolderSummary[];
      conversations: AiConversationSummary[];
    }
  | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in to view your AI chats." };
  }
  const data = await getAiSidebarData({ userId: session.user.id });
  return { success: true, ...data };
}

export async function createAiFolderAction(
  input: v.InferInput<typeof CreateAiFolderSchema>
): Promise<
  { success: true; folder: AiFolderSummary } | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in to create folders." };
  }

  const parsed = v.safeParse(CreateAiFolderSchema, input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid folder name.",
    };
  }

  const [created] = await db
    .insert(aiFolders)
    .values({
      userId: session.user.id,
      name: parsed.output.name,
    })
    .returning({
      id: aiFolders.id,
      name: aiFolders.name,
      isPinned: aiFolders.isPinned,
      sortOrder: aiFolders.sortOrder,
      updatedAt: aiFolders.updatedAt,
    });

  if (!created) {
    return { success: false, error: "Failed to create folder." };
  }

  return {
    success: true,
    folder: {
      ...created,
      updatedAt: created.updatedAt.toISOString(),
    },
  };
}

export async function renameAiFolderAction(
  input: v.InferInput<typeof RenameAiFolderSchema>
): Promise<
  { success: true; folder: AiFolderSummary } | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in to rename folders." };
  }

  const parsed = v.safeParse(RenameAiFolderSchema, input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid folder name.",
    };
  }

  const [updated] = await db
    .update(aiFolders)
    .set({ name: parsed.output.name })
    .where(
      and(
        eq(aiFolders.id, parsed.output.folderId),
        eq(aiFolders.userId, session.user.id)
      )
    )
    .returning({
      id: aiFolders.id,
      name: aiFolders.name,
      isPinned: aiFolders.isPinned,
      sortOrder: aiFolders.sortOrder,
      updatedAt: aiFolders.updatedAt,
    });

  if (!updated) {
    return { success: false, error: "Folder not found." };
  }

  return {
    success: true,
    folder: {
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function toggleAiFolderPinAction(
  input: v.InferInput<typeof FolderIdSchema>
): Promise<
  { success: true; folder: AiFolderSummary } | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in." };
  }

  const parsed = v.safeParse(FolderIdSchema, input);
  if (!parsed.success) {
    return { success: false, error: "Invalid folder ID." };
  }

  const [existing] = await db
    .select({ id: aiFolders.id, isPinned: aiFolders.isPinned })
    .from(aiFolders)
    .where(
      and(
        eq(aiFolders.id, parsed.output.folderId),
        eq(aiFolders.userId, session.user.id)
      )
    );

  if (!existing) {
    return { success: false, error: "Folder not found." };
  }

  const [updated] = await db
    .update(aiFolders)
    .set({ isPinned: !existing.isPinned })
    .where(
      and(
        eq(aiFolders.id, parsed.output.folderId),
        eq(aiFolders.userId, session.user.id)
      )
    )
    .returning({
      id: aiFolders.id,
      name: aiFolders.name,
      isPinned: aiFolders.isPinned,
      sortOrder: aiFolders.sortOrder,
      updatedAt: aiFolders.updatedAt,
    });

  if (!updated) {
    return { success: false, error: "Folder not found." };
  }

  return {
    success: true,
    folder: {
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function deleteAiFolderAction(
  input: v.InferInput<typeof FolderIdSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in." };
  }

  const parsed = v.safeParse(FolderIdSchema, input);
  if (!parsed.success) {
    return { success: false, error: "Invalid folder ID." };
  }

  const [deleted] = await db
    .delete(aiFolders)
    .where(
      and(
        eq(aiFolders.id, parsed.output.folderId),
        eq(aiFolders.userId, session.user.id)
      )
    )
    .returning({ id: aiFolders.id });

  if (!deleted) {
    return { success: false, error: "Folder not found." };
  }

  return { success: true };
}

export async function createAiConversationAction(
  input: v.InferInput<typeof CreateAiConversationSchema>
): Promise<
  | { success: true; conversation: AiConversationSummary }
  | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in." };
  }

  const parsed = v.safeParse(CreateAiConversationSchema, input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid conversation details.",
    };
  }

  let validatedFolderId: string | null = parsed.output.folderId ?? null;
  if (validatedFolderId) {
    const [folder] = await db
      .select({ id: aiFolders.id })
      .from(aiFolders)
      .where(
        and(
          eq(aiFolders.id, validatedFolderId),
          eq(aiFolders.userId, session.user.id)
        )
      );
    if (!folder) {
      validatedFolderId = null;
    }
  }

  const [created] = await db
    .insert(aiConversations)
    .values({
      ...(parsed.output.id ? { id: parsed.output.id } : {}),
      userId: session.user.id,
      folderId: validatedFolderId,
      mode: parsed.output.mode,
      canon: parsed.output.canon,
      title: parsed.output.title,
    })
    .returning({
      id: aiConversations.id,
      folderId: aiConversations.folderId,
      mode: aiConversations.mode,
      canon: aiConversations.canon,
      title: aiConversations.title,
      isPinned: aiConversations.isPinned,
      messageCount: aiConversations.messageCount,
      lastMessageSequence: aiConversations.lastMessageSequence,
      updatedAt: aiConversations.updatedAt,
    });

  if (!created) {
    return { success: false, error: "Failed to create conversation." };
  }

  return {
    success: true,
    conversation: {
      ...created,
      mode: created.mode as AiStudioMode,
      updatedAt: created.updatedAt.toISOString(),
    },
  };
}

export async function updateAiConversationAction(
  input: v.InferInput<typeof UpdateAiConversationSchema>
): Promise<
  | { success: true; conversation: AiConversationSummary }
  | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in." };
  }

  const parsed = v.safeParse(UpdateAiConversationSchema, input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid conversation update.",
    };
  }

  const updates: {
    title?: string;
    folderId?: string | null;
    isPinned?: boolean;
  } = {};

  if (parsed.output.title !== undefined) {
    updates.title = parsed.output.title;
  }
  if (parsed.output.isPinned !== undefined) {
    updates.isPinned = parsed.output.isPinned;
  }
  if (parsed.output.folderId !== undefined) {
    if (parsed.output.folderId === null) {
      updates.folderId = null;
    } else {
      const [folder] = await db
        .select({ id: aiFolders.id })
        .from(aiFolders)
        .where(
          and(
            eq(aiFolders.id, parsed.output.folderId),
            eq(aiFolders.userId, session.user.id)
          )
        );
      if (!folder) {
        return { success: false, error: "Target folder not found." };
      }
      updates.folderId = folder.id;
    }
  }

  const [updated] = await db
    .update(aiConversations)
    .set(updates)
    .where(
      and(
        eq(aiConversations.id, parsed.output.conversationId),
        eq(aiConversations.userId, session.user.id)
      )
    )
    .returning({
      id: aiConversations.id,
      folderId: aiConversations.folderId,
      mode: aiConversations.mode,
      canon: aiConversations.canon,
      title: aiConversations.title,
      isPinned: aiConversations.isPinned,
      messageCount: aiConversations.messageCount,
      lastMessageSequence: aiConversations.lastMessageSequence,
      updatedAt: aiConversations.updatedAt,
    });

  if (!updated) {
    return { success: false, error: "Conversation not found." };
  }

  return {
    success: true,
    conversation: {
      ...updated,
      mode: updated.mode as AiStudioMode,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function deleteAiConversationAction(
  input: v.InferInput<typeof ConversationIdSchema>
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in." };
  }

  const parsed = v.safeParse(ConversationIdSchema, input);
  if (!parsed.success) {
    return { success: false, error: "Invalid conversation ID." };
  }

  const [deleted] = await db
    .delete(aiConversations)
    .where(
      and(
        eq(aiConversations.id, parsed.output.conversationId),
        eq(aiConversations.userId, session.user.id)
      )
    )
    .returning({ id: aiConversations.id });

  if (!deleted) {
    return { success: false, error: "Conversation not found." };
  }

  return { success: true };
}

export async function appendAiTurnAction(
  input: v.InferInput<typeof AppendAiTurnSchema>
): Promise<
  | {
      success: true;
      conversation: AiConversationSummary;
      messages: AiMessageRecord[];
    }
  | { success: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { success: false, error: "Please sign in." };
  }

  const parsed = v.safeParse(AppendAiTurnSchema, input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message ?? "Invalid message payload.",
    };
  }

  const result = await db.transaction(async (tx) => {
    const [conv] = await tx
      .select({
        id: aiConversations.id,
        userId: aiConversations.userId,
        lastMessageSequence: aiConversations.lastMessageSequence,
        messageCount: aiConversations.messageCount,
      })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.id, parsed.output.conversationId),
          eq(aiConversations.userId, session.user.id)
        )
      );

    if (!conv) {
      return null;
    }

    const userSeq = conv.lastMessageSequence + 1;
    const assistantSeq = conv.lastMessageSequence + 2;

    const insertedMessages = await tx
      .insert(aiMessages)
      .values([
        {
          conversationId: conv.id,
          sequence: userSeq,
          role: "user",
          content: parsed.output.userContent,
        },
        {
          conversationId: conv.id,
          sequence: assistantSeq,
          role: "assistant",
          content: parsed.output.assistantContent,
          provider: parsed.output.provider ?? null,
        },
      ])
      .returning({
        id: aiMessages.id,
        sequence: aiMessages.sequence,
        role: aiMessages.role,
        content: aiMessages.content,
        provider: aiMessages.provider,
        createdAt: aiMessages.createdAt,
      });

    const [updatedConv] = await tx
      .update(aiConversations)
      .set({
        messageCount: conv.messageCount + 2,
        lastMessageSequence: assistantSeq,
        updatedAt: new Date(),
      })
      .where(eq(aiConversations.id, conv.id))
      .returning({
        id: aiConversations.id,
        folderId: aiConversations.folderId,
        mode: aiConversations.mode,
        canon: aiConversations.canon,
        title: aiConversations.title,
        isPinned: aiConversations.isPinned,
        messageCount: aiConversations.messageCount,
        lastMessageSequence: aiConversations.lastMessageSequence,
        updatedAt: aiConversations.updatedAt,
      });

    if (!updatedConv) {
      return null;
    }

    return { updatedConv, insertedMessages };
  });

  if (!result) {
    return { success: false, error: "Conversation not found." };
  }

  return {
    success: true,
    conversation: {
      ...result.updatedConv,
      mode: result.updatedConv.mode as AiStudioMode,
      updatedAt: result.updatedConv.updatedAt.toISOString(),
    },
    messages: result.insertedMessages.map((m) => ({
      id: m.id,
      sequence: m.sequence,
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
      ...(m.provider ? { meta: m.provider } : {}),
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
