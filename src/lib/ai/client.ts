import "server-only";

import { generateText, streamText, type LanguageModel } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

type ModelCandidate = {
  name: string;
  model: LanguageModel;
};

function getConfiguredModels(): ModelCandidate[] {
  const candidates: ModelCandidate[] = [];

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const groqClient = createGroq({ apiKey: groqKey });
    const groqModels = [
      process.env.GROQ_MODEL?.trim() || "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
    ];
    for (const groqModelId of Array.from(new Set(groqModels))) {
      candidates.push({
        name: `groq:${groqModelId}`,
        model: groqClient(groqModelId),
      });
    }
  }

  const cerebrasKey = process.env.CEREBRAS_API_KEY?.trim();
  if (cerebrasKey) {
    const cerebrasClient = createOpenAICompatible({
      name: "cerebras",
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: cerebrasKey,
    });
    const cerebrasModelId = process.env.CEREBRAS_MODEL?.trim() || "qwen-3-32b";
    candidates.push({
      name: `cerebras:${cerebrasModelId}`,
      model: cerebrasClient(cerebrasModelId),
    });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    const openRouterClient = createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterKey,
    });
    const openRouterModelId =
      process.env.OPENROUTER_MODEL?.trim() || "qwen/qwen3-32b:free";
    candidates.push({
      name: `openrouter:${openRouterModelId}`,
      model: openRouterClient(openRouterModelId),
    });
  }

  return candidates;
}

export function extractJsonFromAiResponse({
  rawText,
}: {
  rawText: string;
}): unknown {
  const withoutThink = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fencedMatch = withoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fencedMatch ? fencedMatch[1] : withoutThink) ?? "";
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  const jsonSlice =
    firstBrace !== -1 && lastBrace > firstBrace
      ? candidate.slice(firstBrace, lastBrace + 1)
      : candidate;

  return JSON.parse(jsonSlice) as unknown;
}

export type GenerateAiJsonParams = {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export type GenerateAiJsonResult =
  | { success: true; data: unknown; provider: string }
  | { success: false; error: string };

export async function generateAiJson({
  system,
  prompt,
  maxOutputTokens = 2000,
  temperature = 0.4,
}: GenerateAiJsonParams): Promise<GenerateAiJsonResult> {
  const models = getConfiguredModels();
  if (models.length === 0) {
    return {
      success: false,
      error:
        "No AI provider API key is configured. Set GROQ_API_KEY, CEREBRAS_API_KEY, or OPENROUTER_API_KEY in your environment.",
    };
  }

  let lastError = "AI provider failed to respond.";
  for (const candidate of models) {
    try {
      const result = await generateText({
        model: candidate.model,
        system,
        prompt,
        maxOutputTokens,
        temperature,
      });
      const parsed = extractJsonFromAiResponse({ rawText: result.text });
      return { success: true, data: parsed, provider: candidate.name };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : "AI generation failed.";
    }
  }

  return {
    success: false,
    error: `All configured AI providers failed: ${lastError}`,
  };
}

export type GenerateAiChatParams = {
  system: string;
  messages: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
  maxOutputTokens?: number;
  temperature?: number;
};

export type GenerateAiChatResult =
  | { success: true; text: string; provider: string }
  | { success: false; error: string };

export async function generateAiChat({
  system,
  messages,
  maxOutputTokens = 1600,
  temperature = 0.5,
}: GenerateAiChatParams): Promise<GenerateAiChatResult> {
  const models = getConfiguredModels();
  if (models.length === 0) {
    return {
      success: false,
      error:
        "No AI provider API key is configured. Set GROQ_API_KEY, CEREBRAS_API_KEY, or OPENROUTER_API_KEY in your environment.",
    };
  }

  let lastError = "AI provider failed to respond.";
  for (const candidate of models) {
    try {
      const result = await generateText({
        model: candidate.model,
        system,
        messages: [...messages],
        maxOutputTokens,
        temperature,
      });
      const cleaned = result.text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();
      if (!cleaned) {
        throw new Error("Empty response from AI provider.");
      }
      return { success: true, text: cleaned, provider: candidate.name };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : "AI generation failed.";
    }
  }

  return {
    success: false,
    error: `All configured AI providers failed: ${lastError}`,
  };
}

export type StreamAiChatResult =
  | { success: true; stream: ReadableStream<Uint8Array>; provider: string }
  | { success: false; error: string };

export async function streamAiChat({
  system,
  messages,
  maxOutputTokens = 1600,
  temperature = 0.5,
}: GenerateAiChatParams): Promise<StreamAiChatResult> {
  const models = getConfiguredModels();
  if (models.length === 0) {
    return {
      success: false,
      error:
        "No AI provider API key is configured. Set GROQ_API_KEY, CEREBRAS_API_KEY, or OPENROUTER_API_KEY in your environment.",
    };
  }

  let lastError = "AI provider failed to respond.";
  for (const candidate of models) {
    try {
      const result = streamText({
        model: candidate.model,
        system,
        messages: [...messages],
        maxOutputTokens,
        temperature,
      });

      const iterator = result.textStream[Symbol.asyncIterator]();
      const firstChunk = await iterator.next();
      if (firstChunk.done) {
        throw new Error("Empty response from AI provider.");
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          let insideThink = false;
          let buffer = "";

          const emitChunk = (chunk: string) => {
            buffer += chunk;
            while (buffer.length > 0) {
              if (insideThink) {
                const closeIdx = buffer.indexOf("</think>");
                if (closeIdx === -1) {
                  buffer = buffer.slice(-8);
                  return;
                }
                buffer = buffer.slice(closeIdx + "</think>".length).trimStart();
                insideThink = false;
                continue;
              }

              const openIdx = buffer.indexOf("<think>");
              if (openIdx !== -1) {
                const before = buffer.slice(0, openIdx);
                if (before) controller.enqueue(encoder.encode(before));
                buffer = buffer.slice(openIdx + "<think>".length);
                insideThink = true;
                continue;
              }

              // Hold back a tiny tail in case "<think>" spans chunk boundaries
              const safeLength = Math.max(0, buffer.length - 6);
              if (safeLength > 0) {
                controller.enqueue(encoder.encode(buffer.slice(0, safeLength)));
                buffer = buffer.slice(safeLength);
              }
              return;
            }
          };

          try {
            emitChunk(firstChunk.value);
            while (true) {
              const next = await iterator.next();
              if (next.done) break;
              emitChunk(next.value);
            }
            if (!insideThink && buffer.length > 0) {
              controller.enqueue(encoder.encode(buffer));
            }
            controller.close();
          } catch (streamErr: unknown) {
            controller.error(streamErr);
          }
        },
      });

      return { success: true, stream, provider: candidate.name };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : "AI streaming failed.";
    }
  }

  return {
    success: false,
    error: `All configured AI providers failed: ${lastError}`,
  };
}
