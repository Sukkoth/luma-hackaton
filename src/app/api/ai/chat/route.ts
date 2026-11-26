import { headers } from "next/headers";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { buildAiChatSystemPrompt } from "@/lib/ai/chat-prompts";
import { streamAiChat } from "@/lib/ai/client";
import { AiChatRequestSchema } from "@/lib/schemas/ai-plans";

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json(
      { error: "Please sign in to use Luma AI." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedInput = v.safeParse(AiChatRequestSchema, body);
  if (!parsedInput.success) {
    return Response.json(
      { error: parsedInput.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  const baseUrl = new URL(request.url).origin;
  const system = buildAiChatSystemPrompt({
    canon: parsedInput.output.canon,
    baseUrl,
  });

  const recentMessages = parsedInput.output.messages.slice(-12);
  const streamResult = await streamAiChat({
    system,
    messages: recentMessages,
    maxOutputTokens: 1600,
    temperature: 0.5,
  });

  if (!streamResult.success) {
    return Response.json({ error: streamResult.error }, { status: 502 });
  }

  return new Response(streamResult.stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-AI-Provider": streamResult.provider,
    },
  });
}
