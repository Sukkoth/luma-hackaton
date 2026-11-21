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
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
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
import { FolderCard } from "./folder-card";
import { Button } from "@/components/ui/button";
import { TabsBar } from "@/components/ui/tabs-bar";
import { FilterPills } from "@/components/ui/filter-pills";
import {
  HeaderActions,
  HeaderActionButton,
} from "@/components/ui/header-action-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  "updated_desc" | "updated_asc" | "created_desc" | "created_asc";

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
  const [, startTransition] = useTransition();

  // 1. nuqs URL Query States for Active Folder, Active Note, and Active Tab (shallow to avoid server re-renders)
  const [activeFolderId, setActiveFolderId] = useQueryState(
    "folderId",
    parseAsString
      .withDefault(defaultFolderId || "all")
      .withOptions({ shallow: true })
  );

  const [activeNoteId, setActiveNoteId] = useQueryState(
    "noteId",
    parseAsString
      .withDefault(defaultNoteId || "")
      .withOptions({ shallow: true })
  );

  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["active", "folders", "archived"] as const)
      .withDefault("active")
      .withOptions({ shallow: true })
  );

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

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<NoteSortOption>("updated_desc");

  // Determine initial fallback note ID if URL noteId is not yet set
  const [fallbackNoteId, setFallbackNoteId] = useState<string | null>(() => {
    if (defaultNoteId) return defaultNoteId;
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

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<"list" | "editor">(() => {
    const planId = defaultPlanId || searchParams.get("planId");
    const sessionParam = defaultSessionId || searchParams.get("session");
    if (activeNoteId || defaultNoteId || (planId && sessionParam))
      return "editor";
    return "list";
  });

  // Target note identifier (prioritizing nuqs query state)
  const targetNoteId = activeNoteId || fallbackNoteId;

  // Active note reference
  const activeNote =
    notesList.find((n) => n.id === targetNoteId) ??
    notesList.find((n) => !n.isArchived) ??
    notesList[0] ??
    null;

  // Dirty state tracking & explicit save
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Draft content ref
  const currentDraftRef = useRef({
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
          void setActiveNoteId(res.note.id);
          setFallbackNoteId(res.note.id);
          setIsDirty(false);
          setMobileView("editor");
          if (res.note.isArchived) {
            void setActiveTab("archived");
          } else {
            void setActiveTab("active");
          }
          currentDraftRef.current = {
            title: res.note.title,
            bodyHtml: res.note.bodyHtml,
            plainText: res.note.plainTextSnippet,
          };
        }
      });
    }
  }, [targetNoteId, notesList, setActiveNoteId, setActiveTab]);

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
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Switch active note implementation via nuqs
  const performSelectNote = ({ noteId }: SelectNoteParams) => {
    void setActiveNoteId(noteId);
    setFallbackNoteId(noteId);
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

    setIsCreatingNote(true);
    startTransition(async () => {
      try {
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
          void setActiveNoteId(res.note.id);
          setFallbackNoteId(res.note.id);
          currentDraftRef.current = {
            title: res.note.title,
            bodyHtml: res.note.bodyHtml,
            plainText: res.note.plainTextSnippet,
          };
          setIsDirty(false);
          void setActiveTab("active");
          setMobileView("editor");
        }
      } finally {
        setIsCreatingNote(false);
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
      void setActiveNoteId(nextActive?.id ?? "");
      setFallbackNoteId(nextActive?.id ?? null);
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
    if (isArchiving) return;
    const nextArchived = !note.isArchived;
    setIsArchiving(true);
    setNotesList((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, isArchived: nextArchived } : n
      )
    );
    setIsDirty(false);
    startTransition(async () => {
      try {
        const res = await updateNoteAction({
          noteId: note.id,
          isArchived: nextArchived,
        });
        if (res.success && res.note) {
          setNotesList((prev) =>
            prev.map((n) => (n.id === res.note.id ? res.note : n))
          );
          void setActiveNoteId(res.note.id);
          setFallbackNoteId(res.note.id);
        }
      } finally {
        setIsArchiving(false);
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
          void setActiveNoteId(first?.id ?? "");
          setFallbackNoteId(first?.id ?? null);
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

  // Switch folder filter via nuqs
  const performSwitchFolder = ({ folderId }: SwitchFolderParams) => {
    if (activeTab !== "active") {
      void setActiveTab("active");
    }
    if (activeFolderId !== folderId) {
      void setActiveFolderId(folderId);
    }
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
      activeNote && notesInFolder.some((n) => n.id === activeNote.id);

    const noteToSelect = currentStillInFolder
      ? (notesInFolder.find((n) => n.id === activeNote?.id) ?? null)
      : (sorted[0] ?? null);

    if (noteToSelect?.id && noteToSelect.id !== targetNoteId) {
      void setActiveNoteId(noteToSelect.id);
      setFallbackNoteId(noteToSelect.id);
    }
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
    void setActiveTab("active");
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
          void setActiveNoteId(nextActive?.id ?? "");
          setFallbackNoteId(nextActive?.id ?? null);
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

    setIsCreatingFolder(true);
    startTransition(async () => {
      try {
        const res = await createFolderAction({ name });
        if (res.success && res.folder) {
          setFolders((prev) => [...prev, res.folder]);
          setShowFolderModal(false);
        }
      } finally {
        setIsCreatingFolder(false);
      }
    });
  };

  // Filter and sort calculations
  const activeNotesCount = notesList.filter((n) => !n.isArchived).length;
  const archivedNotesCount = notesList.filter((n) => n.isArchived).length;
  const uncategorizedNotesCount = notesList.filter(
    (n) => !n.isArchived && !n.folderId
  ).length;
  const pinnedNotesCount = notesList.filter(
    (n) => !n.isArchived && n.isPinned
  ).length;
  const linkedScriptureCount = notesList.filter(
    (n) => !n.isArchived && (n.planTitle || n.planInstanceId || n.planSessionId)
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
      const matchFolder = note.folderName?.toLowerCase().includes(q) ?? false;
      const matchPlan = note.planTitle?.toLowerCase().includes(q) ?? false;
      return matchTitle || matchSnippet || matchFolder || matchPlan;
    }

    return true;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
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
    <div className="w-full space-y-4 sm:space-y-6">
      {/* ── 1. Unboxed Editorial Masthead ── */}
      <section
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1",
          mobileView === "editor" ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>
              Theological Reflections • Scripture Marginalia &amp; Study Journal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            Scripture Journal &amp; Study Notes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Record spiritual insights, theological thoughts, and devotional
            reflections anchored to your canonical reading.
          </p>
        </div>

        <HeaderActions className="w-full sm:w-auto flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5">
          <HeaderActionButton
            type="secondary"
            onClick={() => setShowFolderModal(true)}
            testId="create-new-folder-button"
            icon={<FolderPlus className="size-4" />}
            label="New Collection"
            className="flex-1 sm:flex-initial justify-center"
          />
          <HeaderActionButton
            type="primary"
            onClick={handleCreateNewNote}
            disabled={isCreatingNote}
            testId="create-new-note-button"
            icon={<Plus className="size-4" />}
            label="Create Note"
            className="flex-1 sm:flex-initial justify-center"
          />
        </HeaderActions>
      </section>

      {/* ── 2. Signature Horizon Ribbon (Hidden on mobile <768px to preserve note space) ── */}
      <section className="hidden md:block rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Column 1: Active Reflections */}
          <div className="pr-0 md:pr-8 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <FileText className="size-3.5 text-primary" />
                <span>Active Reflections</span>
              </span>
              <span className="text-xs font-medium text-primary">
                {activeNotesCount} notes
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {activeNotesCount}
              </span>
              <span className="text-xs text-muted-foreground">
                recorded entries
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pinnedNotesCount > 0
                ? `${pinnedNotesCount} prioritized note${pinnedNotesCount === 1 ? "" : "s"} pinned to the top of your journal.`
                : "Capture verse insights, prayers, and study observations."}
            </p>
          </div>

          {/* Column 2: Thematic Collections */}
          <div className="px-0 md:px-8 pt-5 md:pt-0 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <FolderIcon className="size-3.5 text-primary" />
                <span>Thematic Collections</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {folders.length} collections
              </span>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {folders.length}
              </span>
              <span className="text-xs text-muted-foreground">
                curated folders
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Group notes by sermon series, theological doctrines, or topical
              studies.
            </p>
          </div>

          {/* Column 3: Scripture Isolation */}
          <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <BookOpen className="size-3.5 text-primary" />
                <span>Scripture Isolation</span>
              </span>
              <span className="text-xs font-semibold text-primary">Active</span>
            </div>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {linkedScriptureCount}
              </span>
              <span className="text-xs text-muted-foreground">
                plan sessions linked
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reflections synchronized with your active reading tracker
              schedule.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Unified Filter & Search Bar with shadcn Select ── */}
      <section
        className={cn(
          "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",
          mobileView === "editor" ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Left: View Tabs */}
        <TabsBar
          tabs={[
            {
              id: "active" as const,
              label: "All Notes",
              icon: <FileText className="size-3.5" />,
              count: activeNotesCount,
              testId: "tab-all-notes",
            },
            {
              id: "folders" as const,
              label: "Collections",
              icon: <FolderIcon className="size-3.5" />,
              count: folders.length,
              testId: "tab-folders-view",
            },
            {
              id: "archived" as const,
              label: "Archive",
              icon: <Archive className="size-3.5" />,
              count: archivedNotesCount,
              testId: "tab-archived-notes",
            },
          ]}
          activeTab={activeTab}
          onTabChange={({ tab }) => {
            if (tab === "active") {
              handleSwitchFolder({ folderId: "all" });
            } else if (tab === "folders") {
              void setActiveTab("folders");
            } else if (tab === "archived") {
              void setActiveTab("archived");
              const firstArchived = notesList.find((n) => n.isArchived);
              if (firstArchived) {
                void setActiveNoteId(firstArchived.id);
                setFallbackNoteId(firstArchived.id);
                currentDraftRef.current = {
                  title: firstArchived.title,
                  bodyHtml: firstArchived.bodyHtml,
                  plainText: firstArchived.plainTextSnippet,
                };
              }
            }
          }}
          className="self-start sm:self-auto"
        />

        {/* Right: Search & shadcn Sort Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto sm:max-w-md justify-end">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                activeTab === "folders"
                  ? "Search collections..."
                  : activeTab === "archived"
                    ? "Search archived..."
                    : "Search study notes..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="notes-search-input"
              className="h-9.5 w-full rounded-xl border border-border bg-card pr-8 pl-8.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-xs"
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

          {/* Actual shadcn Select Dropdown */}
          <div className="relative shrink-0">
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as NoteSortOption)}
            >
              <SelectTrigger
                data-testid="notes-sort-select"
                className="h-9.5 w-[130px] sm:w-[175px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="size-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="updated_desc">Recently Updated</SelectItem>
                <SelectItem value="created_desc">Newest First</SelectItem>
                <SelectItem value="created_asc">Oldest First</SelectItem>
                <SelectItem value="updated_asc">Oldest Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── 4. Quick Collection Filter Pills (when in active tab) ── */}
      {activeTab === "active" && (
        <div
          className={cn(mobileView === "editor" ? "hidden lg:block" : "block")}
        >
          <FilterPills
            containerTestId="notes-folders-filter"
            className="py-1"
            items={[
              { id: "all", label: "All Collections" },
              ...folders.map((folder) => ({
                id: folder.id,
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <FolderIcon className="size-3 shrink-0" />
                    <span>{folder.name}</span>
                    <span className="opacity-75 text-[10px]">
                      ({folder.notesCount})
                    </span>
                  </span>
                ),
              })),
              ...(uncategorizedNotesCount > 0
                ? [
                    {
                      id: "uncategorized",
                      label: `Uncategorized (${uncategorizedNotesCount})`,
                    },
                  ]
                : []),
            ]}
            activeFilter={activeFolderId}
            onFilterChange={({ filter }) =>
              handleSwitchFolder({ folderId: filter })
            }
          />
        </div>
      )}

      {/* ── 5. Main Studio Area: Physical Folders Grid vs 2-Pane Journal Desk ── */}
      {activeTab === "folders" ? (
        /* Real Physical Folder Cards Grid */
        <section data-testid="folders-view-grid" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 pt-2">
            {/* Create Collection Physical Card */}
            <button
              type="button"
              onClick={() => setShowFolderModal(true)}
              className="group relative flex flex-col justify-between rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/50 bg-card/40 hover:bg-primary/5 p-6 text-center transition-all min-h-[195px] cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center my-auto">
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <FolderPlus className="size-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Create New Collection
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
                  Organize reflections by sermon series, doctrines, or devotions
                </p>
              </div>
            </button>

            {/* Collection Cards */}
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                id={folder.id}
                name={folder.name}
                notesCount={folder.notesCount}
                onOpen={() => handleOpenFolder({ folderId: folder.id })}
                onDelete={() => handleDeleteFolder({ folderId: folder.id })}
              />
            ))}
          </div>
        </section>
      ) : (
        /* Dual-Pane Journal Studio Desk */
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[660px]">
          {/* ── Left Pane: Note Stream List (lg:col-span-5 xl:col-span-4) ── */}
          <div
            className={cn(
              "lg:col-span-5 xl:col-span-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col overflow-hidden",
              mobileView === "editor" ? "hidden lg:flex" : "flex"
            )}
          >
            {/* Stream Header */}
            <div className="px-4 py-3.5 border-b border-border/60 flex items-center justify-between bg-surface-elevated">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>
                  {activeTab === "archived"
                    ? "Archived Notes"
                    : currentFolder
                      ? currentFolder.name
                      : "All Study Notes"}
                </span>
              </span>
              <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[720px] scrollbar-thin">
              {sortedNotes.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <div className="size-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-3">
                    <FileText className="size-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {searchQuery ? "No matching reflections" : "No notes found"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    {searchQuery
                      ? "Try searching with different keywords."
                      : activeTab === "archived"
                        ? "Archived reflections will appear here."
                        : "Create your first study reflection to begin your spiritual journal."}
                  </p>
                  {activeTab === "active" && !searchQuery && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleCreateNewNote}
                      leftIcon={<Plus className="size-3.5" />}
                      className="mt-4 font-semibold shadow-xs"
                    >
                      New Note
                    </Button>
                  )}
                </div>
              ) : (
                sortedNotes.map((note) => {
                  const isSelected = activeNote?.id === note.id;
                  const dateToDisplay = new Date(
                    note.updatedAt
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={note.id}
                      data-testid={`note-card-${note.id}`}
                      onClick={() => selectNote({ noteId: note.id })}
                      className={cn(
                        "rounded-xl border p-3.5 transition-all cursor-pointer relative text-left",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-2xs"
                          : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={cn(
                            "text-sm font-bold tracking-tight line-clamp-1",
                            isSelected ? "text-primary" : "text-foreground"
                          )}
                        >
                          {note.title || "Untitled Note"}
                        </h4>
                        {note.isPinned && (
                          <Pin className="size-3.5 text-primary fill-primary shrink-0 mt-0.5" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {note.plainTextSnippet || "No additional text..."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="tabular-nums font-medium">
                          {dateToDisplay}
                        </span>

                        {note.folderName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 truncate max-w-[120px]">
                            <FolderIcon className="size-2.5 text-primary shrink-0" />
                            <span className="truncate">{note.folderName}</span>
                          </span>
                        )}

                        {note.planTitle && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary truncate max-w-[130px]">
                            <Sparkles className="size-2.5 text-primary shrink-0" />
                            <span className="truncate">{note.planTitle}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Pane: Sanctuary Writing Desk (lg:col-span-7 xl:col-span-8) ── */}
          <div
            className={cn(
              "lg:col-span-7 xl:col-span-8 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col overflow-hidden",
              mobileView === "list" ? "hidden lg:flex" : "flex"
            )}
          >
            {activeNote ? (
              <div className="flex-1 flex flex-col min-h-[660px]">
                {/* Desk Control Bar */}
                <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-border/60 flex items-center justify-between gap-1.5 sm:gap-3 bg-surface-elevated overflow-x-hidden">
                  {/* Left: Mobile Back & Context Tags */}
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setMobileView("list")}
                      data-testid="back-to-notes-list"
                      className="inline-flex lg:hidden h-8 sm:h-8.5 items-center gap-1 rounded-lg sm:rounded-xl border border-border bg-card px-2 sm:px-2.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Collection Selector via shadcn Select */}
                    <div className="min-w-0 max-w-[125px] sm:max-w-[180px] shrink-0">
                      <Select
                        value={activeNote.folderId || "none"}
                        onValueChange={(val) =>
                          handleFolderChange({
                            folderId: val === "none" ? null : val,
                          })
                        }
                      >
                        <SelectTrigger
                          data-testid="note-folder-select"
                          className="h-8 sm:h-8.5 w-full text-xs px-2 sm:px-3"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderIcon className="size-3 text-primary shrink-0" />
                            <SelectValue placeholder="No Collection" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Collection</SelectItem>
                          {folders.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Linked Plan / Scripture Badge */}
                    {activeNote.planTitle && (
                      <span className="hidden md:inline-flex h-8 sm:h-8.5 items-center gap-1.5 rounded-lg sm:rounded-xl border border-primary/20 bg-primary/10 px-2.5 text-xs font-semibold text-primary truncate max-w-[180px]">
                        <Sparkles className="size-3 text-primary shrink-0" />
                        <span className="truncate">{activeNote.planTitle}</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Actions (Autosave, Pin, Archive, Delete) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {/* Save button / indicator */}
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={!isDirty || isSaving}
                      data-testid="save-note-button"
                      className={cn(
                        "inline-flex h-8 sm:h-8.5 items-center gap-1.5 rounded-lg sm:rounded-xl px-2 sm:px-3 text-xs font-semibold transition-all shrink-0",
                        isDirty
                          ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-xs cursor-pointer"
                          : "border border-border/80 bg-card text-muted-foreground cursor-default"
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
                          <span className="hidden sm:inline">Save</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5 text-primary" />
                          <span className="hidden sm:inline">Saved</span>
                        </>
                      )}
                    </button>

                    {/* Pin Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin({ note: activeNote })}
                      className={cn(
                        "size-8 sm:size-8.5 inline-flex items-center justify-center rounded-lg sm:rounded-xl border transition-all cursor-pointer shrink-0",
                        activeNote.isPinned
                          ? "border-primary/30 bg-primary/10 text-primary shadow-2xs"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border-strong"
                      )}
                      title={
                        activeNote.isPinned ? "Unpin note" : "Pin note to top"
                      }
                    >
                      <Pin
                        className={cn(
                          "size-3.5",
                          activeNote.isPinned && "fill-primary"
                        )}
                      />
                    </button>

                    {/* Archive Toggle */}
                    <button
                      type="button"
                      disabled={isArchiving}
                      onClick={() => handleToggleArchive({ note: activeNote })}
                      data-testid="archive-toggle-button"
                      className="size-8 sm:size-8.5 inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border-strong transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      title={
                        activeNote.isArchived
                          ? "Unarchive note"
                          : "Archive note"
                      }
                    >
                      {activeNote.isArchived ? (
                        <ArchiveRestore className="size-3.5" />
                      ) : (
                        <Archive className="size-3.5" />
                      )}
                    </button>

                    {/* Delete Note */}
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteNote({ noteId: activeNote.id })
                      }
                      className="size-8 sm:size-8.5 inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-all cursor-pointer shrink-0"
                      title="Delete note"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Archived Banner Notice */}
                {activeNote.isArchived && (
                  <div
                    data-testid="archived-note-banner"
                    className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-medium"
                  >
                    <span>This reflection is currently archived.</span>
                    <button
                      type="button"
                      disabled={isArchiving}
                      onClick={() => handleToggleArchive({ note: activeNote })}
                      data-testid="restore-note-button"
                      className="text-primary hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Restore to Active
                    </button>
                  </div>
                )}

                {/* Note Editor Surface */}
                <div className="flex-1 p-4 sm:p-7 overflow-y-auto">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Title Input */}
                    <input
                      key={`title-${activeNote.id}`}
                      type="text"
                      placeholder="Note Title..."
                      data-testid="note-title-input"
                      defaultValue={activeNote.title}
                      onChange={(e) =>
                        handleTitleChange({ newTitle: e.target.value })
                      }
                      className="w-full text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground placeholder:text-muted-foreground/60 border-b border-border/40 pb-3 focus:outline-none focus:border-primary/50 transition-colors bg-transparent"
                    />

                    {/* Tiptap Rich Text Editor */}
                    <TiptapEditor
                      key={activeNote.id}
                      content={activeNote.bodyHtml}
                      onChangeAction={handleEditorChange}
                      placeholder="Write your reflections, theological insights, or sermon notes here..."
                      minHeightClass="min-h-[460px]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Sanctuary Empty Desk */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[660px]">
                <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4 shadow-xs">
                  <BookOpen className="size-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Theological Sanctuary &amp; Journal
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Select a reflection from the shelf to continue reading and
                  editing, or create a new journal entry.
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={handleCreateNewNote}
                  leftIcon={<Plus className="size-4" />}
                  className="mt-6 font-semibold shadow-xs"
                >
                  Create New Reflection
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Modals & Dialogs ── */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleCreateNewFolder}
        isPending={isCreatingFolder}
      />

      <DeleteFolderModal
        isOpen={Boolean(folderToDelete)}
        folder={folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onDeleteFolderOnly={handleConfirmDeleteFolderOnly}
        onDeleteFolderAndNotes={handleConfirmDeleteFolderAndNotes}
        isPending={isDeletingFolder}
      />

      <NotesConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.isOpen ? confirmDialog.title : ""}
        description={confirmDialog.isOpen ? confirmDialog.description : ""}
        confirmLabel={
          confirmDialog.isOpen ? confirmDialog.confirmLabel : "Confirm"
        }
        cancelLabel={
          confirmDialog.isOpen ? confirmDialog.cancelLabel : "Cancel"
        }
        variant={confirmDialog.isOpen ? confirmDialog.variant : "warning"}
        onConfirm={confirmDialog.isOpen ? confirmDialog.onConfirm : () => {}}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
}
