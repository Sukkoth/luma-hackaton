"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useCallback,
  useDeferredValue,
} from "react";
import { useSearchParams } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Folder as FolderIcon,
  ChevronLeft,
  Sparkles,
  Check,
  Loader2,
  X,
  Save,
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  FolderPlus,
  BookOpen,
} from "lucide-react";
import {
  type NoteDetail,
  type NoteFolderDetail,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  createFolderAction,
  deleteFolderAction,
  getSingleNoteAction,
} from "@/actions/notes";
import { TiptapEditor } from "./tiptap-editor";
import { NotesConfirmModal } from "./notes-confirm-modal";
import { DeleteFolderModal } from "./delete-folder-modal";
import { CreateFolderModal } from "./create-folder-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotesManagerProps = {
  initialNotes: NoteDetail[];
  initialFolders: NoteFolderDetail[];
  defaultPlanId?: string;
  defaultSessionId?: number;
  defaultFolderId?: string;
  defaultNoteId?: string;
};

export type NoteSortOption =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc";

type SelectNoteParams = { noteId: string };
type TitleChangeParams = { newTitle: string };
type EditorChangeParams = { html: string; plainText: string };
type TogglePinParams = { note: NoteDetail };
type ToggleArchiveParams = { note: NoteDetail };
type DeleteNoteParams = { noteId: string };
type FolderChangeParams = { folderId: string | null };
type DeleteFolderItemParams = { folderId: string };
type OpenFolderParams = { folderId: string };
type SwitchFolderParams = { folderId: string };

type ConfirmDialogState =
  | {
      isOpen: true;
      title: string;
      description: string;
      confirmLabel: string;
      cancelLabel?: string;
      variant: "danger" | "warning";
      onConfirm: () => void;
    }
  | { isOpen: false };

