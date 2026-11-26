"use server";

import { headers } from "next/headers";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { buildAiChatSystemPrompt } from "@/lib/ai/chat-prompts";
import { generateAiChat, generateAiJson } from "@/lib/ai/client";
import {
  buildAiPlanSystemPrompt,
  distributeBlueprintToPlan,
} from "@/lib/ai/plan-generator";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import {
  AiChatRequestSchema,
  AiPlanBlueprintSchema,
  GenerateAiPlanRequestSchema,
  type AiChatRequestInput,
  type GenerateAiPlanRequestInput,
} from "@/lib/schemas/ai-plans";
import type { CreateCustomPlanTemplateInput } from "@/lib/schemas/plans";

export type GenerateAiPlanParams = GenerateAiPlanRequestInput;

export type GenerateAiPlanResult =
  | {
      success: true;
      plan: CreateCustomPlanTemplateInput;
      provider: string;
    }
  | { success: false; error: string; isRateLimited?: boolean };

export async function generateAiPlanAction({
  prompt,
  targetDays,
  canon = "protestant",
  previousContext,
}: GenerateAiPlanParams): Promise<GenerateAiPlanResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { success: false, error: "Please sign in to generate an AI plan." };
  }

  const parsedInput = v.safeParse(GenerateAiPlanRequestSchema, {
    prompt,
    targetDays,
    canon,
    previousContext,
  });

  if (!parsedInput.success) {
    return {
      success: false,
      error: parsedInput.issues[0]?.message ?? "Invalid plan request.",
    };
  }

  const rateLimit = await checkAiRateLimit({
    userId: session.user.id,
    kind: "plan",
  });
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: rateLimit.message,
      isRateLimited: true,
    };
  }

  const system = buildAiPlanSystemPrompt({ canon: parsedInput.output.canon });
  const userPromptParts = [
    parsedInput.output.targetDays
      ? `Create or refine a ${parsedInput.output.targetDays}-day Bible reading plan.`
      : "Create or refine a Bible reading plan (1 to 365 days based on the user's request).",
  ];
  if (parsedInput.output.previousContext) {
    userPromptParts.push(
      `Current plan context to refine:\n${parsedInput.output.previousContext}`
    );
  }
  userPromptParts.push(`User request:\n${parsedInput.output.prompt}`);
  const baseUserPrompt = userPromptParts.join("\n\n");
  const maxAttempts = 2;
  let lastError =
    "AI returned an unexpected plan structure. Please try generating again.";
  let retryFeedback = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const attemptPrompt = retryFeedback
      ? `${baseUserPrompt}\n\nIMPORTANT CORRECTION (previous response was invalid: ${retryFeedback}): Return ONLY valid JSON matching the exact schema with valid bookId values and non-empty sections/ranges.`
      : baseUserPrompt;

    const aiResult = await generateAiJson({
      system,
      prompt: attemptPrompt,
      maxOutputTokens: 3500,
      temperature: attempt === 1 ? 0.35 : 0.2,
    });

    if (!aiResult.success) {
      lastError = aiResult.error;
      retryFeedback = aiResult.error;
      continue;
    }

    if (
      typeof aiResult.data === "object" &&
      aiResult.data !== null &&
      "notAPlan" in aiResult.data &&
      (aiResult.data as { notAPlan?: unknown }).notAPlan === true
    ) {
      const msg = (aiResult.data as { message?: unknown }).message;
      return {
        success: false,
        error:
          typeof msg === "string" && msg.trim().length > 0
            ? msg
            : "Please describe a Bible reading plan, or switch to Conversational mode.",
      };
    }

    const parsedBlueprint = v.safeParse(AiPlanBlueprintSchema, aiResult.data);
    if (!parsedBlueprint.success) {
      const issueMsg = parsedBlueprint.issues[0]?.message ?? "schema mismatch";
      lastError =
        "AI returned an unexpected plan structure. Please try generating again.";
      retryFeedback = issueMsg;
      continue;
    }

    const resolvedTargetDays =
      parsedInput.output.targetDays ?? parsedBlueprint.output.targetDays ?? 30;

    const distributed = distributeBlueprintToPlan({
      blueprint: parsedBlueprint.output,
      targetDays: resolvedTargetDays,
      canon: parsedInput.output.canon,
    });

    if (!distributed.success) {
      lastError = distributed.error;
      retryFeedback = distributed.error;
      continue;
    }

    return {
      success: true,
      plan: distributed.plan,
      provider: aiResult.provider,
    };
  }

  return {
    success: false,
    error: lastError,
  };
}

export type ChatBibleAssistantParams = AiChatRequestInput;

export type ChatBibleAssistantResult =
  | { success: true; reply: string; provider: string }
  | { success: false; error: string };

export async function chatBibleAssistantAction({
  mode,
  messages,
  canon = "protestant",
}: ChatBibleAssistantParams): Promise<ChatBibleAssistantResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return { success: false, error: "Please sign in to use Luma AI." };
  }

  const parsedInput = v.safeParse(AiChatRequestSchema, {
    mode,
    messages,
    canon,
  });

  if (!parsedInput.success) {
    return {
      success: false,
      error: parsedInput.issues[0]?.message ?? "Invalid message.",
    };
  }

  const system = buildAiChatSystemPrompt({
    canon: parsedInput.output.canon,
  });

  const recentMessages = parsedInput.output.messages.slice(-12);
  const aiResult = await generateAiChat({
    system,
    messages: recentMessages,
    maxOutputTokens: 1600,
    temperature: 0.5,
  });

  if (!aiResult.success) {
    return { success: false, error: aiResult.error };
  }

  return {
    success: true,
    reply: aiResult.text,
    provider: aiResult.provider,
  };
}
