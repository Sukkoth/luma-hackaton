"use client";

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useCallback,
  useDeferredValue,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  LayoutGrid,
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

export type NotesManagerProps = {
  initialNotes: NoteDetail[];
  initialFolders: NoteFolderDetail[];
  defaultPlanId?: string;
  defaultSessionId?: number;
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
  defaultNoteId,
}: NotesManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
  const [activeFolderId, setActiveFolderId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<NoteSortOption>("updated_desc");

  // Target note parameter from props or URL
  const targetNoteId = defaultNoteId || searchParams.get("noteId");

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
    if (targetNoteId) {
      const match = notesList.find((n) => n.id === targetNoteId);
      if (match) {
        setSelectedNoteId(match.id);
        setIsDirty(false);
        setMobileView("editor");
        if (match.isArchived) {
          setActiveTab("archived");
        } else {
          setActiveTab("active");
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

  // New folder dialog
  const [showFolderModal, setShowFolderModal] = useState(false);

  // Custom Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
  });

  // Dedicated Delete Folder Modal state (with keep vs delete notes options)
  const [folderToDelete, setFolderToDelete] = useState<{
    id: string;
    name: string;
    notesCount: number;
  } | null>(null);

  // Switch active note implementation
  const performSelectNote = ({ noteId }: SelectNoteParams) => {
    setSelectedNoteId(noteId);
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

  // Switch active note (guards against accidental loss if dirty with custom modal)
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

  // Explicit Save Handler: ONLY triggers network call when "Save" is clicked (or Cmd/Ctrl+S)
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

  // Handler for title change (marks dirty, NO network call)
  const handleTitleChange = ({ newTitle }: TitleChangeParams) => {
    currentDraftRef.current.title = newTitle;
    if (!isDirty) setIsDirty(true);
  };

  // Handler for Tiptap editor update (marks dirty, NO network call)
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
        currentDraftRef.current = {
          title: res.note.title,
          bodyHtml: res.note.bodyHtml,
          plainText: res.note.plainTextSnippet,
        };
        setIsDirty(false);
        setActiveTab("active");
        setMobileView("editor");
        router.refresh();
      }
    });
  };

  // Create new note with dirty-state confirmation
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
    startTransition(async () => {
      const res = await deleteNoteAction({ noteId });
      if (res.success) {
        const nextList = notesList.filter((n) => n.id !== noteId);
        setNotesList(nextList);
        const nextActive = nextList.find((n) =>
          activeTab === "archived" ? n.isArchived : !n.isArchived
        );
        setSelectedNoteId(nextActive?.id ?? null);
        setIsDirty(false);
        setMobileView("list");
        router.refresh();
      }
    });
  };

  // Delete note with custom confirmation modal
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
        setIsDirty(false);
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

  // Switch folder filter implementation
  const performSwitchFolder = ({ folderId }: SwitchFolderParams) => {
    setActiveTab("active");
    setActiveFolderId(folderId);
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

    const first = sorted[0] ?? null;
    setSelectedNoteId(first?.id ?? null);
    if (first) {
      currentDraftRef.current = {
        title: first.title,
        bodyHtml: first.bodyHtml,
        plainText: first.plainTextSnippet,
      };
    }
  };

  // Switch folder filter with dirty-state confirmation
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

  // Create folder form handler (uncontrolled form via FormData)
  const handleCreateFolderSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") || "").trim();
    if (!name) return;

    startTransition(async () => {
      const res = await createFolderAction({ name });
      if (res.success && res.folder) {
        setFolders((prev) => [...prev, res.folder]);
        setShowFolderModal(false);
      }
    });
  };

  // Delete folder implementation
  const performDeleteFolder = ({
    folderId,
    deleteNotes,
  }: {
    folderId: string;
    deleteNotes: boolean;
  }) => {
    startTransition(async () => {
      const res = await deleteFolderAction({ folderId, deleteNotes });
      if (res.success) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        if (deleteNotes) {
          setNotesList((prev) => prev.filter((n) => n.folderId !== folderId));
        } else {
          setNotesList((prev) =>
            prev.map((n) =>
              n.folderId === folderId
                ? { ...n, folderId: null, folderName: null }
                : n
            )
          );
        }
        if (activeFolderId === folderId) {
          performSwitchFolder({ folderId: "all" });
        }
        setFolderToDelete(null);
      }
    });
  };

  // Delete folder handler: opens dedicated custom modal with keep vs delete notes options
  const handleDeleteFolder = ({ folderId }: DeleteFolderItemParams) => {
    const targetFolder = folders.find((f) => f.id === folderId);
    if (!targetFolder) return;
    const realCount = notesList.filter(
      (n) => !n.isArchived && n.folderId === folderId
    ).length;
    setFolderToDelete({
      id: targetFolder.id,
      name: targetFolder.name,
      notesCount: realCount,
    });
  };

  // Open folder from Folder View
  const handleOpenFolder = ({ folderId }: OpenFolderParams) => {
    handleSwitchFolder({ folderId });
  };

  // Counts (single pass)
  let activeNotesCount = 0;
  let archivedNotesCount = 0;
  let uncategorizedNotesCount = 0;

  for (const n of notesList) {
    if (n.isArchived) {
      archivedNotesCount++;
    } else {
      activeNotesCount++;
      if (n.folderId === null) {
        uncategorizedNotesCount++;
      }
    }
  }

  const currentFolder = folders.find((f) => f.id === activeFolderId) ?? null;

  // Filter notes by active tab, folder, and search query
  const filteredNotes = notesList.filter((note) => {
    if (activeTab === "archived") {
      if (!note.isArchived) return false;
    } else {
      if (note.isArchived) return false;
    }

    if (activeTab === "active") {
      if (activeFolderId === "uncategorized" && note.folderId !== null) {
        return false;
      }
      if (
        activeFolderId !== "all" &&
        activeFolderId !== "uncategorized" &&
        note.folderId !== activeFolderId
      ) {
        return false;
      }
    }

    if (deferredSearchQuery.trim().length > 0) {
      const q = deferredSearchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchBody = note.plainTextSnippet.toLowerCase().includes(q);
      const matchPlan = note.planTitle?.toLowerCase().includes(q);
      const matchFolder = note.folderName?.toLowerCase().includes(q);
      return matchTitle || matchBody || matchPlan || matchFolder;
    }

    return true;
  });

  // Sort notes by chosen option, preserving pinned notes at top
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
      <div className="glass-panel h-[calc(100dvh-10rem)] md:h-[calc(100dvh-5.5rem)] max-h-[1150px] rounded-3xl border border-black/8 shadow-sm dark:border-white/10 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-black/6 dark:divide-white/8">
        {/* ================= LEFT PANE: NOTEBOOK SHELF & EXPLORER ================= */}
        <aside
          className={`w-full md:w-[320px] lg:w-[350px] xl:w-[380px] shrink-0 flex flex-col min-h-0 bg-white/45 dark:bg-[#121217]/60 backdrop-blur-md ${
            mobileView === "editor" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Shelf Header */}
          <div className="px-4 py-3.5 border-b border-black/6 dark:border-white/6 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                Study Journal & Notes
              </h1>
              <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                {activeNotesCount} {activeNotesCount === 1 ? "note" : "notes"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowFolderModal(true)}
                disabled={isPending}
                data-testid="create-new-folder-button"
                aria-label="New Folder"
                title="New Folder"
                className="flex size-9 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#555555] shadow-2xs hover:border-white hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white transition-all cursor-pointer"
              >
                <FolderPlus className="size-4.5 text-[#82ADD4]" />
                <span className="sr-only">New Folder</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNewNote}
                disabled={isPending}
                data-testid="create-new-note-button"
                aria-label="New Note"
                title="New Note"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-black px-4 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90 cursor-pointer"
              >
                <Plus className="size-4" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Strip */}
          <div
            data-testid="notes-folders-filter"
            className="px-3.5 pt-3 pb-2.5 border-b border-black/6 dark:border-white/6 space-y-2 shrink-0"
          >
            {/* Full-width Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={
                  activeTab === "archived"
                    ? "Search archived..."
                    : "Search reflections..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="notes-search-input"
                className="h-10 w-full rounded-xl border border-white/80 bg-white/50 pr-8 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-white focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/4 dark:text-white dark:placeholder:text-[#6B7280] dark:focus:border-white/20 dark:focus:bg-white/8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white p-1"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs (share space evenly) + Fixed Sort Button at End */}
            <div className="flex items-center gap-1.5 pt-0.5 w-full">
              <div className="grid flex-1 grid-cols-3 gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleSwitchFolder({ folderId: "all" })}
                  data-testid="tab-all-notes"
                  className={`inline-flex h-9 w-full min-w-0 items-center justify-center rounded-xl px-1.5 text-[12px] sm:text-[12.5px] backdrop-blur-md transition-all cursor-pointer ${
                    activeTab === "active" && activeFolderId === "all"
                      ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                      : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  <span className="truncate">All ({activeNotesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("folders")}
                  data-testid="tab-folders-view"
                  className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 text-[12px] sm:text-[12.5px] backdrop-blur-md transition-all cursor-pointer ${
                    activeTab === "folders"
                      ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                      : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  <LayoutGrid className="size-3.5 text-[#82ADD4] shrink-0" />
                  <span className="truncate">Folders ({folders.length})</span>
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
                  className={`inline-flex h-9 w-full min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 text-[12px] sm:text-[12.5px] backdrop-blur-md transition-all cursor-pointer ${
                    activeTab === "archived"
                      ? "border-amber-500/40 bg-amber-500/20 font-medium text-amber-800 shadow-xs dark:border-amber-500/30 dark:bg-amber-500/25 dark:text-amber-200"
                      : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  <Archive className="size-3.5 shrink-0" />
                  <span className="truncate">
                    Archive ({archivedNotesCount})
                  </span>
                </button>
              </div>

              {/* Icon-Only Sort Button */}
              <div
                title={`Sort notes: ${
                  sortBy === "updated_desc"
                    ? "Newest first"
                    : sortBy === "updated_asc"
                      ? "Oldest first"
                      : sortBy === "created_desc"
                        ? "Created date (newest)"
                        : "Created date (oldest)"
                }`}
                className="group relative flex size-9 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-[#555555] shadow-2xs backdrop-blur-md transition-all hover:border-white hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer shrink-0"
              >
                <ArrowUpDown className="pointer-events-none size-4 text-[#555555] group-hover:text-black dark:text-[#9CA3AF] dark:group-hover:text-white transition-colors" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as NoteSortOption)}
                  data-testid="notes-sort-select"
                  aria-label="Sort notes"
                  className="absolute inset-0 size-full opacity-0 cursor-pointer"
                  title="Sort order"
                >
                  <option
                    value="updated_desc"
                    className="text-black dark:bg-[#1c1c22] dark:text-white"
                  >
                    Newest
                  </option>
                  <option
                    value="updated_asc"
                    className="text-black dark:bg-[#1c1c22] dark:text-white"
                  >
                    Oldest
                  </option>
                  <option
                    value="created_desc"
                    className="text-black dark:bg-[#1c1c22] dark:text-white"
                  >
                    Created (New)
                  </option>
                  <option
                    value="created_asc"
                    className="text-black dark:bg-[#1c1c22] dark:text-white"
                  >
                    Created (Old)
                  </option>
                </select>
              </div>
            </div>

            {/* Folder Chips Quick Filter Track */}
            {activeTab === "active" && folders.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSwitchFolder({ folderId: "all" })}
                  className={`shrink-0 inline-flex h-8 items-center rounded-lg px-3 text-[12px] backdrop-blur-md transition-all cursor-pointer ${
                    activeFolderId === "all"
                      ? "border border-white/90 bg-white font-medium text-black shadow-2xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                      : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF]"
                  }`}
                >
                  All
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleSwitchFolder({ folderId: folder.id })}
                    className={`shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] backdrop-blur-md transition-all cursor-pointer ${
                      activeFolderId === folder.id
                        ? "border border-white/90 bg-white font-medium text-black shadow-2xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                        : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF]"
                    }`}
                  >
                    <FolderIcon className="size-3 text-[#82ADD4]" />
                    <span className="truncate max-w-[120px]">
                      {folder.name}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {folder.notesCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shelf Body (Cards) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2">
            {activeTab === "folders" ? (
              /* FOLDERS GRID VIEW */
              <div data-testid="folders-view-grid" className="space-y-2">
                <div className="flex items-center justify-between px-1 py-0.5 text-[11px] font-semibold text-[#555555] dark:text-[#9CA3AF] uppercase tracking-wider">
                  <span>Collections</span>
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(true)}
                    className="text-[#507ea6] dark:text-[#82ADD4] hover:underline normal-case text-[11px] font-medium"
                  >
                    + New
                  </button>
                </div>

                {/* All Notes Folder Card */}
                <div
                  onClick={() => handleOpenFolder({ folderId: "all" })}
                  className="group flex items-center justify-between p-3 rounded-2xl border border-white/70 bg-white/60 hover:bg-white hover:border-white/90 transition-all cursor-pointer dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/8 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-7.5 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/25 dark:text-[#82ADD4] shrink-0">
                      <FileText className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-medium text-black dark:text-white truncate">
                        All Notes
                      </h4>
                      <p className="text-[10.5px] text-[#777777] dark:text-[#9CA3AF]">
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
                  className="group flex items-center justify-between p-3 rounded-2xl border border-white/70 bg-white/60 hover:bg-white hover:border-white/90 transition-all cursor-pointer dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/8 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-7.5 items-center justify-center rounded-xl bg-black/5 text-[#555555] dark:bg-white/10 dark:text-[#9CA3AF] shrink-0">
                      <FolderIcon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-medium text-black dark:text-white truncate">
                        Uncategorized
                      </h4>
                      <p className="text-[10.5px] text-[#777777] dark:text-[#9CA3AF]">
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
                    className="group flex items-center justify-between p-3 rounded-2xl border border-white/70 bg-white/60 hover:bg-white hover:border-white/90 transition-all cursor-pointer dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/8 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-7.5 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/25 dark:text-[#82ADD4] shrink-0">
                        <FolderIcon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-medium text-black dark:text-white truncate">
                          {folder.name}
                        </h4>
                        <p className="text-[10.5px] text-[#777777] dark:text-[#9CA3AF]">
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
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* NOTES LIST CARDS */
              <>
                {/* Active Folder Filter Bar Banner */}
                {activeFolderId !== "all" && activeTab === "active" && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#82ADD4]/10 border border-[#82ADD4]/20 text-[11px] text-[#507ea6] dark:text-[#82ADD4]">
                    <div className="flex items-center gap-1.5 truncate">
                      <FolderIcon className="size-3 shrink-0" />
                      <span className="font-semibold text-black dark:text-white truncate">
                        {currentFolder?.name ?? "Uncategorized"}
                      </span>
                      <span>({filteredNotes.length})</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {currentFolder && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteFolder({ folderId: currentFolder.id })
                          }
                          className="text-red-500 hover:text-red-700 font-medium hover:underline cursor-pointer"
                          title="Delete this folder"
                        >
                          Delete Folder
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSwitchFolder({ folderId: "all" })}
                        className="font-medium underline shrink-0 hover:opacity-80 cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                )}

                {sortedNotes.length === 0 ? (
                  <div className="py-14 px-4 text-center">
                    <FileText className="mx-auto size-7 text-[#888888] opacity-60" />
                    <p className="mt-2.5 text-[12.5px] font-medium text-black dark:text-white">
                      {activeTab === "archived"
                        ? "No archived notes"
                        : "No notes found"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                      {searchQuery
                        ? "Try different keywords"
                        : activeTab === "archived"
                          ? "Archived notes will appear here"
                          : "Create a note to start your journal"}
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
                        className={`group relative cursor-pointer rounded-2xl p-3.5 border transition-all ${
                          isSelected
                            ? "border-[#82ADD4]/70 bg-white shadow-xs dark:border-[#82ADD4]/50 dark:bg-[#1c1c24]"
                            : "border-white/60 bg-white/40 hover:bg-white/80 hover:border-white dark:border-white/5 dark:bg-white/2 dark:hover:bg-white/5"
                        }`}
                      >
                        {/* Active Indicator Bar */}
                        {isSelected && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#82ADD4]" />
                        )}

                        <div className="flex items-start justify-between gap-1.5 pl-1.5">
                          <h3 className="line-clamp-1 text-[13.5px] font-semibold text-black dark:text-white">
                            {note.title || "Untitled Note"}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {note.isArchived && (
                              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                Archived
                              </span>
                            )}
                            {note.isPinned && (
                              <Pin className="size-3 text-[#82ADD4]" />
                            )}
                          </div>
                        </div>

                        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#555555] dark:text-[#9CA3AF] pl-1.5">
                          {note.plainTextSnippet || "No additional text"}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-1.5">
                          <span className="text-[10px] text-[#888888] dark:text-[#777777] font-mono">
                            {dateToDisplay}
                          </span>

                          {note.folderName && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-black/4 px-1.5 py-0.5 text-[9.5px] font-medium text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF] truncate max-w-[110px]">
                              <FolderIcon className="size-2 text-[#82ADD4]" />
                              <span className="truncate">
                                {note.folderName}
                              </span>
                            </span>
                          )}

                          {note.planTitle && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#82ADD4]/15 px-1.5 py-0.5 text-[9.5px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4] truncate max-w-[120px]">
                              <Sparkles className="size-2" />
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
          className={`flex-1 min-w-0 flex flex-col min-h-0 bg-neutral-100/35 dark:bg-black/25 backdrop-blur-xs ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {activeNote ? (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Top Bar: Navigation & Action Buttons */}
              <div className="h-14 px-4 sm:px-6 border-b border-black/6 dark:border-white/6 flex items-center justify-between gap-2.5 shrink-0 bg-white/60 dark:bg-white/[0.02] backdrop-blur-md">
                {/* Left Group: Mobile Back Button or Desktop Location */}
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    data-testid="back-to-notes-list"
                    className="flex md:hidden h-9 items-center gap-1.5 rounded-xl border border-white/80 bg-white/70 px-3.5 text-[13px] font-medium text-black shadow-2xs backdrop-blur-md transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                    <span>Notes</span>
                  </button>

                  <div className="hidden md:flex items-center gap-2 text-[13px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                    <FileText className="size-4 text-[#82ADD4]" />
                    <span>Reflection Editor</span>
                  </div>
                </div>

                {/* Right Group: Save, Pin, Archive, Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Save button - matches primary button pattern across Luma */}
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={!isDirty || isSaving || isPending}
                    data-testid="save-note-button"
                    className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition-all ${
                      isDirty
                        ? "bg-black text-white shadow-xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 cursor-pointer font-semibold"
                        : "border border-black/8 bg-black/4 text-[#777777] dark:border-white/10 dark:bg-white/5 dark:text-[#888888] cursor-not-allowed opacity-60"
                    }`}
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
                        <Check className="size-3.5 text-[#507ea6] dark:text-[#82ADD4]" />
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
                    className={`flex size-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                      activeNote.isPinned
                        ? "border-[#82ADD4]/40 bg-[#82ADD4]/15 text-[#507ea6] dark:text-[#82ADD4]"
                        : "border-white/80 bg-white/70 text-[#555555] shadow-2xs hover:border-white hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    <Pin className="size-4" />
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
                    className={`flex size-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                      activeNote.isArchived
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "border-white/80 bg-white/70 text-[#555555] shadow-2xs hover:border-white hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF] dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
                    }`}
                  >
                    {activeNote.isArchived ? (
                      <ArchiveRestore className="size-4" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteNote({ noteId: activeNote.id })}
                    title="Delete note"
                    aria-label="Delete note"
                    className="flex size-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 transition-all hover:bg-red-500/20 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Archived Alert Banner */}
              {activeNote.isArchived && (
                <div
                  data-testid="archived-note-banner"
                  className="mx-4 mt-3 sm:mx-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 flex items-center justify-between gap-2 text-[12.5px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200 shrink-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Archive className="size-4 shrink-0 text-amber-600" />
                    <span className="truncate">This note is archived.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleArchive({ note: activeNote })}
                    data-testid="restore-note-button"
                    className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-black px-4 text-[12px] font-semibold text-white shadow-xs hover:bg-black/85 cursor-pointer dark:bg-white dark:text-black dark:hover:bg-white/90 shrink-0"
                  >
                    <ArchiveRestore className="size-3.5" />
                    <span>Restore Note</span>
                  </button>
                </div>
              )}

              {/* Scrollable Journal Canvas */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-10 flex flex-col items-center">
                {/* Physical Journal Page Sheet */}
                <div className="w-full max-w-3xl bg-white dark:bg-[#15151b] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] p-6 sm:p-10 lg:p-12 space-y-5 min-h-[560px]">
                  {/* Journal Document Metadata Strip: Folder Selector + Plan Link + Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Folder Selector Dropdown Tag */}
                      <div className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.06] dark:hover:bg-white/10 px-2.5 text-[12px] font-medium text-neutral-700 dark:text-neutral-300 transition-colors">
                        <FolderIcon className="size-3.5 text-[#82ADD4] shrink-0" />
                        <select
                          value={activeNote.folderId || ""}
                          data-testid="note-folder-select"
                          onChange={(e) =>
                            handleFolderChange({
                              folderId: e.target.value || null,
                            })
                          }
                          className="bg-transparent focus:outline-hidden font-medium text-black dark:text-white cursor-pointer"
                        >
                          <option value="" className="dark:bg-[#1f1f23]">
                            No Folder
                          </option>
                          {folders.map((f) => (
                            <option
                              key={f.id}
                              value={f.id}
                              className="dark:bg-[#1f1f23]"
                            >
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Linked Plan Chip */}
                      {activeNote.planTitle && (
                        <div className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#82ADD4]/15 px-2.5 text-[11.5px] font-medium text-[#416e94] dark:text-[#82ADD4]">
                          <Sparkles className="size-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {activeNote.planTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Updated Timestamp */}
                    <span className="text-[12px] text-neutral-400 dark:text-neutral-500 font-normal">
                      Updated{" "}
                      {new Date(activeNote.updatedAt).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  {/* Tiptap Rich-Text Editor with Docked Toolbar and Title */}
                  <TiptapEditor
                    key={`editor-${activeNote.id}`}
                    content={activeNote.bodyHtml}
                    onChangeAction={handleEditorChange}
                    placeholder="Write your study reflections, cross-references, or devotions..."
                    titleSlot={
                      <input
                        type="text"
                        placeholder="Note Title..."
                        defaultValue={activeNote.title}
                        key={activeNote.id}
                        onChange={(e) =>
                          handleTitleChange({ newTitle: e.target.value })
                        }
                        data-testid="note-title-input"
                        className="w-full bg-transparent text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-neutral-900 placeholder:text-neutral-300 focus:outline-hidden dark:text-neutral-50 dark:placeholder:text-neutral-700 leading-tight border-none p-0"
                      />
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Canvas */
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center">
              <span className="flex size-16 items-center justify-center rounded-3xl bg-white dark:bg-white/5 border border-black/6 dark:border-white/8 shadow-2xs text-[#888888]">
                <FileText className="size-8 text-[#82ADD4]" />
              </span>
              <h2 className="mt-4 text-[17px] font-semibold text-black dark:text-white">
                {activeTab === "archived"
                  ? "No note selected"
                  : "Select a note to read or edit"}
              </h2>
              <p className="mt-1.5 max-w-xs text-[12px] text-[#777777] dark:text-[#9CA3AF] leading-relaxed">
                {activeTab === "archived"
                  ? "Pick an archived note from the left to read or restore it."
                  : "Choose a reflection from the explorer or create a new journal entry to begin."}
              </p>
              {activeTab !== "archived" && (
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  disabled={isPending}
                  className="mt-5 inline-flex h-9.5 items-center gap-2 rounded-xl bg-black px-4.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Create New Note</span>
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal: New Folder Dialog */}
      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleCreateFolderSubmit}
        isPending={isPending}
      />

      {/* Reusable Custom Confirmation Modal */}
      <NotesConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.isOpen ? confirmDialog.title : ""}
        description={confirmDialog.isOpen ? confirmDialog.description : ""}
        confirmLabel={confirmDialog.isOpen ? confirmDialog.confirmLabel : ""}
        cancelLabel={
          confirmDialog.isOpen ? confirmDialog.cancelLabel : "Cancel"
        }
        variant={confirmDialog.isOpen ? confirmDialog.variant : "default"}
        onConfirm={confirmDialog.isOpen ? confirmDialog.onConfirm : () => {}}
        onCancel={() => setConfirmDialog({ isOpen: false })}
        isPending={isPending}
      />

      {/* Dedicated Delete Folder Modal (with Keep Notes vs Delete All Notes option) */}
      <DeleteFolderModal
        isOpen={folderToDelete !== null}
        folder={folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onDeleteFolderOnly={() => {
          if (folderToDelete) {
            performDeleteFolder({
              folderId: folderToDelete.id,
              deleteNotes: false,
            });
          }
        }}
        onDeleteFolderAndNotes={() => {
          if (folderToDelete) {
            performDeleteFolder({
              folderId: folderToDelete.id,
              deleteNotes: true,
            });
          }
        }}
        isPending={isPending}
      />
    </>
  );
}