export function NotesManager({
  initialNotes,
  initialFolders,
  defaultPlanId,
  defaultSessionId,
  defaultFolderId,
  defaultNoteId,
}: NotesManagerProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeFolderId, setActiveFolderId] = useQueryState(
    "folderId",
    parseAsString.withDefault(defaultFolderId || "all")
  );
  const [noteIdQuery, setNoteIdQuery] = useQueryState("noteId", parseAsString);

  const [notesList, setNotesList] = useState<NoteDetail[]>(initialNotes);
  const [folders, setFolders] = useState<NoteFolderDetail[]>(initialFolders);

  // Sync state during render if props update
  const [prevInitialNotes, setPrevInitialNotes] = useState(initialNotes);
  if (initialNotes !== prevInitialNotes) {
    setPrevInitialNotes(initialNotes);
    setNotesList(initialNotes);
  }

  const [prevInitialFolders, setPrevInitialFolders] = useState(initialFolders);
  if (initialFolders !== prevInitialFolders) {
    setPrevInitialFolders(initialFolders);
    setFolders(initialFolders);
  }

  // Active view tab: "active" (standard notes), "folders" (folder view grid), "archived" (archived notes)
  const [activeTab, setActiveTab] = useState<"active" | "folders" | "archived">(
    "active"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<NoteSortOption>("updated_desc");

  // Target note parameter from props or URL
  const targetNoteId =
    noteIdQuery ?? defaultNoteId ?? searchParams.get("noteId") ?? null;

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<"list" | "editor">(() => {
    const planId = defaultPlanId || searchParams.get("planId");
    const sessionParam = defaultSessionId || searchParams.get("session");
    if (targetNoteId || (planId && sessionParam)) return "editor";
    return "list";
  });

  // Selected note state
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    if (targetNoteId) {
      const match = initialNotes.find((n) => n.id === targetNoteId);
      if (match) return match.id;
    }

    const planId = defaultPlanId || searchParams.get("planId");
    const sessionParam = defaultSessionId || searchParams.get("session");
    const sessionId = sessionParam ? Number(sessionParam) : undefined;

    if (planId && sessionId) {
      const matching = initialNotes.find(
        (n) =>
          !n.isArchived &&
          n.planInstanceId === planId &&
          n.planSessionId === sessionId
      );
      if (matching) return matching.id;
    }
    const firstActive = initialNotes.find((n) => !n.isArchived);
    return firstActive?.id ?? initialNotes[0]?.id ?? null;
  });

  // Dirty state tracking & explicit save
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync selected note during render when targetNoteId changes
  const [prevTargetNoteId, setPrevTargetNoteId] = useState(targetNoteId);
  if (targetNoteId !== prevTargetNoteId) {
    setPrevTargetNoteId(targetNoteId);
    if (targetNoteId && targetNoteId !== selectedNoteId) {
      const match = notesList.find((n) => n.id === targetNoteId);
      if (match) {
        setSelectedNoteId(match.id);
        setIsDirty(false);
        setMobileView("editor");
        if (activeTab !== "folders") {
          if (match.isArchived) {
            setActiveTab("archived");
          } else {
            setActiveTab("active");
          }
        }
      }
    }
  }

  // Current active note
  const activeNote = notesList.find((n) => n.id === selectedNoteId) ?? null;

  const currentDraftRef = useRef<{
    title: string;
    bodyHtml: string;
    plainText: string;
  }>({
    title: activeNote?.title ?? "",
    bodyHtml: activeNote?.bodyHtml ?? "",
    plainText: activeNote?.plainTextSnippet ?? "",
  });

  // If targetNoteId is not in notesList yet, fetch asynchronously
  useEffect(() => {
    if (!targetNoteId) return;

    const exists = notesList.some((n) => n.id === targetNoteId);
    if (!exists) {
      getSingleNoteAction({ noteId: targetNoteId }).then((res) => {
        if (res.success && res.note) {
          setNotesList((prev) => {
            if (prev.some((n) => n.id === res.note.id)) return prev;
            return [res.note, ...prev];
          });
          setSelectedNoteId(res.note.id);
          setIsDirty(false);
          setMobileView("editor");
          if (res.note.isArchived) {
            setActiveTab("archived");
          } else {
            setActiveTab("active");
          }
          currentDraftRef.current = {
            title: res.note.title,
            bodyHtml: res.note.bodyHtml,
            plainText: res.note.plainTextSnippet,
          };
        }
      });
    }
  }, [targetNoteId, notesList]);

  // Keep draft in sync with active note when not actively dirty
  useEffect(() => {
    if (activeNote && !isDirty) {
      currentDraftRef.current = {
        title: activeNote.title,
        bodyHtml: activeNote.bodyHtml,
        plainText: activeNote.plainTextSnippet,
      };
    }
  }, [activeNote, isDirty]);

  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
  });
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    name: string;
    notesCount: number;
  } | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // Switch active note implementation
  const performSelectNote = ({ noteId }: SelectNoteParams) => {
    setSelectedNoteId(noteId);
    void setNoteIdQuery(noteId);
    setIsDirty(false);
    setMobileView("editor");
    const target = notesList.find((n) => n.id === noteId);
    if (target) {
      currentDraftRef.current = {
        title: target.title,
        bodyHtml: target.bodyHtml,
        plainText: target.plainTextSnippet,
      };
    }
  };

  // Switch active note (guards against accidental loss if dirty)
  const selectNote = ({ noteId }: SelectNoteParams) => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: "Unsaved Changes",
        description:
          "You have unsaved edits in this note. Do you want to discard them and switch to another note?",
        confirmLabel: "Discard & Switch",
        cancelLabel: "Keep Editing",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog({ isOpen: false });
          performSelectNote({ noteId });
        },
      });
      return;
    }
    performSelectNote({ noteId });
  };

  // Explicit Save Handler
  const handleSaveNote = useCallback(() => {
    if (!activeNote || !isDirty) return;
    setIsSaving(true);
    startTransition(async () => {
      const res = await updateNoteAction({
        noteId: activeNote.id,
        title: currentDraftRef.current.title,
        bodyHtml: currentDraftRef.current.bodyHtml,
        plainTextSnippet: currentDraftRef.current.plainText,
      });

      if (res.success && res.note) {
        setNotesList((prev) =>
          prev.map((n) => (n.id === res.note.id ? res.note : n))
        );
        setIsDirty(false);
      }
      setIsSaving(false);
    });
  }, [activeNote, isDirty]);

  // Keyboard shortcut Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && !isSaving && activeNote) {
          handleSaveNote();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, isSaving, activeNote, handleSaveNote]);

  // Handlers for title & editor changes
  const handleTitleChange = ({ newTitle }: TitleChangeParams) => {
    currentDraftRef.current.title = newTitle;
    if (!isDirty) setIsDirty(true);
  };

  const handleEditorChange = ({ html, plainText }: EditorChangeParams) => {
    currentDraftRef.current.bodyHtml = html;
    currentDraftRef.current.plainText = plainText;
    if (!isDirty) setIsDirty(true);
  };

  // Create new note implementation
  const performCreateNewNote = () => {
    const planId = defaultPlanId || searchParams.get("planId") || undefined;
    const sessionParam = defaultSessionId || searchParams.get("session");
    const sessionId = sessionParam ? Number(sessionParam) : undefined;

    let folderIdToUse: string | undefined;
    if (activeFolderId !== "all" && activeFolderId !== "uncategorized") {
      folderIdToUse = activeFolderId;
    }

    const defaultTitle =
      sessionId !== undefined
        ? `Session ${sessionId} Reflection`
        : "Untitled Note";

    startTransition(async () => {
      const res = await createNoteAction({
        title: defaultTitle,
        bodyHtml: "",
        plainTextSnippet: "",
        folderId: folderIdToUse,
        planInstanceId: planId,
        planSessionId: sessionId,
      });

      if (res.success && res.note) {
        setNotesList((prev) => [res.note, ...prev]);
        setSelectedNoteId(res.note.id);
        void setNoteIdQuery(res.note.id);
        currentDraftRef.current = {
          title: res.note.title,
          bodyHtml: res.note.bodyHtml,
          plainText: res.note.plainTextSnippet,
        };
        setIsDirty(false);
        setActiveTab("active");
        setMobileView("editor");
      }
    });
  };

  const handleCreateNewNote = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: "Unsaved Changes",
        description:
          "You have unsaved edits in this note. Do you want to discard them and create a new note?",
        confirmLabel: "Discard & Create",
        cancelLabel: "Keep Editing",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog({ isOpen: false });
          performCreateNewNote();
        },
      });
      return;
    }
    performCreateNewNote();
  };

  // Delete note implementation
  const performDeleteNote = ({ noteId }: DeleteNoteParams) => {
    setNotesList((prev) => {
      const nextList = prev.filter((n) => n.id !== noteId);
      const nextActive = nextList.find((n) =>
        activeTab === "archived" ? n.isArchived : !n.isArchived
      );
      setSelectedNoteId(nextActive?.id ?? null);
      void setNoteIdQuery(nextActive?.id ?? null);
      return nextList;
    });
    setIsDirty(false);
    setMobileView("list");

    startTransition(async () => {
      await deleteNoteAction({ noteId });
    });
  };

  const handleDeleteNote = ({ noteId }: DeleteNoteParams) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Note",
      description:
        "Are you sure you want to permanently delete this note? This action cannot be undone.",
      confirmLabel: "Delete Note",
      cancelLabel: "Cancel",
      variant: "danger",
      onConfirm: () => {
        setConfirmDialog({ isOpen: false });
        performDeleteNote({ noteId });
      },
    });
  };

  // Toggle pin
  const handleTogglePin = ({ note }: TogglePinParams) => {
    const nextPin = !note.isPinned;
    setNotesList((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, isPinned: nextPin } : n))
    );
    startTransition(async () => {
      const res = await updateNoteAction({
        noteId: note.id,
        isPinned: nextPin,
      });
      if (res.success && res.note) {
        setNotesList((prev) =>
          prev.map((n) => (n.id === res.note.id ? res.note : n))
        );
      }
    });
  };

  // Toggle archive / unarchive
  const handleToggleArchive = ({ note }: ToggleArchiveParams) => {
    const nextArchived = !note.isArchived;
    setNotesList((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, isArchived: nextArchived } : n
      )
    );
    setIsDirty(false);
    startTransition(async () => {
      const res = await updateNoteAction({
        noteId: note.id,
        isArchived: nextArchived,
      });
      if (res.success && res.note) {
        setNotesList((prev) =>
          prev.map((n) => (n.id === res.note.id ? res.note : n))
        );
        setSelectedNoteId(res.note.id);
      }
    });
  };

  // Change note folder
  const handleFolderChange = ({ folderId }: FolderChangeParams) => {
    if (!activeNote) return;
    setNotesList((prev) =>
      prev.map((n) => (n.id === activeNote.id ? { ...n, folderId } : n))
    );
    startTransition(async () => {
      const res = await updateNoteAction({
        noteId: activeNote.id,
        folderId,
      });
      if (res.success && res.note) {
        const nextList = notesList.map((n) =>
          n.id === res.note.id ? res.note : n
        );
        setNotesList(nextList);

        if (activeFolderId !== "all" && activeFolderId !== folderId) {
          const remainingInFolder = nextList.filter((n) => {
            if (n.isArchived) return false;
            if (activeFolderId === "uncategorized") return n.folderId === null;
            return n.folderId === activeFolderId;
          });
          const sorted = [...remainingInFolder].sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            if (sortBy === "created_desc") {
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            }
            if (sortBy === "created_asc") {
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            }
            if (sortBy === "updated_asc") {
              return (
                new Date(a.updatedAt).getTime() -
                new Date(b.updatedAt).getTime()
              );
            }
            return (
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          });
          const first = sorted[0] ?? null;
          setSelectedNoteId(first?.id ?? null);
          if (first) {
            currentDraftRef.current = {
              title: first.title,
              bodyHtml: first.bodyHtml,
              plainText: first.plainTextSnippet,
            };
          }
        }
      }
    });
  };

  // Switch folder filter
  const performSwitchFolder = ({ folderId }: SwitchFolderParams) => {
    setActiveTab("active");
    void setActiveFolderId(folderId);
    setIsDirty(false);

    const notesInFolder = notesList.filter((note) => {
      if (note.isArchived) return false;
      if (folderId === "all") return true;
      if (folderId === "uncategorized") return note.folderId === null;
      return note.folderId === folderId;
    });

    const sorted = [...notesInFolder].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortBy === "created_desc") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "created_asc") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "updated_asc") {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const currentStillInFolder =
      selectedNoteId &&
      notesInFolder.some((n) => n.id === selectedNoteId);

    const noteToSelect = currentStillInFolder
      ? notesInFolder.find((n) => n.id === selectedNoteId) ?? null
      : sorted[0] ?? null;

    setSelectedNoteId(noteToSelect?.id ?? null);
    void setNoteIdQuery(noteToSelect?.id ?? null);
    if (noteToSelect) {
      currentDraftRef.current = {
        title: noteToSelect.title,
        bodyHtml: noteToSelect.bodyHtml,
        plainText: noteToSelect.plainTextSnippet,
      };
    }
  };

  const handleSwitchFolder = ({ folderId }: SwitchFolderParams) => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: "Unsaved Changes",
        description:
          "You have unsaved edits in this note. Discard changes and switch folder?",
        confirmLabel: "Discard & Switch",
        cancelLabel: "Keep Editing",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog({ isOpen: false });
          performSwitchFolder({ folderId });
        },
      });
      return;
    }
    performSwitchFolder({ folderId });
  };

  const handleOpenFolder = ({ folderId }: OpenFolderParams) => {
    void setActiveFolderId(folderId);
    setActiveTab("active");
  };

  const handleDeleteFolder = ({ folderId }: DeleteFolderItemParams) => {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return;
    const realNotesCount = notesList.filter(
      (n) => !n.isArchived && n.folderId === target.id
    ).length;
    setFolderToDelete({
      id: target.id,
      name: target.name,
      notesCount: realNotesCount,
    });
  };

  const handleConfirmDeleteFolderOnly = () => {
    if (!folderToDelete) return;
    setIsDeletingFolder(true);
    startTransition(async () => {
      try {
        const res = await deleteFolderAction({
          folderId: folderToDelete.id,
          deleteNotes: false,
        });
        if (res.success) {
          setFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
          setNotesList((prev) =>
            prev.map((n) =>
              n.folderId === folderToDelete.id ? { ...n, folderId: null } : n
            )
          );
          if (activeFolderId === folderToDelete.id) {
            void setActiveFolderId("all");
          }
          setFolderToDelete(null);
        }
      } finally {
        setIsDeletingFolder(false);
      }
    });
  };

  const handleConfirmDeleteFolderAndNotes = () => {
    if (!folderToDelete) return;
    setIsDeletingFolder(true);
    startTransition(async () => {
      try {
        const res = await deleteFolderAction({
          folderId: folderToDelete.id,
          deleteNotes: true,
        });
        if (res.success) {
          setFolders((prev) => prev.filter((f) => f.id !== folderToDelete.id));
          const remaining = notesList.filter(
            (n) => n.folderId !== folderToDelete.id
          );
          setNotesList(remaining);
          if (activeFolderId === folderToDelete.id) {
            void setActiveFolderId("all");
          }
          const nextActive = remaining.find((n) => !n.isArchived);
          setSelectedNoteId(nextActive?.id ?? null);
          void setNoteIdQuery(nextActive?.id ?? null);
          setFolderToDelete(null);
        }
      } finally {
        setIsDeletingFolder(false);
      }
    });
  };

  const handleCreateNewFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await createFolderAction({ name });
      if (res.success && res.folder) {
        setFolders((prev) => [...prev, res.folder]);
        setShowFolderModal(false);
      }
    });
  };

  // Filter and sort calculations
  const activeNotesCount = notesList.filter((n) => !n.isArchived).length;
  const archivedNotesCount = notesList.filter((n) => n.isArchived).length;
  const uncategorizedNotesCount = notesList.filter(
    (n) => !n.isArchived && !n.folderId
  ).length;

  const currentFolder =
    activeFolderId === "all" || activeFolderId === "uncategorized"
      ? null
      : folders.find((f) => f.id === activeFolderId);

  const filteredNotes = notesList.filter((note) => {
    if (activeTab === "archived") {
      if (!note.isArchived) return false;
    } else {
      if (note.isArchived) return false;
      if (activeFolderId !== "all") {
        if (activeFolderId === "uncategorized") {
          if (note.folderId !== null) return false;
        } else if (note.folderId !== activeFolderId) {
          return false;
        }
      }
    }

    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchSnippet = note.plainTextSnippet.toLowerCase().includes(q);
      const matchPlan = note.planTitle?.toLowerCase().includes(q) ?? false;
      const matchFolder = note.folderName?.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchSnippet && !matchPlan && !matchFolder) {
        return false;
      }
    }

    return true;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    if (sortBy === "created_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "created_asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "updated_asc") {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <>
      <div className="w-full flex-1 min-h-0 h-full rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col md:flex-row">
        {/* ================= LEFT PANE: NOTEBOOK SHELF & EXPLORER ================= */}
        <aside
          className={cn(
            "w-full md:w-[320px] lg:w-[350px] xl:w-[380px] shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-card",
            mobileView === "editor" ? "hidden md:flex" : "flex flex-1 md:flex-initial"
          )}
        >
          {/* Shelf Header */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  Notes
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/50">
                  {activeNotesCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Reflections &amp; sermon notes
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowFolderModal(true)}
                disabled={isPending}
                data-testid="create-new-folder-button"
                aria-label="New Folder"
                title="New Folder"
                className="inline-flex size-8.5 items-center justify-center rounded-xl border border-border bg-surface-elevated text-muted-foreground hover:border-border-strong hover:text-foreground transition-all cursor-pointer"
              >
                <FolderPlus className="size-4" />
                <span className="sr-only">New Folder</span>
              </button>

              <Button
                type="button"
                onClick={handleCreateNewNote}
                disabled={isPending}
                data-testid="create-new-note-button"
                aria-label="New Note"
                title="New Note"
                size="sm"
                leftIcon={<Plus className="size-3.5" />}
                className="h-8.5 px-3 text-xs font-semibold rounded-xl shadow-xs"
              >
                <span>New</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Strip */}
          <div className="px-3.5 sm:px-4 pt-3 pb-2.5 border-b border-border/60 space-y-2.5 shrink-0 bg-muted/20">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={
                  activeTab === "folders"
                    ? "Search collections..."
                    : activeTab === "archived"
                      ? "Search archived notes..."
                      : "Search study notes..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="notes-search-input"
                className="h-8.5 w-full rounded-xl border border-border bg-background pr-8 pl-8.5 text-xs text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Segmented Filter Control */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl border border-border bg-surface-elevated">
              <button
                type="button"
                onClick={() => handleSwitchFolder({ folderId: "all" })}
                data-testid="tab-all-notes"
                className={cn(
                  "flex-1 inline-flex h-7.5 items-center justify-center rounded-lg px-2 text-[11px] font-medium transition-all cursor-pointer",
                  activeTab === "active" && activeFolderId === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FileText className="size-3 mr-1" />
                <span>All ({activeNotesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("folders")}
                data-testid="tab-folders-view"
                className={cn(
                  "flex-1 inline-flex h-7.5 items-center justify-center rounded-lg px-2 text-[11px] font-medium transition-all cursor-pointer",
                  activeTab === "folders"
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <FolderIcon className="size-3 mr-1 text-primary" />
                <span>Folders ({folders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("archived");
                  const firstArchived = notesList.find((n) => n.isArchived);
                  setSelectedNoteId(firstArchived?.id ?? null);
                  if (firstArchived) {
                    currentDraftRef.current = {
                      title: firstArchived.title,
                      bodyHtml: firstArchived.bodyHtml,
                      plainText: firstArchived.plainTextSnippet,
                    };
                  }
                }}
                data-testid="tab-archived-notes"
                className={cn(
                  "flex-1 inline-flex h-7.5 items-center justify-center rounded-lg px-2 text-[11px] font-medium transition-all cursor-pointer",
                  activeTab === "archived"
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Archive className="size-3 mr-1" />
                <span>Archive ({archivedNotesCount})</span>
              </button>
            </div>

            {/* Folder Quick-Filter Ribbon (when in active notes mode) */}
            {activeTab === "active" && (
              <div
                data-testid="notes-folders-filter"
                className="flex items-center justify-between gap-2 pt-0.5"
              >
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleSwitchFolder({ folderId: "all" })}
                    className={cn(
                      "shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer",
                      activeFolderId === "all"
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
                    )}
                  >
                    All
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleSwitchFolder({ folderId: folder.id })}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer max-w-[130px]",
                        activeFolderId === folder.id
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
                      )}
                    >
                      <FolderIcon className="size-2.5 text-primary shrink-0" />
                      <span className="truncate">{folder.name}</span>
                      <span className="text-[10px] opacity-70">
                        ({folder.notesCount})
                      </span>
                    </button>
                  ))}
                </div>

                {/* Sort Selector */}
                <div className="shrink-0 relative">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/80 bg-background text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-border cursor-pointer">
                    <ArrowUpDown className="size-3" />
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as NoteSortOption)
                      }
                      data-testid="notes-sort-select"
                      aria-label="Sort notes"
                      className="absolute inset-0 size-full opacity-0 cursor-pointer"
                    >
                      <option value="updated_desc">Newest</option>
                      <option value="updated_asc">Oldest</option>
                      <option value="created_desc">Created (New)</option>
                      <option value="created_asc">Created (Old)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shelf Body (Cards) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5">
            {activeTab === "folders" ? (
              /* FOLDERS GRID VIEW */
              <div data-testid="folders-view-grid" className="space-y-2">
                <div className="flex items-center justify-between px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Collections</span>
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(true)}
                    className="text-primary hover:underline normal-case text-xs font-semibold cursor-pointer"
                  >
                    + New Collection
                  </button>
                </div>

                {/* All Notes Folder Card */}
                <div
                  onClick={() => handleOpenFolder({ folderId: "all" })}
                  className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-border-strong hover:bg-muted/30 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                        All Notes
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {activeNotesCount} active notes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uncategorized Folder Card */}
                <div
                  onClick={() =>
                    handleOpenFolder({ folderId: "uncategorized" })
                  }
                  className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-border-strong hover:bg-muted/30 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground shrink-0">
                      <FolderIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                        Uncategorized
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {uncategorizedNotesCount} notes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Folders */}
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => handleOpenFolder({ folderId: folder.id })}
                    data-testid={`folder-card-${folder.id}`}
                    className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-border-strong hover:bg-muted/30 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                        <FolderIcon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {folder.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {
                            notesList.filter(
                              (n) => !n.isArchived && n.folderId === folder.id
                            ).length
                          }{" "}
                          {notesList.filter(
                            (n) => !n.isArchived && n.folderId === folder.id
                          ).length === 1
                            ? "note"
                            : "notes"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder({ folderId: folder.id });
                      }}
                      title="Delete folder"
                      data-testid={`delete-folder-button-${folder.id}`}
                      aria-label={`Delete folder ${folder.name}`}
                      className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* NOTES LIST CARDS */
              <>
                {/* Active Folder Filter Bar Banner */}
                {activeFolderId !== "all" && activeTab === "active" && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <FolderIcon className="size-3 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">
                        {currentFolder?.name ?? "Uncategorized"}
                      </span>
                      <span className="text-muted-foreground">
                        ({filteredNotes.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentFolder && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteFolder({ folderId: currentFolder.id })
                          }
                          className="text-destructive hover:underline text-xs font-medium cursor-pointer"
                          title="Delete this folder"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSwitchFolder({ folderId: "all" })}
                        className="text-primary font-medium hover:underline shrink-0 cursor-pointer text-xs"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                )}

                {sortedNotes.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <FileText className="mx-auto size-7 text-muted-foreground/60" />
                    <p className="mt-2 text-xs sm:text-sm font-semibold text-foreground">
                      {activeTab === "archived"
                        ? "No archived notes"
                        : "No notes found"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {searchQuery
                        ? "Try different keywords"
                        : activeTab === "archived"
                          ? "Archived notes will appear here"
                          : "Create a note to start your study journal"}
                    </p>
                  </div>
                ) : (
                  sortedNotes.map((note) => {
                    const isSelected = note.id === selectedNoteId;
                    const dateToDisplay = sortBy.startsWith("created")
                      ? new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : new Date(note.updatedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        });

                    return (
                      <div
                        key={note.id}
                        onClick={() => selectNote({ noteId: note.id })}
                        data-testid={`note-card-${note.id}`}
                        className={cn(
                          "group relative cursor-pointer rounded-xl p-3 border transition-all text-left",
                          isSelected
                            ? "border-primary/50 bg-primary/5 shadow-2xs"
                            : "border-border/60 bg-card hover:border-border hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              "line-clamp-1 text-xs sm:text-[13px] font-bold text-foreground",
                              isSelected && "text-primary"
                            )}
                          >
                            {note.title || "Untitled Note"}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {note.isArchived && (
                              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                Archived
                              </span>
                            )}
                            {note.isPinned && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                <Pin className="size-2.5 fill-current" />
                                <span>Pinned</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {note.plainTextSnippet || "No content yet..."}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{dateToDisplay}</span>

                          {note.folderName && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 truncate max-w-[110px]">
                              <FolderIcon className="size-2.5 text-primary shrink-0" />
                              <span className="truncate">
                                {note.folderName}
                              </span>
                            </span>
                          )}

                          {note.planTitle && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 truncate max-w-[120px]">
                              <Sparkles className="size-2.5 text-primary shrink-0" />
                              <span className="truncate">{note.planTitle}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </aside>

        {/* ================= RIGHT PANE: PHYSICAL JOURNAL DESK ================= */}
        <main
          className={cn(
            "flex-1 min-w-0 flex flex-col min-h-0 bg-background",
            mobileView === "list" ? "hidden md:flex" : "flex flex-1"
          )}
        >
          {activeNote ? (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Top Bar: Navigation & Action Buttons */}
              <div className="h-14 px-4 sm:px-6 border-b border-border/60 flex items-center justify-between gap-3 shrink-0 bg-card/60 backdrop-blur-xs">
                {/* Left Group: Mobile Back Button & Folder Tag */}
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    data-testid="back-to-notes-list"
                    className="inline-flex md:hidden h-8.5 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                    <span>Notes</span>
                  </button>

                  {/* Folder Selector Dropdown Tag */}
                  <div className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-medium text-foreground shadow-2xs">
                    <FolderIcon className="size-3.5 text-primary shrink-0" />
                    <select
                      value={activeNote.folderId || ""}
                      data-testid="note-folder-select"
                      onChange={(e) =>
                        handleFolderChange({
                          folderId: e.target.value || null,
                        })
                      }
                      className="bg-transparent focus:outline-hidden font-medium text-foreground cursor-pointer text-xs"
                    >
                      <option value="" className="bg-surface text-foreground">
                        No Folder
                      </option>
                      {folders.map((f) => (
                        <option
                          key={f.id}
                          value={f.id}
                          className="bg-surface text-foreground"
                        >
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Linked Plan Chip */}
                  {activeNote.planTitle && (
                    <div className="hidden sm:inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-medium text-foreground truncate max-w-[180px] shadow-2xs">
                      <Sparkles className="size-3 text-primary shrink-0" />
                      <span className="truncate">{activeNote.planTitle}</span>
                    </div>
                  )}
                </div>

                {/* Right Group: Save, Pin, Archive, Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Save button */}
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={!isDirty || isSaving}
                    data-testid="save-note-button"
                    className={cn(
                      "inline-flex h-8.5 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all",
                      isDirty
                        ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-xs cursor-pointer"
                        : "border border-border bg-card text-muted-foreground cursor-not-allowed opacity-60"
                    )}
                    title={
                      isDirty
                        ? "Save changes (Cmd/Ctrl + S)"
                        : "All changes saved"
                    }
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : isDirty ? (
                      <>
                        <Save className="size-3.5" />
                        <span>Save</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5 text-primary" />
                        <span>Saved</span>
                      </>
                    )}
                  </button>

                  {/* Pin button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePin({ note: activeNote })}
                    title={
                      activeNote.isPinned ? "Unpin note" : "Pin to top of list"
                    }
                    aria-label={
                      activeNote.isPinned ? "Unpin note" : "Pin to top of list"
                    }
                    className={cn(
                      "flex size-8.5 items-center justify-center rounded-xl border transition-all cursor-pointer",
                      activeNote.isPinned
                        ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                        : "border border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    <Pin className="size-3.5" />
                  </button>

                  {/* Archive button */}
                  <button
                    type="button"
                    onClick={() => handleToggleArchive({ note: activeNote })}
                    data-testid="archive-toggle-button"
                    title={
                      activeNote.isArchived ? "Restore note" : "Archive note"
                    }
                    aria-label={
                      activeNote.isArchived ? "Restore note" : "Archive note"
                    }
                    className={cn(
                      "flex size-8.5 items-center justify-center rounded-xl border transition-all cursor-pointer",
                      activeNote.isArchived
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "border border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    {activeNote.isArchived ? (
                      <ArchiveRestore className="size-3.5" />
                    ) : (
                      <Archive className="size-3.5" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteNote({ noteId: activeNote.id })}
                    title="Delete note"
                    aria-label="Delete note"
                    className="flex size-8.5 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition-all hover:bg-destructive/20 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Archived Alert Banner */}
              {activeNote.isArchived && (
                <div
                  data-testid="archived-note-banner"
                  className="mx-4 mt-3 sm:mx-8 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200 shrink-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Archive className="size-4 shrink-0 text-amber-600" />
                    <span className="truncate">This study note is archived.</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleArchive({ note: activeNote })}
                    data-testid="restore-note-button"
                    leftIcon={<ArchiveRestore className="size-3.5" />}
                    className="h-8 text-xs shrink-0 rounded-lg font-semibold"
                  >
                    Restore Note
                  </Button>
                </div>
              )}

              {/* Editorial Writing Canvas (No nested Russian-doll cards) */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-4">
                  {/* Last updated timestamp */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40">
                    <span>
                      Last edited{" "}
                      {new Date(activeNote.updatedAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    {isDirty && (
                      <span className="text-primary font-medium flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                        <span>Unsaved edits</span>
                      </span>
                    )}
                  </div>

                  {/* Tiptap Rich-Text Editor with Integrated Title */}
                  <TiptapEditor
                    key={`editor-${activeNote.id}`}
                    content={activeNote.bodyHtml}
                    onChangeAction={handleEditorChange}
                    placeholder="Reflect on today's scripture passages, sermon insights, or prayers..."
                    titleSlot={({ focusEditor }) => (
                      <input
                        type="text"
                        placeholder="Untitled Reflection..."
                        defaultValue={activeNote.title}
                        key={activeNote.id}
                        onChange={(e) =>
                          handleTitleChange({ newTitle: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            focusEditor();
                          }
                        }}
                        data-testid="note-title-input"
                        className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground placeholder:text-muted-foreground/35 leading-snug border-none p-0 focus:outline-hidden"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Canvas */
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-2xs mb-4">
                <BookOpen className="size-7" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {activeTab === "archived"
                  ? "No note selected"
                  : "Select a note to read or edit"}
              </h2>
              <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
                {activeTab === "archived"
                  ? "Pick an archived reflection from the index to read or restore it."
                  : "Choose an existing reflection from your library or create a fresh study note."}
              </p>
              {activeTab !== "archived" && (
                <Button
                  type="button"
                  onClick={handleCreateNewNote}
                  disabled={isPending}
                  leftIcon={<Plus className="size-4" />}
                  size="sm"
                  className="rounded-xl font-semibold shadow-xs"
                >
                  Create New Note
                </Button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <NotesConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.isOpen ? confirmDialog.title : ""}
        description={confirmDialog.isOpen ? confirmDialog.description : ""}
        confirmLabel={confirmDialog.isOpen ? confirmDialog.confirmLabel : ""}
        cancelLabel={
          confirmDialog.isOpen ? confirmDialog.cancelLabel : undefined
        }
        variant={confirmDialog.isOpen ? confirmDialog.variant : "default"}
        onConfirm={confirmDialog.isOpen ? confirmDialog.onConfirm : () => {}}
        onCancel={() => setConfirmDialog({ isOpen: false })}
        isPending={isPending}
      />

      {/* Delete Folder Modal */}
      <DeleteFolderModal
        isOpen={folderToDelete !== null}
        folder={folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onDeleteFolderOnly={handleConfirmDeleteFolderOnly}
        onDeleteFolderAndNotes={handleConfirmDeleteFolderAndNotes}
        isPending={isDeletingFolder}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleCreateNewFolder}
        isPending={isPending}
      />
    </>
  );
}
