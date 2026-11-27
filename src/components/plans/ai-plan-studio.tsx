"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import * as v from "valibot";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Layers,
  Loader2,
  MessageSquare,
  PanelLeft,
  RotateCcw,
  Save,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  appendAiTurnAction,
  createAiConversationAction,
  createAiFolderAction,
  deleteAiConversationAction,
  deleteAiFolderAction,
  getAiSidebarDataAction,
  renameAiFolderAction,
  toggleAiFolderPinAction,
  updateAiConversationAction,
} from "@/actions/ai-history";
import { generateAiPlanAction } from "@/actions/ai-plans";
import { createNoteAction } from "@/actions/notes";
import { createCustomPlanTemplateAction } from "@/actions/plans";
import type { BibleCanon } from "@/data/bibleData";
import {
  broadcastAiSync,
  deleteCachedConversation,
  getCachedConversation,
  getCachedDraft,
  mergeConversationMessages,
  putCachedConversation,
  putCachedDraft,
  putCachedSidebar,
  subscribeAiSync,
} from "@/lib/ai/chat-cache";
import type {
  AiConversationSummary,
  AiFolderSummary,
  AiMessageRecord,
} from "@/lib/schemas/ai-history";
import {
  AiChatRequestSchema,
  GenerateAiPlanRequestSchema,
  type AiStudioMode,
} from "@/lib/schemas/ai-plans";
import type { CreateCustomPlanTemplateInput } from "@/lib/schemas/plans";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AiHistorySidebar } from "@/components/plans/ai-history-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LumaIcon } from "@/components/ui/luma-icon";
import { TabsBar } from "@/components/ui/tabs-bar";
import { Textarea } from "@/components/ui/textarea";
import {
  convertMarkdownToTipTapHtml,
  stripMarkdownForSnippet,
} from "@/lib/ai/markdown-to-html";
import { cn } from "@/lib/utils";

export type AiPlanStudioProps = {
  userId: string;
  activeTrackerCanon: BibleCanon;
  initialMode?: AiStudioMode;
  initialConversationId?: string | null;
  initialPrompt?: string;
  initialFolders?: AiFolderSummary[];
  initialConversations?: AiConversationSummary[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: string;
};

function buildConversationTitle({ prompt }: { prompt: string }): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 60) return cleaned;
  return `${cleaned.slice(0, 57)}...`;
}

const MODE_CONFIG: Record<
  AiStudioMode,
  {
    label: string;
    cardDescription: string;
    heading: string;
    subtitle: string;
    placeholder: string;
    refinePlaceholder?: string;
  }
> = {
  plan: {
    label: "Plan Generator",
    cardDescription: "Build 1–365 day chapter or verse-based reading plans.",
    heading: "Build any Bible reading plan",
    subtitle:
      "Describe your books, theme, timeframe (up to 365 days), and whether you want chapters or verse ranges.",
    placeholder:
      'Describe your reading plan (e.g. "1-year whole Bible" or "30-day Psalms by verse")...',
    refinePlaceholder:
      "Ask for adjustments (e.g. 'Make it 180 days', 'Split into verse ranges', or 'Add Proverbs')...",
  },
  chat: {
    label: "Conversational",
    cardDescription:
      "Explain passages, explore context, or prepare group study questions.",
    heading: "Ask anything about Scripture",
    subtitle:
      "Explore verse meaning, historical context, word studies, or fellowship discussion questions.",
    placeholder:
      'Ask about a passage or study topic (e.g. "Explain Romans 8:28–30" or "Hebrews 11 group questions")...',
  },
};

function summarizePlanForRefinement({
  plan,
}: {
  plan: CreateCustomPlanTemplateInput;
}): string {
  const sectionSummary = (plan.sections ?? [])
    .map((s) => `${s.title} (${s.booksDescription ?? `${s.chaptersCount} ch`})`)
    .join("; ");
  return `Title: ${plan.title} | Days: ${plan.targetDays} | Chapters: ${plan.totalChapters} | Sections: ${sectionSummary}`;
}

function recalculatePlanMetrics({
  plan,
}: {
  plan: CreateCustomPlanTemplateInput;
}): CreateCustomPlanTemplateInput {
  const readings = plan.readings.map((item, idx) => ({
    ...item,
    order: idx + 1,
  }));
  const maxDay = readings.reduce(
    (max, item) => Math.max(max, item.dayNumber ?? 1),
    1
  );
  const totalChapters = Math.max(1, readings.length);
  const targetDays = Math.max(1, Math.min(365, maxDay));
  const defaultDailyTarget = Math.max(1, Math.ceil(totalChapters / targetDays));

  return {
    ...plan,
    readings,
    totalChapters,
    targetDays,
    defaultDailyTarget,
  };
}

