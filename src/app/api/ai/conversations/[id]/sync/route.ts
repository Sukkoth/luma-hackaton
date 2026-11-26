import { and, asc, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { aiConversations, aiMessages } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { AiStudioMode } from "@/lib/schemas/ai-plans";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id || !id.trim()) {
    return Response.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  const url = new URL(request.url);
  const rawAfterSeq = url.searchParams.get("afterSeq");
  const knownUpdatedAt = url.searchParams.get("knownUpdatedAt");
  const parsedAfterSeq =
    rawAfterSeq !== null ? Number.parseInt(rawAfterSeq, 10) : 0;
  const afterSeq =
    Number.isFinite(parsedAfterSeq) && parsedAfterSeq >= 0 ? parsedAfterSeq : 0;

  const [conversation] = await db
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
        eq(aiConversations.id, id),
        eq(aiConversations.userId, session.user.id)
      )
    );

  if (!conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  const updatedAtIso = conversation.updatedAt.toISOString();
  if (
    knownUpdatedAt &&
    knownUpdatedAt === updatedAtIso &&
    afterSeq >= conversation.lastMessageSequence
  ) {
    return Response.json({
      unchanged: true,
      updatedAt: updatedAtIso,
    });
  }

  const messageRows = await db
    .select({
      id: aiMessages.id,
      sequence: aiMessages.sequence,
      role: aiMessages.role,
      content: aiMessages.content,
      provider: aiMessages.provider,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(
      and(
        eq(aiMessages.conversationId, conversation.id),
        gt(aiMessages.sequence, afterSeq)
      )
    )
    .orderBy(asc(aiMessages.sequence));

  return Response.json({
    unchanged: false,
    conversation: {
      ...conversation,
      mode: (conversation.mode === "chat" ? "chat" : "plan") as AiStudioMode,
      updatedAt: updatedAtIso,
    },
    messages: messageRows.map((m) => ({
      id: m.id,
      sequence: m.sequence,
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
      ...(m.provider ? { meta: m.provider } : {}),
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
