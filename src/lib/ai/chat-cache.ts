import type {
  AiConversationSummary,
  AiFolderSummary,
  AiMessageRecord,
} from "@/lib/schemas/ai-history";
import type { AiStudioMode } from "@/lib/schemas/ai-plans";
import type { CreateCustomPlanTemplateInput } from "@/lib/schemas/plans";

const DB_NAME = "luma-ai-cache";
const DB_VERSION = 1;
const STORE_SIDEBAR = "sidebar";
const STORE_CONVERSATIONS = "conversations";
const STORE_DRAFTS = "drafts";
const BROADCAST_CHANNEL = "luma-ai-sync";

export type CachedSidebarRecord = {
  userId: string;
  folders: AiFolderSummary[];
  conversations: AiConversationSummary[];
  fetchedAt: number;
};

export type CachedConversationRecord = {
  id: string;
  userId: string;
  title: string;
  mode: AiStudioMode;
  folderId: string | null;
  updatedAt: string;
  lastSequence: number;
  messages: AiMessageRecord[];
  fetchedAt: number;
};

export type CachedDraftRecord = {
  key: string;
  userId: string;
  composerText?: string;
  planDraft?: CreateCustomPlanTemplateInput | null;
  updatedAt: number;
};

function openAiCacheDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SIDEBAR)) {
          db.createObjectStore(STORE_SIDEBAR, { keyPath: "userId" });
        }
        if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
          const convStore = db.createObjectStore(STORE_CONVERSATIONS, {
            keyPath: "id",
          });
          convStore.createIndex("by_user", "userId", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          const draftStore = db.createObjectStore(STORE_DRAFTS, {
            keyPath: "key",
          });
          draftStore.createIndex("by_user", "userId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>({
  storeName,
  key,
}: {
  storeName: string;
  key: string;
}): Promise<T | null> {
  const db = await openAiCacheDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut<T>({
  storeName,
  value,
}: {
  storeName: string;
  value: T;
}): Promise<void> {
  const db = await openAiCacheDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbDelete({
  storeName,
  key,
}: {
  storeName: string;
  key: string;
}): Promise<void> {
  const db = await openAiCacheDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function getCachedSidebar({
  userId,
}: {
  userId: string;
}): Promise<CachedSidebarRecord | null> {
  return idbGet<CachedSidebarRecord>({
    storeName: STORE_SIDEBAR,
    key: userId,
  });
}

export async function putCachedSidebar({
  userId,
  folders,
  conversations,
}: {
  userId: string;
  folders: AiFolderSummary[];
  conversations: AiConversationSummary[];
}): Promise<void> {
  await idbPut<CachedSidebarRecord>({
    storeName: STORE_SIDEBAR,
    value: {
      userId,
      folders,
      conversations,
      fetchedAt: Date.now(),
    },
  });
}

export async function getCachedConversation({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}): Promise<CachedConversationRecord | null> {
  const record = await idbGet<CachedConversationRecord>({
    storeName: STORE_CONVERSATIONS,
    key: conversationId,
  });
  if (!record || record.userId !== userId) return null;
  return record;
}

export async function putCachedConversation({
  record,
}: {
  record: Omit<CachedConversationRecord, "fetchedAt">;
}): Promise<void> {
  await idbPut<CachedConversationRecord>({
    storeName: STORE_CONVERSATIONS,
    value: {
      ...record,
      fetchedAt: Date.now(),
    },
  });
}

export async function deleteCachedConversation({
  conversationId,
}: {
  conversationId: string;
}): Promise<void> {
  await idbDelete({ storeName: STORE_CONVERSATIONS, key: conversationId });
}

function makeDraftKey({
  userId,
  scopeId,
}: {
  userId: string;
  scopeId: string;
}): string {
  return `${userId}:${scopeId}`;
}

export function getCachedDraft({
  userId,
  scopeId,
}: {
  userId: string;
  scopeId: string;
}): Promise<CachedDraftRecord | null> {
  return idbGet<CachedDraftRecord>({
    storeName: STORE_DRAFTS,
    key: makeDraftKey({ userId, scopeId }),
  });
}

export async function putCachedDraft({
  userId,
  scopeId,
  composerText,
  planDraft,
}: {
  userId: string;
  scopeId: string;
  composerText?: string;
  planDraft?: CreateCustomPlanTemplateInput | null;
}): Promise<void> {
  const key = makeDraftKey({ userId, scopeId });
  const existing = await idbGet<CachedDraftRecord>({
    storeName: STORE_DRAFTS,
    key,
  });

  await idbPut<CachedDraftRecord>({
    storeName: STORE_DRAFTS,
    value: {
      key,
      userId,
      composerText:
        composerText !== undefined ? composerText : existing?.composerText,
      planDraft: planDraft !== undefined ? planDraft : existing?.planDraft,
      updatedAt: Date.now(),
    },
  });
}

export async function deleteCachedDraft({
  userId,
  scopeId,
}: {
  userId: string;
  scopeId: string;
}): Promise<void> {
  await idbDelete({
    storeName: STORE_DRAFTS,
    key: makeDraftKey({ userId, scopeId }),
  });
}

export function mergeConversationMessages({
  localMessages,
  remoteMessages,
}: {
  localMessages: ReadonlyArray<AiMessageRecord>;
  remoteMessages: ReadonlyArray<AiMessageRecord>;
}): AiMessageRecord[] {
  const bySeq = new Map<number, AiMessageRecord>();
  for (const msg of localMessages) {
    bySeq.set(msg.sequence, msg);
  }
  for (const msg of remoteMessages) {
    bySeq.set(msg.sequence, msg);
  }
  return Array.from(bySeq.values()).sort((a, b) => a.sequence - b.sequence);
}

export type AiSyncBroadcastPayload =
  | { type: "sidebar-updated"; userId: string }
  | { type: "conversation-updated"; userId: string; conversationId: string };

export function broadcastAiSync(payload: AiSyncBroadcastPayload): void {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // Ignore unsupported environments
  }
}

export function subscribeAiSync({
  onMessage,
}: {
  onMessage: (payload: AiSyncBroadcastPayload) => void;
}): () => void {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return () => {};
  }

  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    const handler = (event: MessageEvent<AiSyncBroadcastPayload>) => {
      if (event.data) {
        onMessage(event.data);
      }
    };
    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  } catch {
    return () => {};
  }
}
