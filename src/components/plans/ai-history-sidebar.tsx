"use client";

import { useMemo, useState, type FormEvent } from "react";
import * as v from "valibot";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CreateAiFolderSchema,
  type AiConversationSummary,
  type AiFolderSummary,
} from "@/lib/schemas/ai-history";
import { cn } from "@/lib/utils";

export type AiHistorySidebarProps = {
  folders: ReadonlyArray<AiFolderSummary>;
  conversations: ReadonlyArray<AiConversationSummary>;
  activeConversationId: string | null;
  isDesktopOpen: boolean;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onNewChat: () => void;
  onSelectConversation: (params: {
    conversation: AiConversationSummary;
  }) => void;
  onCreateFolder: (params: { name: string }) => Promise<void>;
  onRenameFolder: (params: { folderId: string; name: string }) => Promise<void>;
  onDeleteFolder: (params: { folderId: string }) => Promise<void>;
  onToggleFolderPin: (params: { folderId: string }) => Promise<void>;
  onRenameConversation: (params: {
    conversationId: string;
    title: string;
  }) => Promise<void>;
  onMoveConversation: (params: {
    conversationId: string;
    folderId: string | null;
  }) => Promise<void>;
  onToggleConversationPin: (params: {
    conversationId: string;
    isPinned: boolean;
  }) => Promise<void>;
  onDeleteConversation: (params: { conversationId: string }) => Promise<void>;
};

function groupConversationsByTime({
  conversations,
}: {
  conversations: ReadonlyArray<AiConversationSummary>;
}): Array<{ label: string; items: AiConversationSummary[] }> {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * oneDayMs;

  const pinned: AiConversationSummary[] = [];
  const today: AiConversationSummary[] = [];
  const previous7Days: AiConversationSummary[] = [];
  const older: AiConversationSummary[] = [];

  for (const conv of conversations) {
    if (conv.isPinned) {
      pinned.push(conv);
      continue;
    }
    const age = now - new Date(conv.updatedAt).getTime();
    if (age <= oneDayMs) {
      today.push(conv);
    } else if (age <= sevenDaysMs) {
      previous7Days.push(conv);
    } else {
      older.push(conv);
    }
  }

  return [
    { label: "Pinned", items: pinned },
    { label: "Today", items: today },
    { label: "Previous 7 Days", items: previous7Days },
    { label: "Older", items: older },
  ].filter((group) => group.items.length > 0);
}

type ConversationRowProps = {
  conversation: AiConversationSummary;
  isActive: boolean;
  folders: ReadonlyArray<AiFolderSummary>;
  isEditing: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onSelect: () => void;
  onRename: (params: { title: string }) => Promise<void>;
  onMove: (params: { folderId: string | null }) => Promise<void>;
  onTogglePin: () => Promise<void>;
  onDelete: () => Promise<void>;
};

