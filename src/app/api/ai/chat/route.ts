import { headers } from "next/headers";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { createGetVerseTool } from "@/lib/ai/bible-tool";
import { buildAiChatSystemPrompt } from "@/lib/ai/chat-prompts";
import { streamAiChat } from "@/lib/ai/client";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { AiChatRequestSchema } from "@/lib/schemas/ai-plans";

export const maxDuration = 60;

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

  const rateLimit = await checkAiRateLimit({
    userId: session.user.id,
    kind: "chat",
  });
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: rateLimit.message,
        code: "RATE_LIMITED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const baseUrl = new URL(request.url).origin;
  const system = buildAiChatSystemPrompt({
    canon: parsedInput.output.canon,
    baseUrl,
  });

  const startedAt = Date.now();
  const recentMessages = parsedInput.output.messages.slice(-12);
  const streamResult = await streamAiChat({
    system,
    messages: recentMessages,
    maxOutputTokens: 900,
    temperature: 0.4,
    tools: {
      getVerse: createGetVerseTool({ canon: parsedInput.output.canon }),
    },
    abortSignal: request.signal,
    onFinish: ({ provider, finishReason, usage }) => {
      console.info("[luma-ai] chat stream finished", {
        provider,
        finishReason,
        durationMs: Date.now() - startedAt,
        usage,
      });
    },
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
