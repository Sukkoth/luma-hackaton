import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiConversations, aiFolders } from "@/db/schema";
import type {
  AiConversationSummary,
  AiFolderSummary,
} from "@/lib/schemas/ai-history";

export type GetAiSidebarDataParams = {
  userId: string;
  conversationLimit?: number;
};

export async function getAiSidebarDataForUser({
  userId,
  conversationLimit = 50,
}: GetAiSidebarDataParams): Promise<{
  folders: AiFolderSummary[];
  conversations: AiConversationSummary[];
}> {
  const safeLimit = Math.max(1, Math.min(conversationLimit, 200));

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
        isArchived: aiConversations.isArchived,
        messageCount: aiConversations.messageCount,
        lastMessageSequence: aiConversations.lastMessageSequence,
        updatedAt: aiConversations.updatedAt,
      })
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.isPinned), desc(aiConversations.updatedAt))
      .limit(safeLimit),
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