function ConversationRow({
  conversation,
  isActive,
  folders,
  isEditing,
  onStartEditing,
  onStopEditing,
  onSelect,
  onRename,
  onMove,
  onTogglePin,
  onDelete,
}: ConversationRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (isEditing) {
    return (
      <form
        onSubmit={async (e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const rawTitle = formData.get("title");
          const trimmed = typeof rawTitle === "string" ? rawTitle.trim() : "";
          if (trimmed) {
            await onRename({ title: trimmed });
          }
          onStopEditing();
        }}
        className="flex items-center gap-1.5 px-1.5 py-1"
      >
        <Input
          name="title"
          defaultValue={conversation.title}
          autoFocus
          maxLength={120}
          aria-label="Rename conversation"
          onKeyDown={(e) => {
            if (e.key === "Escape") onStopEditing();
          }}
          className="h-7 text-xs"
        />
        <Button type="submit" size="sm" className="h-7 px-2 text-xs">
          Save
        </Button>
      </form>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs transition-colors",
        isActive
          ? "bg-primary/12 text-foreground font-semibold"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 min-w-0 items-center gap-2 text-left"
      >
        {conversation.mode === "plan" ? (
          <Calendar className="size-3.5 shrink-0 text-primary" />
        ) : (
          <MessageSquare className="size-3.5 shrink-0 text-primary" />
        )}
        <span className="truncate">{conversation.title}</span>
      </button>

      {conversation.isPinned ? (
        <Pin className="size-3 shrink-0 text-primary/80" />
      ) : null}

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${conversation.title}`}
            className={cn(
              "rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-opacity",
              menuOpen
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus:opacity-100"
            )}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1.5 space-y-1">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onStartEditing();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            <span>Rename</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              setMenuOpen(false);
              await onTogglePin();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            <Pin className="size-3.5 text-muted-foreground" />
            <span>{conversation.isPinned ? "Unpin" : "Pin"}</span>
          </button>

          {folders.length > 0 || conversation.folderId ? (
            <div className="border-t border-border/70 pt-1 mt-1 space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Move to folder
              </div>
              {conversation.folderId ? (
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await onMove({ folderId: null });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <FolderInput className="size-3.5" />
                  <span>No folder</span>
                </button>
              ) : null}
              {folders
                .filter((f) => f.id !== conversation.folderId)
                .map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await onMove({ folderId: folder.id });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
                  >
                    <Folder className="size-3.5 text-primary" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
            </div>
          ) : null}

          <div className="border-t border-border/70 pt-1 mt-1">
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function AiHistorySidebar({
  folders,
  conversations,
  activeConversationId,
  isDesktopOpen,
  isMobileOpen,
  onMobileOpenChange,
  onNewChat,
  onSelectConversation,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderPin,
  onRenameConversation,
  onMoveConversation,
  onToggleConversationPin,
  onDeleteConversation,
}: AiHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewFolderForm, setShowNewFolderForm] = useState(false);
  const [folderFormError, setFolderFormError] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<
    Record<string, boolean>
  >({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(normalizedQuery)
    );
  }, [conversations, normalizedQuery]);

  const uncategorizedGroups = useMemo(() => {
    const uncategorized = filteredConversations.filter((c) => !c.folderId);
    return groupConversationsByTime({ conversations: uncategorized });
  }, [filteredConversations]);

  const conversationsByFolder = useMemo(() => {
    const map = new Map<string, AiConversationSummary[]>();
    for (const conv of filteredConversations) {
      if (!conv.folderId) continue;
      const list = map.get(conv.folderId) ?? [];
      list.push(conv);
      map.set(conv.folderId, list);
    }
    return map;
  }, [filteredConversations]);

  const handleCreateFolderSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawName = formData.get("folderName");
    const parsed = v.safeParse(CreateAiFolderSchema, {
      name: typeof rawName === "string" ? rawName : "",
    });
    if (!parsed.success) {
      setFolderFormError(
        parsed.issues[0]?.message ?? "Enter a valid folder name."
      );
      return;
    }
    setFolderFormError(null);
    await onCreateFolder({ name: parsed.output.name });
    form.reset();
    setShowNewFolderForm(false);
  };

  const sidebarBody = (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onNewChat();
            onMobileOpenChange(false);
          }}
          className="flex-1 justify-start gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          <span>New Chat</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="New folder"
          title="New folder"
          onClick={() => {
            setShowNewFolderForm((prev) => !prev);
            setFolderFormError(null);
          }}
          className="size-9 shrink-0 rounded-xl p-0"
        >
          <FolderPlus className="size-4" />
        </Button>
      </div>

      {showNewFolderForm ? (
        <form
          onSubmit={handleCreateFolderSubmit}
          className="space-y-1.5 rounded-xl border border-border bg-surface-elevated p-2.5"
        >
          <div className="flex items-center gap-1.5">
            <Input
              name="folderName"
              placeholder="Folder name..."
              aria-label="New folder name"
              autoFocus
              maxLength={60}
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" className="h-8 px-2.5 text-xs">
              Add
            </Button>
          </div>
          {folderFormError ? (
            <p className="text-[11px] text-destructive">{folderFormError}</p>
          ) : null}
        </form>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          aria-label="Search AI chats"
          className="h-8 rounded-xl pl-8 text-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto luma-thin-scroll space-y-4 pr-1">
        {folders.length > 0 ? (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Folders
            </div>
            {folders.map((folder) => {
              const folderChats = conversationsByFolder.get(folder.id) ?? [];
              const isExpanded =
                expandedFolderIds[folder.id] ??
                (Boolean(normalizedQuery) && folderChats.length > 0);
              const isEditingThisFolder = editingFolderId === folder.id;

              return (
                <div key={folder.id} className="space-y-0.5">
                  {isEditingThisFolder ? (
                    <form
                      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const rawName = formData.get("folderName");
                        const trimmed =
                          typeof rawName === "string" ? rawName.trim() : "";
                        if (trimmed) {
                          await onRenameFolder({
                            folderId: folder.id,
                            name: trimmed,
                          });
                        }
                        setEditingFolderId(null);
                      }}
                      className="flex items-center gap-1.5 px-1.5 py-1"
                    >
                      <Input
                        name="folderName"
                        defaultValue={folder.name}
                        autoFocus
                        maxLength={60}
                        aria-label="Rename folder"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                        className="h-7 text-xs"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        Save
                      </Button>
                    </form>
                  ) : (
                    <div className="group flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs text-foreground hover:bg-muted/70">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFolderIds((prev) => ({
                            ...prev,
                            [folder.id]: !isExpanded,
                          }))
                        }
                        className="flex flex-1 min-w-0 items-center gap-2 text-left font-medium"
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        {isExpanded ? (
                          <FolderOpen className="size-3.5 shrink-0 text-primary" />
                        ) : (
                          <Folder className="size-3.5 shrink-0 text-primary" />
                        )}
                        <span className="truncate">{folder.name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
                          {folderChats.length}
                        </span>
                      </button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Actions for folder ${folder.name}`}
                            className="rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted hover:text-foreground transition-opacity"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-40 p-1.5 space-y-0.5"
                        >
                          <button
                            type="button"
                            onClick={() => setEditingFolderId(folder.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
                          >
                            <Pencil className="size-3.5 text-muted-foreground" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () =>
                              onToggleFolderPin({ folderId: folder.id })
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted"
                          >
                            <Pin className="size-3.5 text-muted-foreground" />
                            <span>{folder.isPinned ? "Unpin" : "Pin"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () =>
                              onDeleteFolder({ folderId: folder.id })
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Delete</span>
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {isExpanded ? (
                    <div className="ml-4 border-l border-border/70 pl-2 space-y-0.5">
                      {folderChats.length === 0 ? (
                        <p className="px-2 py-1 text-[11px] text-muted-foreground">
                          Empty folder
                        </p>
                      ) : (
                        folderChats.map((conv) => (
                          <ConversationRow
                            key={conv.id}
                            conversation={conv}
                            isActive={conv.id === activeConversationId}
                            folders={folders}
                            isEditing={editingConversationId === conv.id}
                            onStartEditing={() =>
                              setEditingConversationId(conv.id)
                            }
                            onStopEditing={() => setEditingConversationId(null)}
                            onSelect={() => {
                              onSelectConversation({ conversation: conv });
                              onMobileOpenChange(false);
                            }}
                            onRename={async ({ title }) =>
                              onRenameConversation({
                                conversationId: conv.id,
                                title,
                              })
                            }
                            onMove={async ({ folderId }) =>
                              onMoveConversation({
                                conversationId: conv.id,
                                folderId,
                              })
                            }
                            onTogglePin={async () =>
                              onToggleConversationPin({
                                conversationId: conv.id,
                                isPinned: !conv.isPinned,
                              })
                            }
                            onDelete={async () =>
                              onDeleteConversation({ conversationId: conv.id })
                            }
                          />
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {uncategorizedGroups.length === 0 && folders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Your conversations and folders will appear here.
          </div>
        ) : (
          uncategorizedGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
              {group.items.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  folders={folders}
                  isEditing={editingConversationId === conv.id}
                  onStartEditing={() => setEditingConversationId(conv.id)}
                  onStopEditing={() => setEditingConversationId(null)}
                  onSelect={() => {
                    onSelectConversation({ conversation: conv });
                    onMobileOpenChange(false);
                  }}
                  onRename={async ({ title }) =>
                    onRenameConversation({ conversationId: conv.id, title })
                  }
                  onMove={async ({ folderId }) =>
                    onMoveConversation({
                      conversationId: conv.id,
                      folderId,
                    })
                  }
                  onTogglePin={async () =>
                    onToggleConversationPin({
                      conversationId: conv.id,
                      isPinned: !conv.isPinned,
                    })
                  }
                  onDelete={async () =>
                    onDeleteConversation({ conversationId: conv.id })
                  }
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {isDesktopOpen ? (
        <aside
          aria-label="AI conversation history"
          className="hidden lg:flex lg:fixed lg:top-16 lg:bottom-0 lg:left-72 lg:w-64 lg:z-20 flex-col border-r border-border/80 bg-background/95 p-3.5"
        >
          {sidebarBody}
        </aside>
      ) : null}

      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-80 p-4 flex flex-col">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-base">Luma AI History</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">{sidebarBody}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