export function AiPlanStudio({
  userId,
  activeTrackerCanon,
  initialMode = "chat",
  initialConversationId = null,
  initialPrompt,
  initialFolders = [],
  initialConversations = [],
}: AiPlanStudioProps) {
  const router = useRouter();
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [isSaving, startSaving] = useTransition();
  const isBusy = isPlanGenerating || streamingMessageId !== null;
  const planRunIdRef = useRef(0);
  const streamAbortRef = useRef<AbortController | null>(null);

  const [mode, setMode] = useQueryState(
    "mode",
    parseAsStringLiteral(["plan", "chat"] as const)
      .withDefault(initialMode)
      .withOptions({ clearOnDefault: false })
  );
  const [chatId, setChatId] = useQueryState(
    "chat",
    parseAsString.withOptions({ clearOnDefault: true })
  );
  const activeChatId = chatId ?? initialConversationId ?? null;

  const [folders, setFolders] = useState<AiFolderSummary[]>(initialFolders);
  const [conversations, setConversations] =
    useState<AiConversationSummary[]>(initialConversations);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [mobilePane, setMobilePane] = useState<"chat" | "plan">("chat");
  const [editorTab, setEditorTab] = useState<"sections" | "schedule">(
    "sections"
  );
  const [messagesByMode, setMessagesByMode] = useState<
    Record<AiStudioMode, ChatMessage[]>
  >({
    plan: [],
    chat: [],
  });
  const [plan, setPlan] = useState<CreateCustomPlanTemplateInput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPromptByMode, setLastFailedPromptByMode] = useState<
    Record<AiStudioMode, string | null>
  >({
    plan: null,
    chat: null,
  });
  const [scheduleQuery, setScheduleQuery] = useState("");

  const messages = messagesByMode[mode];
  const modeInfo = MODE_CONFIG[mode];

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Prefill composer when navigated via "Ask Luma AI" from Bible Reader (?prompt=...)
  useEffect(() => {
    if (!initialPrompt || !promptInputRef.current) return;
    const el = promptInputRef.current;
    el.value = initialPrompt;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    el.focus();
  }, [initialPrompt]);

  // Cache initial sidebar metadata and subscribe to cross-tab BroadcastChannel updates
  useEffect(() => {
    void putCachedSidebar({ userId, folders, conversations });
  }, [userId, folders, conversations]);

  useEffect(() => {
    return subscribeAiSync({
      onMessage: (payload) => {
        if (payload.userId !== userId) return;
        void (async () => {
          const refreshed = await getAiSidebarDataAction();
          if (refreshed.success) {
            setFolders(refreshed.folders);
            setConversations(refreshed.conversations);
          }
        })();
      },
    });
  }, [userId]);

  // Load conversation from IndexedDB immediately (SWR), then delta-sync from Postgres
  useEffect(() => {
    if (!activeChatId) return;
    let cancelled = false;

    void (async () => {
      const [cachedConv, cachedDraft] = await Promise.all([
        getCachedConversation({ conversationId: activeChatId, userId }),
        getCachedDraft({ userId, scopeId: activeChatId }),
      ]);

      if (cancelled) return;

      if (cachedConv) {
        void setMode(cachedConv.mode);
        setMessagesByMode((prev) => ({
          ...prev,
          [cachedConv.mode]: cachedConv.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            ...(m.meta ? { meta: m.meta } : {}),
          })),
        }));
      }

      if (cachedDraft?.planDraft) {
        setPlan(cachedDraft.planDraft);
      } else if (cachedConv?.mode === "chat") {
        setPlan(null);
      }

      try {
        const afterSeq = cachedConv?.lastSequence ?? 0;
        const params = new URLSearchParams({ afterSeq: String(afterSeq) });
        if (cachedConv?.updatedAt) {
          params.set("knownUpdatedAt", cachedConv.updatedAt);
        }

        const res = await fetch(
          `/api/ai/conversations/${encodeURIComponent(activeChatId)}/sync?${params.toString()}`
        );

        if (cancelled) return;

        if (res.status === 404) {
          await deleteCachedConversation({ conversationId: activeChatId });
          void setChatId(null);
          return;
        }

        if (!res.ok) return;

        const data = (await res.json()) as
          | { unchanged: true; updatedAt: string }
          | {
              unchanged: false;
              conversation: AiConversationSummary;
              messages: AiMessageRecord[];
            };

        if (cancelled || data.unchanged) return;

        const merged = mergeConversationMessages({
          localMessages: cachedConv?.messages ?? [],
          remoteMessages: data.messages,
        });
        const conv = data.conversation;

        void setMode(conv.mode);
        setMessagesByMode((prev) => ({
          ...prev,
          [conv.mode]: merged.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            ...(m.meta ? { meta: m.meta } : {}),
          })),
        }));

        await putCachedConversation({
          record: {
            id: conv.id,
            userId,
            title: conv.title,
            mode: conv.mode,
            folderId: conv.folderId,
            updatedAt: conv.updatedAt,
            lastSequence: conv.lastMessageSequence,
            messages: merged,
          },
        });
      } catch {
        // Keep cached conversation if offline / transient error
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeChatId, userId, setChatId, setMode]);

  // Persist Plan Blueprint working draft strictly in IndexedDB (never Postgres)
  useEffect(() => {
    if (!plan) return;
    const scopeId = activeChatId ?? "new:plan";
    void putCachedDraft({ userId, scopeId, planDraft: plan });
  }, [plan, activeChatId, userId]);

  const groupedSchedule = useMemo(() => {
    if (!plan) return [];
    const byDay = new Map<
      number,
      Array<{
        index: number;
        item: CreateCustomPlanTemplateInput["readings"][number];
      }>
    >();

    plan.readings.forEach((item, index) => {
      const day = item.dayNumber ?? 1;
      const list = byDay.get(day) ?? [];
      list.push({ index, item });
      byDay.set(day, list);
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a - b)
      .map(([dayNumber, entries]) => ({ dayNumber, entries }));
  }, [plan]);

  const filteredSchedule = useMemo(() => {
    const q = scheduleQuery.trim().toLowerCase();
    if (!q) return groupedSchedule;
    return groupedSchedule.filter(
      (group) =>
        `day ${group.dayNumber}`.includes(q) ||
        group.entries.some((entry) =>
          (
            entry.item.displayText ??
            `${entry.item.bookName} ${entry.item.chapter}`
          )
            .toLowerCase()
            .includes(q)
        )
    );
  }, [groupedSchedule, scheduleQuery]);

  const persistTurn = async ({
    turnMode,
    userContent,
    assistantContent,
    provider,
    titleHint,
  }: {
    turnMode: AiStudioMode;
    userContent: string;
    assistantContent: string;
    provider?: string;
    titleHint?: string;
  }) => {
    let targetConversationId = activeChatId;
    if (!targetConversationId) {
      const created = await createAiConversationAction({
        mode: turnMode,
        canon: activeTrackerCanon,
        title: titleHint ?? buildConversationTitle({ prompt: userContent }),
      });
      if (!created.success) return;
      targetConversationId = created.conversation.id;
      void setChatId(targetConversationId);
    }

    const appended = await appendAiTurnAction({
      conversationId: targetConversationId,
      userContent,
      assistantContent,
      ...(provider ? { provider } : {}),
    });

    if (!appended.success) return;

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === appended.conversation.id);
      const next = exists
        ? prev.map((c) =>
            c.id === appended.conversation.id ? appended.conversation : c
          )
        : [appended.conversation, ...prev];
      return next;
    });

    const cached = await getCachedConversation({
      conversationId: appended.conversation.id,
      userId,
    });
    const merged = mergeConversationMessages({
      localMessages: cached?.messages ?? [],
      remoteMessages: appended.messages,
    });

    await putCachedConversation({
      record: {
        id: appended.conversation.id,
        userId,
        title: appended.conversation.title,
        mode: appended.conversation.mode,
        folderId: appended.conversation.folderId,
        updatedAt: appended.conversation.updatedAt,
        lastSequence: appended.conversation.lastMessageSequence,
        messages: merged,
      },
    });
    broadcastAiSync({
      type: "conversation-updated",
      userId,
      conversationId: appended.conversation.id,
    });
  };

  const submitPrompt = ({
    promptText,
    isRetry = false,
  }: {
    promptText: string;
    isRetry?: boolean;
  }) => {
    if (isBusy || isSaving) return;

    if (mode === "plan") {
      const parsed = v.safeParse(GenerateAiPlanRequestSchema, {
        prompt: promptText,
        canon: activeTrackerCanon,
        previousContext: plan
          ? summarizePlanForRefinement({ plan })
          : undefined,
      });

      if (!parsed.success) {
        setErrorMessage(
          parsed.issues[0]?.message ?? "Please check your prompt."
        );
        return;
      }

      setErrorMessage(null);
      setLastFailedPromptByMode((prev) => ({ ...prev, plan: null }));
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: parsed.output.prompt,
      };
      setMessagesByMode((prev) => {
        const cleaned = isRetry
          ? prev.plan.filter((m) => !m.id.startsWith("a-err-"))
          : prev.plan;
        const alreadyHasUserMsg =
          isRetry &&
          cleaned[cleaned.length - 1]?.role === "user" &&
          cleaned[cleaned.length - 1]?.content === parsed.output.prompt;
        return {
          ...prev,
          plan: alreadyHasUserMsg ? cleaned : [...cleaned, userMsg],
        };
      });
      if (!isRetry && promptInputRef.current) {
        promptInputRef.current.value = "";
        promptInputRef.current.style.height = "auto";
        promptInputRef.current.style.overflowY = "hidden";
      }

      const runId = planRunIdRef.current + 1;
      planRunIdRef.current = runId;
      setIsPlanGenerating(true);

      void (async () => {
        try {
          const result = await generateAiPlanAction(parsed.output);
          if (planRunIdRef.current !== runId) return;

          if (!result.success) {
            setErrorMessage(result.error);
            if (!result.isRateLimited) {
              setLastFailedPromptByMode((prev) => ({
                ...prev,
                plan: parsed.output.prompt,
              }));
            }
            setMessagesByMode((prev) => ({
              ...prev,
              plan: [
                ...prev.plan,
                {
                  id: `a-err-${Date.now()}`,
                  role: "assistant",
                  content: result.error,
                },
              ],
            }));
            return;
          }

          const assistantText = `Generated "${result.plan.title}" (${result.plan.totalChapters} chapters across ${result.plan.targetDays} days, ~${result.plan.defaultDailyTarget} ch/day). Edit sections or days on the right, or ask me to refine it.`;
          setPlan(result.plan);
          setMessagesByMode((prev) => ({
            ...prev,
            plan: [
              ...prev.plan,
              {
                id: `a-${Date.now()}`,
                role: "assistant",
                content: assistantText,
                meta: result.provider,
              },
            ],
          }));

          await persistTurn({
            turnMode: "plan",
            userContent: parsed.output.prompt,
            assistantContent: assistantText,
            provider: result.provider,
            titleHint: result.plan.title,
          });
        } finally {
          if (planRunIdRef.current === runId) {
            setIsPlanGenerating(false);
          }
        }
      })();
      return;
    }

    const baseMessages =
      isRetry &&
      messages[messages.length - 1]?.role === "user" &&
      messages[messages.length - 1]?.content === promptText.trim()
        ? messages.map((m) => ({ role: m.role, content: m.content }))
        : [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: promptText },
          ];
    const parsedChat = v.safeParse(AiChatRequestSchema, {
      mode,
      messages: baseMessages,
      canon: activeTrackerCanon,
    });

    if (!parsedChat.success) {
      setErrorMessage(
        parsedChat.issues[0]?.message ?? "Please enter a question or passage."
      );
      return;
    }

    const activeMode = mode;
    const trimmedPrompt = promptText.trim();
    const now = Date.now();
    const userMsg: ChatMessage = {
      id: `u-${now}`,
      role: "user",
      content: trimmedPrompt,
    };
    const assistantId = `a-${now}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setErrorMessage(null);
    setLastFailedPromptByMode((prev) => ({ ...prev, [activeMode]: null }));
    setStreamingMessageId(assistantId);
    setMessagesByMode((prev) => {
      const current = prev[activeMode];
      const alreadyHasUserMsg =
        isRetry &&
        current[current.length - 1]?.role === "user" &&
        current[current.length - 1]?.content === trimmedPrompt;
      return {
        ...prev,
        [activeMode]: alreadyHasUserMsg
          ? [...current, assistantPlaceholder]
          : [...current, userMsg, assistantPlaceholder],
      };
    });
    if (!isRetry && promptInputRef.current) {
      promptInputRef.current.value = "";
      promptInputRef.current.style.height = "auto";
      promptInputRef.current.style.overflowY = "hidden";
    }
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
      });
    }

    const controller = new AbortController();
    streamAbortRef.current = controller;

    void (async () => {
      let accumulated = "";
      let providerHeader: string | undefined;
      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedChat.output),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          let errorText = "Failed to get a response from Luma AI.";
          let isRateLimited = response.status === 429;
          try {
            const errorJson = (await response.json()) as {
              error?: unknown;
              code?: unknown;
            };
            if (typeof errorJson.error === "string" && errorJson.error.trim()) {
              errorText = errorJson.error;
            }
            if (errorJson.code === "RATE_LIMITED") {
              isRateLimited = true;
            }
          } catch {
            // Keep default error message when body isn't JSON
          }
          setErrorMessage(errorText);
          if (!isRateLimited) {
            setLastFailedPromptByMode((prev) => ({
              ...prev,
              [activeMode]: trimmedPrompt,
            }));
          }
          setMessagesByMode((prev) => ({
            ...prev,
            [activeMode]: prev[activeMode].filter((m) => m.id !== assistantId),
          }));
          return;
        }

        providerHeader = response.headers.get("X-AI-Provider") ?? undefined;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const snapshot = accumulated;
          setMessagesByMode((prev) => ({
            ...prev,
            [activeMode]: prev[activeMode].map((m) =>
              m.id === assistantId ? { ...m, content: snapshot } : m
            ),
          }));
        }

        const trailing = decoder.decode();
        if (trailing) {
          accumulated += trailing;
        }

        const finalContent = accumulated.trim();
        if (!finalContent) {
          setErrorMessage("AI returned an empty response. Please try again.");
          setLastFailedPromptByMode((prev) => ({
            ...prev,
            [activeMode]: trimmedPrompt,
          }));
          setMessagesByMode((prev) => ({
            ...prev,
            [activeMode]: prev[activeMode].filter((m) => m.id !== assistantId),
          }));
          return;
        }

        setMessagesByMode((prev) => ({
          ...prev,
          [activeMode]: prev[activeMode].map((m) =>
            m.id === assistantId
              ? { ...m, content: finalContent, meta: providerHeader }
              : m
          ),
        }));

        await persistTurn({
          turnMode: activeMode,
          userContent: trimmedPrompt,
          assistantContent: finalContent,
          provider: providerHeader,
        });
      } catch (err: unknown) {
        const isAborted =
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError");
        if (isAborted) {
          const partial = accumulated.trim();
          if (!partial) {
            setMessagesByMode((prev) => ({
              ...prev,
              [activeMode]: prev[activeMode].filter(
                (m) => m.id !== assistantId
              ),
            }));
          } else {
            await persistTurn({
              turnMode: activeMode,
              userContent: trimmedPrompt,
              assistantContent: partial,
              provider: providerHeader,
            });
          }
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Connection interrupted while streaming.";
        setErrorMessage(message);
        setLastFailedPromptByMode((prev) => ({
          ...prev,
          [activeMode]: trimmedPrompt,
        }));
        setMessagesByMode((prev) => ({
          ...prev,
          [activeMode]: prev[activeMode].filter(
            (m) => m.id !== assistantId || m.content.trim().length > 0
          ),
        }));
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
        setStreamingMessageId(null);
      }
    })();
  };

  const handleChatSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawPrompt = formData.get("prompt");
    const promptText = typeof rawPrompt === "string" ? rawPrompt : "";
    submitPrompt({ promptText, isRetry: false });
  };

  const handleMoveSection = ({
    index,
    direction,
  }: {
    index: number;
    direction: -1 | 1;
  }) => {
    setPlan((prev) => {
      if (!prev?.sections) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.sections.length) return prev;
      const nextSections = [...prev.sections];
      const current = nextSections[index];
      const swap = nextSections[targetIndex];
      if (!current || !swap) return prev;
      nextSections[index] = swap;
      nextSections[targetIndex] = current;
      return { ...prev, sections: nextSections };
    });
  };

  const handleRenameSection = ({
    index,
    title,
  }: {
    index: number;
    title: string;
  }) => {
    setPlan((prev) => {
      if (!prev?.sections) return prev;
      const nextSections = prev.sections.map((s, idx) =>
        idx === index ? { ...s, title } : s
      );
      return { ...prev, sections: nextSections };
    });
  };

  const handleDeleteSection = ({ index }: { index: number }) => {
    setPlan((prev) => {
      if (!prev?.sections) return prev;
      const nextSections = prev.sections.filter((_, idx) => idx !== index);
      return { ...prev, sections: nextSections };
    });
  };

  const handleMoveReadingDay = ({
    readingIndex,
    delta,
  }: {
    readingIndex: number;
    delta: -1 | 1;
  }) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const nextReadings = prev.readings.map((item, idx) => {
        if (idx !== readingIndex) return item;
        const nextDay = Math.max(
          1,
          Math.min(365, (item.dayNumber ?? 1) + delta)
        );
        return { ...item, dayNumber: nextDay };
      });
      return recalculatePlanMetrics({
        plan: { ...prev, readings: nextReadings },
      });
    });
  };

  const handleSwapReadingOrder = ({
    indexA,
    indexB,
  }: {
    indexA: number;
    indexB: number;
  }) => {
    setPlan((prev) => {
      if (!prev) return prev;
      if (
        indexA < 0 ||
        indexB < 0 ||
        indexA >= prev.readings.length ||
        indexB >= prev.readings.length
      ) {
        return prev;
      }
      const nextReadings = [...prev.readings];
      const a = nextReadings[indexA];
      const b = nextReadings[indexB];
      if (!a || !b) return prev;
      nextReadings[indexA] = b;
      nextReadings[indexB] = a;
      return recalculatePlanMetrics({
        plan: { ...prev, readings: nextReadings },
      });
    });
  };

  const handleDeleteReading = ({ readingIndex }: { readingIndex: number }) => {
    setPlan((prev) => {
      if (!prev || prev.readings.length <= 1) {
        toast.error("A plan must keep at least 1 chapter.");
        return prev;
      }
      const nextReadings = prev.readings.filter(
        (_, idx) => idx !== readingIndex
      );
      return recalculatePlanMetrics({
        plan: { ...prev, readings: nextReadings },
      });
    });
  };

  const handleSavePlan = () => {
    if (!plan || isSaving || isPlanGenerating) return;
    if (!plan.title.trim()) {
      toast.error("Plan title cannot be empty.");
      return;
    }

    startSaving(async () => {
      const result = await createCustomPlanTemplateAction({
        template: {
          ...plan,
          title: plan.title.trim(),
          subtitle: plan.subtitle?.trim(),
          description: plan.description?.trim(),
        },
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("AI reading plan saved to your catalog");
      router.push("/plans");
      router.refresh();
    });
  };

  const composerForm = (
    <form onSubmit={handleChatSubmit} className="w-full space-y-2">
      <div className="rounded-3xl border border-border bg-card px-4 py-2.5 shadow-xs transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary space-y-1.5">
        <Textarea
          ref={promptInputRef}
          name="prompt"
          rows={1}
          maxLength={600}
          placeholder={
            mode === "plan" && plan && modeInfo.refinePlaceholder
              ? modeInfo.refinePlaceholder
              : modeInfo.placeholder
          }
          aria-label="Luma AI prompt"
          disabled={isBusy}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            const nextHeight = Math.min(el.scrollHeight, 180);
            el.style.height = `${nextHeight}px`;
            el.style.overflowY = el.scrollHeight > 180 ? "auto" : "hidden";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="min-h-[24px] max-h-[180px] w-full resize-none overflow-hidden luma-thin-scroll border-0 bg-transparent px-0 py-1 text-base leading-6 shadow-none focus-visible:ring-0 focus-visible:border-0"
        />

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
            {mode === "plan" ? (
              <Calendar className="size-3.5 text-primary" />
            ) : (
              <MessageSquare className="size-3.5 text-primary" />
            )}
            <span>{modeInfo.label}</span>
          </span>

          {isBusy ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                planRunIdRef.current += 1;
                setIsPlanGenerating(false);
                streamAbortRef.current?.abort();
              }}
              aria-label="Stop generating"
              title="Stop generating"
              className="size-8 rounded-full p-0 shrink-0"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              aria-label="Send prompt"
              className="size-8 rounded-full p-0 shrink-0"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          {lastFailedPromptByMode[mode] ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                const retryPrompt = lastFailedPromptByMode[mode];
                if (!retryPrompt) return;
                submitPrompt({ promptText: retryPrompt, isRetry: true });
              }}
              className="h-7 shrink-0 gap-1 border-destructive/30 bg-background/80 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="size-3" />
              <span>Retry</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );

  const handleNewChat = () => {
    void setChatId(null);
    setMessagesByMode({ plan: [], chat: [] });
    setPlan(null);
    setErrorMessage(null);
    setLastFailedPromptByMode({ plan: null, chat: null });
  };

  const handleSelectConversation = ({
    conversation,
  }: {
    conversation: AiConversationSummary;
  }) => {
    setErrorMessage(null);
    void setMode(conversation.mode);
    void setChatId(conversation.id);
  };

  const handleCreateFolder = async ({ name }: { name: string }) => {
    const res = await createAiFolderAction({ name });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setFolders((prev) => [...prev, res.folder]);
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleRenameFolder = async ({
    folderId,
    name,
  }: {
    folderId: string;
    name: string;
  }) => {
    const res = await renameAiFolderAction({ folderId, name });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === folderId ? res.folder : f)));
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleDeleteFolder = async ({ folderId }: { folderId: string }) => {
    const res = await deleteAiFolderAction({ folderId });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setConversations((prev) =>
      prev.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c))
    );
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleToggleFolderPin = async ({ folderId }: { folderId: string }) => {
    const res = await toggleAiFolderPinAction({ folderId });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setFolders((prev) => prev.map((f) => (f.id === folderId ? res.folder : f)));
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleRenameConversation = async ({
    conversationId,
    title,
  }: {
    conversationId: string;
    title: string;
  }) => {
    const res = await updateAiConversationAction({ conversationId, title });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? res.conversation : c))
    );
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleMoveConversation = async ({
    conversationId,
    folderId,
  }: {
    conversationId: string;
    folderId: string | null;
  }) => {
    const res = await updateAiConversationAction({ conversationId, folderId });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? res.conversation : c))
    );
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleToggleConversationPin = async ({
    conversationId,
    isPinned,
  }: {
    conversationId: string;
    isPinned: boolean;
  }) => {
    const res = await updateAiConversationAction({ conversationId, isPinned });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? res.conversation : c))
    );
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleToggleConversationArchive = async ({
    conversationId,
    isArchived,
  }: {
    conversationId: string;
    isArchived: boolean;
  }) => {
    const res = await updateAiConversationAction({
      conversationId,
      isArchived,
    });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? res.conversation : c))
    );
    if (isArchived && activeChatId === conversationId) {
      handleNewChat();
    }
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const handleSaveMessageToNotes = async ({ content }: { content: string }) => {
    const activeConv = activeChatId
      ? conversations.find((c) => c.id === activeChatId)
      : undefined;
    const title = activeConv?.title
      ? `${activeConv.title} (Luma AI)`
      : "Luma AI Study Note";
    const bodyHtml = convertMarkdownToTipTapHtml({ markdown: content });
    const plainTextSnippet = stripMarkdownForSnippet({ markdown: content });

    const res = await createNoteAction({
      title,
      bodyHtml,
      plainTextSnippet,
    });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("Saved to Notes", {
      action: {
        label: "Open Notes",
        onClick: () => router.push("/notes"),
      },
    });
  };

  const handleDeleteConversation = async ({
    conversationId,
  }: {
    conversationId: string;
  }) => {
    const res = await deleteAiConversationAction({ conversationId });
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    await deleteCachedConversation({ conversationId });
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeChatId === conversationId) {
      handleNewChat();
    }
    broadcastAiSync({ type: "sidebar-updated", userId });
  };

  const isEmptyState =
    messages.length === 0 && (mode !== "plan" || plan === null);

  return (
    <div className="flex items-start gap-5">
      <AiHistorySidebar
        folders={folders}
        conversations={conversations}
        activeConversationId={activeChatId}
        isDesktopOpen={isDesktopSidebarOpen}
        isMobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onToggleFolderPin={handleToggleFolderPin}
        onRenameConversation={handleRenameConversation}
        onMoveConversation={handleMoveConversation}
        onToggleConversationPin={handleToggleConversationPin}
        onToggleConversationArchive={handleToggleConversationArchive}
        onDeleteConversation={handleDeleteConversation}
      />

      <div
        className={cn(
          "flex-1 min-w-0 space-y-4",
          isDesktopSidebarOpen && "lg:pl-64"
        )}
      >
        {/* Top Studio Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Toggle chat history"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setIsMobileSidebarOpen((prev) => !prev);
                } else {
                  setIsDesktopSidebarOpen((prev) => !prev);
                }
              }}
              className="size-9 rounded-xl p-0 shrink-0"
            >
              <PanelLeft className="size-4" />
            </Button>
            <Link
              href="/plans"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Plans</span>
            </Link>
            <div className="min-w-0 flex items-center gap-2">
              <LumaIcon className="size-4 shrink-0" size={16} />
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                Luma AI
              </h1>
              <span className="hidden sm:inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                {activeTrackerCanon.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEmptyState ? (
              <div
                role="radiogroup"
                aria-label="AI mode"
                className="inline-flex items-center rounded-xl border border-border bg-card p-1"
              >
                {(["plan", "chat"] as const).map((modeKey) => {
                  const isSelected = mode === modeKey;
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isBusy}
                      onClick={() => {
                        void setMode(modeKey);
                        setErrorMessage(null);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {modeKey === "plan" ? (
                        <Calendar className="size-3.5" />
                      ) : (
                        <MessageSquare className="size-3.5" />
                      )}
                      <span>{MODE_CONFIG[modeKey].label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {mode === "plan" && plan ? (
              <Button
                type="button"
                size="sm"
                disabled={isSaving || isPlanGenerating}
                onClick={handleSavePlan}
                className="gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    <span>Save to Catalog</span>
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {isEmptyState ? (
          <div className="mx-auto flex min-h-[calc(100dvh-16rem)] w-full max-w-2xl flex-col items-center justify-center py-8 space-y-6">
            <div className="space-y-2.5 text-center">
              <div className="mx-auto inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LumaIcon className="size-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {modeInfo.heading}
              </h2>
              <p className="mx-auto max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground">
                {modeInfo.subtitle}
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="AI mode"
              className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {(["plan", "chat"] as const).map((modeKey) => {
                const cfg = MODE_CONFIG[modeKey];
                const isSelected = mode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isBusy}
                    onClick={() => {
                      void setMode(modeKey);
                      setErrorMessage(null);
                    }}
                    className={cn(
                      "flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-border-strong hover:bg-surface-elevated"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {modeKey === "plan" ? (
                        <Calendar className="size-5" />
                      ) : (
                        <MessageSquare className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-semibold text-foreground">
                        {cfg.label}
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {cfg.cardDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {composerForm}

            <p className="text-[11px] text-muted-foreground text-center">
              Enter to send • Shift+Enter for new line
            </p>
          </div>
        ) : mode !== "plan" ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            <div className="flex-1 space-y-6 py-4 pb-44 lg:pb-36">
              {messages.map((msg) => {
                const isStreamingThis = msg.id === streamingMessageId;
                return (
                  <Message key={msg.id} from={msg.role}>
                    <MessageContent
                      className={
                        msg.role === "user"
                          ? "rounded-2xl bg-secondary px-4 py-2.5 text-base leading-relaxed"
                          : "w-full text-base leading-7"
                      }
                    >
                      {msg.role === "assistant" ? (
                        isStreamingThis && msg.content.length === 0 ? (
                          <Shimmer className="text-base">Thinking...</Shimmer>
                        ) : (
                          <MessageResponse isAnimating={isStreamingThis}>
                            {msg.content}
                          </MessageResponse>
                        )
                      ) : (
                        <span className="whitespace-pre-wrap">
                          {msg.content}
                        </span>
                      )}
                    </MessageContent>
                    {msg.role === "assistant" && !isStreamingThis ? (
                      <MessageActions className="mt-0.5">
                        <MessageAction
                          tooltip="Copy response"
                          label="Copy response"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(msg.content);
                              toast.success("Copied response");
                            } catch {
                              toast.error("Couldn't copy response");
                            }
                          }}
                        >
                          <Copy className="size-3.5 text-muted-foreground" />
                        </MessageAction>
                        <MessageAction
                          tooltip="Save to Notes"
                          label="Save to Notes"
                          onClick={() =>
                            void handleSaveMessageToNotes({
                              content: msg.content,
                            })
                          }
                        >
                          <FileText className="size-3.5 text-muted-foreground" />
                        </MessageAction>
                        {msg.meta ? (
                          <span className="px-1 text-[11px] text-muted-foreground">
                            {msg.meta}
                          </span>
                        ) : null}
                      </MessageActions>
                    ) : null}
                  </Message>
                );
              })}
            </div>

            <div
              className={cn(
                "fixed inset-x-0 bottom-[4.75rem] lg:bottom-0 z-30 lg:left-72 pointer-events-none",
                isDesktopSidebarOpen && "lg:pl-64"
              )}
            >
              <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 lg:px-8 pb-3 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-auto">
                {composerForm}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Pane Switcher */}
            <div className="lg:hidden">
              <TabsBar
                activeTab={mobilePane}
                onTabChange={({ tab }) => setMobilePane(tab)}
                className="w-full grid grid-cols-2"
                tabs={[
                  {
                    id: "chat",
                    label: "AI Chat",
                    icon: <MessageSquare className="size-3.5" />,
                  },
                  {
                    id: "plan",
                    label: "Plan Editor",
                    icon: <BookOpen className="size-3.5" />,
                    count: plan ? plan.targetDays : undefined,
                  },
                ]}
              />
            </div>

            {/* Main Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[calc(100dvh-13rem)] min-h-[560px]">
              {/* Left: Chat Pane */}
              <section
                className={cn(
                  "lg:col-span-5 flex flex-col rounded-2xl border border-border bg-card shadow-xs overflow-hidden",
                  mobilePane === "chat"
                    ? "flex h-[calc(100dvh-16rem)] lg:h-full"
                    : "hidden lg:flex lg:h-full"
                )}
              >
                <div className="flex-1 overflow-y-auto luma-thin-scroll p-4 sm:p-5 space-y-3.5">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-1 max-w-[90%]",
                        msg.role === "user"
                          ? "ml-auto items-end"
                          : "mr-auto items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 text-sm sm:text-base leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "border border-border bg-surface-elevated text-foreground rounded-bl-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                      {msg.meta ? (
                        <span className="px-1 text-[10px] text-muted-foreground">
                          {msg.meta}
                        </span>
                      ) : null}
                    </div>
                  ))}

                  {isPlanGenerating ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-xs text-muted-foreground w-fit">
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Designing your reading plan...</span>
                    </div>
                  ) : null}

                  {plan && mobilePane === "chat" ? (
                    <div className="lg:hidden pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMobilePane("plan")}
                        className="w-full gap-1.5"
                      >
                        <BookOpen className="size-3.5 text-primary" />
                        <span>Open Plan Editor ({plan.targetDays} days)</span>
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-border/80 bg-background/50 p-3">
                  {composerForm}
                </div>
              </section>

              {/* Right: Editorial Plan Blueprint & Schedule */}
              <section
                className={cn(
                  "lg:col-span-7 flex flex-col rounded-2xl border border-border bg-card shadow-xs overflow-hidden",
                  mobilePane === "plan"
                    ? "flex h-[calc(100dvh-16rem)] lg:h-full"
                    : "hidden lg:flex lg:h-full"
                )}
              >
                {!plan ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-primary">
                      <Layers className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        Plan Blueprint & Schedule
                      </p>
                      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                        Your generated plan will open here. You can edit the
                        title, reorder or rename sections, and adjust individual
                        days before saving.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Editorial Plan Header */}
                    <div className="border-b border-border/80 bg-surface-elevated/40 px-5 py-4 space-y-3.5">
                      <div className="space-y-1">
                        <input
                          value={plan.title}
                          onChange={(e) =>
                            setPlan((prev) =>
                              prev ? { ...prev, title: e.target.value } : prev
                            )
                          }
                          aria-label="Plan title"
                          placeholder="Untitled Reading Plan"
                          className="w-full bg-transparent text-lg sm:text-xl font-bold tracking-tight text-foreground border-b border-transparent focus:border-primary focus:outline-none pb-0.5 transition-colors"
                        />
                        <input
                          value={plan.subtitle ?? ""}
                          onChange={(e) =>
                            setPlan((prev) =>
                              prev
                                ? { ...prev, subtitle: e.target.value }
                                : prev
                            )
                          }
                          aria-label="Plan subtitle"
                          placeholder="Add a short subtitle..."
                          className="w-full bg-transparent text-xs sm:text-sm text-muted-foreground border-b border-transparent focus:border-primary focus:outline-none pb-0.5 transition-colors"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground tabular-nums">
                            <Calendar className="size-3.5 text-primary" />
                            {plan.targetDays} days
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground tabular-nums">
                            <BookOpen className="size-3.5 text-primary" />
                            {plan.totalChapters} ch • ~{plan.defaultDailyTarget}
                            /day
                          </span>
                        </div>

                        <TabsBar
                          activeTab={editorTab}
                          onTabChange={({ tab }) => setEditorTab(tab)}
                          className="w-full sm:w-auto"
                          tabs={[
                            {
                              id: "sections",
                              label: "Sections",
                              count: plan.sections?.length ?? 0,
                            },
                            {
                              id: "schedule",
                              label: "Daily Schedule",
                              count: groupedSchedule.length,
                            },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto luma-thin-scroll p-4 sm:p-5">
                      {editorTab === "sections" ? (
                        <div className="space-y-3">
                          {!plan.sections || plan.sections.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                              No sections remaining. Switch to Daily Schedule to
                              edit chapters or ask the AI to regenerate
                              sections.
                            </div>
                          ) : (
                            plan.sections.map((section, idx) => (
                              <div
                                key={`${idx}-${section.chaptersCount}`}
                                className="group rounded-2xl border border-border bg-surface-elevated/50 p-3.5 transition-colors hover:border-border-strong"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold tabular-nums text-primary">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    <input
                                      value={section.title}
                                      onChange={(e) =>
                                        handleRenameSection({
                                          index: idx,
                                          title: e.target.value,
                                        })
                                      }
                                      aria-label={`Section ${idx + 1} title`}
                                      className="w-full bg-transparent text-sm font-bold text-foreground border-b border-transparent focus:border-primary focus:outline-none pb-0.5 transition-colors"
                                    />
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      {section.booksDescription ? (
                                        <span className="truncate">
                                          {section.booksDescription}
                                        </span>
                                      ) : null}
                                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                                        {section.chaptersCount} ch
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      aria-label={`Move section ${section.title} up`}
                                      title="Move section up"
                                      onClick={() =>
                                        handleMoveSection({
                                          index: idx,
                                          direction: -1,
                                        })
                                      }
                                      className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-35 transition-colors"
                                    >
                                      <ArrowUp className="size-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        idx === (plan.sections?.length ?? 0) - 1
                                      }
                                      aria-label={`Move section ${section.title} down`}
                                      title="Move section down"
                                      onClick={() =>
                                        handleMoveSection({
                                          index: idx,
                                          direction: 1,
                                        })
                                      }
                                      className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-35 transition-colors"
                                    >
                                      <ArrowDown className="size-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Delete section ${section.title}`}
                                      title="Remove section"
                                      onClick={() =>
                                        handleDeleteSection({ index: idx })
                                      }
                                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <Input
                            type="search"
                            value={scheduleQuery}
                            onChange={(e) => setScheduleQuery(e.target.value)}
                            startIcon={<Search className="size-3.5" />}
                            placeholder="Filter by day or book (e.g. Day 12, Psalms)..."
                            aria-label="Filter daily schedule"
                            className="h-9 text-xs"
                          />

                          <div className="space-y-3">
                            {filteredSchedule.map((group) => (
                              <div
                                key={group.dayNumber}
                                className="rounded-2xl border border-border bg-surface-elevated/40 p-3.5 space-y-2.5"
                              >
                                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary tabular-nums">
                                    <Calendar className="size-3.5" />
                                    Day {group.dayNumber}
                                  </span>
                                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                                    {group.entries.length}{" "}
                                    {group.entries.length === 1
                                      ? "chapter"
                                      : "chapters"}
                                  </span>
                                </div>

                                <div className="divide-y divide-border/50 rounded-xl border border-border/70 bg-card overflow-hidden">
                                  {group.entries.map(({ index, item }) => {
                                    const label =
                                      item.displayText ??
                                      `${item.bookName} ${item.chapter}`;
                                    return (
                                      <div
                                        key={`${index}-${item.bookId}-${item.chapter}`}
                                        className="flex items-center justify-between gap-2 px-3 py-2 transition-colors hover:bg-muted/30"
                                      >
                                        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                          {label}
                                        </span>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <div className="flex items-center rounded-lg border border-border/80 bg-background/60 p-0.5">
                                            <button
                                              type="button"
                                              disabled={group.dayNumber <= 1}
                                              aria-label={`Move ${label} to previous day`}
                                              title="Previous day"
                                              onClick={() =>
                                                handleMoveReadingDay({
                                                  readingIndex: index,
                                                  delta: -1,
                                                })
                                              }
                                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                            >
                                              <ChevronLeft className="size-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={group.dayNumber >= 365}
                                              aria-label={`Move ${label} to next day`}
                                              title="Next day"
                                              onClick={() =>
                                                handleMoveReadingDay({
                                                  readingIndex: index,
                                                  delta: 1,
                                                })
                                              }
                                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                            >
                                              <ChevronRight className="size-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={index === 0}
                                              aria-label={`Move ${label} earlier`}
                                              title="Move up"
                                              onClick={() =>
                                                handleSwapReadingOrder({
                                                  indexA: index,
                                                  indexB: index - 1,
                                                })
                                              }
                                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                            >
                                              <ArrowUp className="size-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              disabled={
                                                index ===
                                                plan.readings.length - 1
                                              }
                                              aria-label={`Move ${label} later`}
                                              title="Move down"
                                              onClick={() =>
                                                handleSwapReadingOrder({
                                                  indexA: index,
                                                  indexB: index + 1,
                                                })
                                              }
                                              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                            >
                                              <ArrowDown className="size-3.5" />
                                            </button>
                                          </div>

                                          <button
                                            type="button"
                                            aria-label={`Remove ${label}`}
                                            title="Remove chapter"
                                            onClick={() =>
                                              handleDeleteReading({
                                                readingIndex: index,
                                              })
                                            }
                                            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                          >
                                            <Trash2 className="size-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
