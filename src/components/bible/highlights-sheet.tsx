"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ExternalLink,
  Highlighter,
  Loader2,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteHighlightAction,
  getAllUserHighlightsAction,
  type BibleHighlightDetail,
} from "@/actions/highlights";
import {
  deleteNoteAction,
  getPaginatedNotesAction,
  type NoteDetail,
} from "@/actions/notes";
import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";
import { BIBLE_VERSIONS } from "@/lib/bible-versions";
import {
  HIGHLIGHT_COLORS,
  type HighlightColor,
} from "@/lib/schemas/highlights";
import { Input } from "@/components/ui/input";
import { FilterPills } from "@/components/ui/filter-pills";
import { TabsBar } from "@/components/ui/tabs-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const COLOR_DOT_CLASSES: Record<HighlightColor, string> = {
  amber: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

const COLOR_BAR_CLASSES: Record<HighlightColor, string> = {
  amber: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

const COLOR_LABELS: Record<HighlightColor, string> = {
  amber: "Amber",
  green: "Green",
  blue: "Blue",
  rose: "Rose",
  purple: "Purple",
};

function formatHighlightReference({
  highlight,
}: {
  highlight: BibleHighlightDetail;
}): { title: string; versionAbbr: string } {
  const book = PROTESTANT_BIBLE_BOOKS.find(
    (b) => b.id === highlight.bookId.toLowerCase()
  );
  const bookName = book?.name ?? highlight.bookId.toUpperCase();
  const versePart =
    highlight.startVerse === highlight.endVerse
      ? `${highlight.startVerse}`
      : `${highlight.startVerse}–${highlight.endVerse}`;
  const version = BIBLE_VERSIONS.find((v) => v.id === highlight.versionId);

  return {
    title: `${bookName} ${highlight.chapter}:${versePart}`,
    versionAbbr: version?.abbreviation ?? String(highlight.versionId),
  };
}

function formatNoteReference({
  note,
}: {
  note: NoteDetail;
}): { title: string; versionAbbr: string | null } | null {
  if (!note.bookId || !note.chapter || !note.startVerse) {
    return null;
  }
  const book = PROTESTANT_BIBLE_BOOKS.find(
    (b) => b.id === note.bookId?.toLowerCase()
  );
  const bookName = book?.name ?? note.bookId.toUpperCase();
  const versePart =
    note.endVerse && note.endVerse !== note.startVerse
      ? `${note.startVerse}–${note.endVerse}`
      : `${note.startVerse}`;
  const version = note.versionId
    ? BIBLE_VERSIONS.find((v) => v.id === note.versionId)
    : undefined;

  return {
    title: `${bookName} ${note.chapter}:${versePart}`,
    versionAbbr: version?.abbreviation ?? null,
  };
}

export type HighlightsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBookId: string;
  currentBookName: string;
  currentChapter: number;
  onNavigateToHighlight: (params: {
    bookId: string;
    chapter: number;
    versionId: number;
  }) => void;
  onHighlightDeleted: (params: { highlightId: string }) => void;
  onSelectNote: (params: { note: NoteDetail }) => void;
  onNoteDeleted: (params: { noteId: string }) => void;
};

export function HighlightsSheet({
  open,
  onOpenChange,
  currentBookId,
  currentBookName,
  currentChapter,
  onNavigateToHighlight,
  onHighlightDeleted,
  onSelectNote,
  onNoteDeleted,
}: HighlightsSheetProps) {
  const [activeTab, setActiveTab] = useState<"highlights" | "notes">(
    "highlights"
  );
  const [items, setItems] = useState<BibleHighlightDetail[]>([]);
  const [notesList, setNotesList] = useState<NoteDetail[]>([]);
  const [notesPage, setNotesPage] = useState(1);
  const [notesTotalCount, setNotesTotalCount] = useState(0);
  const [hasMoreNotes, setHasMoreNotes] = useState(false);
  const [isLoadingMoreNotes, setIsLoadingMoreNotes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [scopeFilter, setScopeFilter] = useState<"all" | "book">("all");
  const [noteScopeFilter, setNoteScopeFilter] = useState<"chapter" | "all">(
    "chapter"
  );
  const [noteSortBy, setNoteSortBy] = useState<"createdAt" | "book">(
    "createdAt"
  );
  const [noteSortDir, setNoteSortDir] = useState<"asc" | "desc">("desc");
  const [colorFilter, setColorFilter] = useState<HighlightColor | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || activeTab !== "highlights") return;
    let isCancelled = false;

    async function fetchHighlights() {
      setIsLoading(true);
      setIsUnauthorized(false);
      const highlightsResult = await getAllUserHighlightsAction();
      if (isCancelled) return;
      setIsLoading(false);

      if (!highlightsResult.success) {
        if (highlightsResult.error === "Unauthorized") {
          setIsUnauthorized(true);
        } else {
          toast.error(highlightsResult.error);
        }
        setItems([]);
        return;
      }
      setItems(highlightsResult.highlights);
    }

    void fetchHighlights();
    return () => {
      isCancelled = true;
    };
  }, [open, activeTab]);

  useEffect(() => {
    if (!open || activeTab !== "notes") return;
    let isCancelled = false;

    async function fetchFirstNotesPage() {
      setIsLoading(true);
      setIsUnauthorized(false);
      const result = await getPaginatedNotesAction({
        page: 1,
        limit: 15,
        bookId: noteScopeFilter === "chapter" ? currentBookId : null,
        chapter: noteScopeFilter === "chapter" ? currentChapter : null,
        searchQuery: deferredSearchQuery,
        sortBy: noteSortBy,
        sortDir: noteSortDir,
      });
      if (isCancelled) return;
      setIsLoading(false);

      if (!result.success) {
        if (result.error === "Unauthorized") {
          setIsUnauthorized(true);
        } else {
          toast.error(result.error);
        }
        setNotesList([]);
        setNotesTotalCount(0);
        setHasMoreNotes(false);
        setNotesPage(1);
        return;
      }

      setNotesList(result.notes);
      setNotesTotalCount(result.totalCount);
      setHasMoreNotes(result.hasMore);
      setNotesPage(1);
    }

    void fetchFirstNotesPage();
    return () => {
      isCancelled = true;
    };
  }, [
    open,
    activeTab,
    noteScopeFilter,
    currentBookId,
    currentChapter,
    deferredSearchQuery,
    noteSortBy,
    noteSortDir,
  ]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedCurrentBook = currentBookId.toLowerCase();
    return items.filter((item) => {
      if (
        scopeFilter === "book" &&
        item.bookId.toLowerCase() !== normalizedCurrentBook
      ) {
        return false;
      }
      if (colorFilter !== "all" && item.color !== colorFilter) {
        return false;
      }
      if (!query) return true;
      const { title } = formatHighlightReference({ highlight: item });
      return (
        title.toLowerCase().includes(query) ||
        item.selectedText.toLowerCase().includes(query)
      );
    });
  }, [items, scopeFilter, currentBookId, colorFilter, searchQuery]);

  async function handleLoadMoreNotes() {
    if (isLoadingMoreNotes || !hasMoreNotes) return;
    const nextPage = notesPage + 1;
    setIsLoadingMoreNotes(true);
    try {
      const result = await getPaginatedNotesAction({
        page: nextPage,
        limit: 15,
        bookId: noteScopeFilter === "chapter" ? currentBookId : null,
        chapter: noteScopeFilter === "chapter" ? currentChapter : null,
        searchQuery: deferredSearchQuery,
        sortBy: noteSortBy,
        sortDir: noteSortDir,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNotesList((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        const appended = result.notes.filter((n) => !seen.has(n.id));
        return [...prev, ...appended];
      });
      setNotesTotalCount(result.totalCount);
      setHasMoreNotes(result.hasMore);
      setNotesPage(nextPage);
    } finally {
      setIsLoadingMoreNotes(false);
    }
  }

  async function handleDelete({ highlightId }: { highlightId: string }) {
    setDeletingId(highlightId);
    try {
      const result = await deleteHighlightAction({ highlightId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== highlightId));
      onHighlightDeleted({ highlightId });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteNote({ noteId }: { noteId: string }) {
    setDeletingId(noteId);
    try {
      const result = await deleteNoteAction({ noteId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setNotesList((prev) => prev.filter((item) => item.id !== noteId));
      setNotesTotalCount((prev) => Math.max(0, prev - 1));
      onNoteDeleted({ noteId });
      toast.success("Note deleted");
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount =
    activeTab === "highlights" ? items.length : notesTotalCount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} closeOnBack={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background"
      >
        <SheetHeader className="px-5 pt-4 pb-4 border-b border-border/70 space-y-4">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              {activeTab === "highlights" ? (
                <Highlighter className="size-4 text-primary" />
              ) : (
                <StickyNote className="size-4 text-primary" />
              )}
              <span>{activeTab === "highlights" ? "Highlights" : "Notes"}</span>
              {activeCount > 0 ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {activeCount}
                </span>
              ) : null}
            </SheetTitle>

            {activeTab === "notes" ? (
              <Link
                href="/notes"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <span>Open Studio</span>
                <ExternalLink className="size-3" />
              </Link>
            ) : null}
          </div>

          <TabsBar
            activeTab={activeTab}
            onTabChange={({ tab }) => setActiveTab(tab)}
            className="w-full grid grid-cols-2"
            tabs={[
              {
                id: "highlights",
                label: "Highlights",
                icon: <Highlighter className="size-3.5" />,
              },
              {
                id: "notes",
                label: "Notes",
                icon: <StickyNote className="size-3.5" />,
              },
            ]}
          />

          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="size-3.5" />}
            placeholder={
              activeTab === "highlights"
                ? "Search verse or text..."
                : "Search notes or verse..."
            }
            aria-label={
              activeTab === "highlights" ? "Search highlights" : "Search notes"
            }
            className="h-9 text-xs"
          />

          {activeTab === "highlights" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <FilterPills
                  activeFilter={scopeFilter}
                  onFilterChange={({ filter }) => setScopeFilter(filter)}
                  className="w-auto flex-1 pb-0"
                  items={[
                    { id: "all", label: "All Books" },
                    { id: "book", label: `This Book (${currentBookName})` },
                  ]}
                />

                <Select
                  value={colorFilter}
                  onValueChange={(value) =>
                    setColorFilter(value as HighlightColor | "all")
                  }
                >
                  <SelectTrigger
                    aria-label="Filter by highlight color"
                    className="h-8 w-[122px] shrink-0 rounded-xl px-2.5 text-xs"
                  >
                    <SelectValue placeholder="All colors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All colors</SelectItem>
                    {HIGHLIGHT_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${COLOR_DOT_CLASSES[color]}`}
                          />
                          <span>{COLOR_LABELS[color]}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <FilterPills
                activeFilter={noteScopeFilter}
                onFilterChange={({ filter }) => setNoteScopeFilter(filter)}
                className="pb-0"
                items={[
                  {
                    id: "chapter",
                    label: `${currentBookName} ${currentChapter}`,
                  },
                  { id: "all", label: "All Notes" },
                ]}
              />

              <div className="grid grid-cols-2 gap-2.5">
                <Select
                  value={noteSortBy}
                  onValueChange={(value) =>
                    setNoteSortBy(value as "createdAt" | "book")
                  }
                >
                  <SelectTrigger
                    aria-label="Sort notes by"
                    className="h-8 rounded-xl px-2.5 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Sort: Created</SelectItem>
                    <SelectItem value="book">Sort: Book</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={noteSortDir}
                  onValueChange={(value) =>
                    setNoteSortDir(value as "asc" | "desc")
                  }
                >
                  <SelectTrigger
                    aria-label="Sort direction"
                    className="h-8 rounded-xl px-2.5 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Order: Desc</SelectItem>
                    <SelectItem value="asc">Order: Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center text-foreground-dim">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : isUnauthorized ? (
            <div className="rounded-xl border border-border bg-card p-5 text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                {activeTab === "highlights"
                  ? "Sign in to view your highlights"
                  : "Sign in to view your notes"}
              </p>
              <p className="text-xs text-foreground-dim">
                {activeTab === "highlights"
                  ? "Your saved scripture highlights sync across devices once you are signed in."
                  : "Your saved study notes sync across devices once you are signed in."}
              </p>
            </div>
          ) : activeTab === "notes" ? (
            notesList.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1.5">
                <StickyNote className="mx-auto size-6 text-foreground-dim/70" />
                <p className="text-sm font-medium text-foreground">
                  {deferredSearchQuery.trim()
                    ? "No matching notes"
                    : noteScopeFilter === "chapter"
                      ? `No notes in ${currentBookName} ${currentChapter}`
                      : "No notes yet"}
                </p>
                <p className="text-xs text-foreground-dim">
                  {deferredSearchQuery.trim()
                    ? "Try clearing your search or switching to All Notes."
                    : noteScopeFilter === "chapter"
                      ? "Select any verse or phrase while reading to add a note, or switch to All Notes."
                      : "Select any verse or phrase while reading and tap Note to save a reflection."}
                </p>
              </div>
            ) : (
              <>
                {notesList.map((note) => {
                  const ref = formatNoteReference({ note });
                  return (
                    <div
                      key={note.id}
                      className="group relative rounded-r-xl rounded-l-none border border-border bg-card py-3.5 pr-3.5 pl-4 transition-colors hover:bg-muted/40"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-[2px] bg-primary"
                      />
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectNote({ note });
                            onOpenChange(false);
                          }}
                          className="flex-1 text-left focus:outline-none min-w-0"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {note.title}
                            </span>
                            {ref ? (
                              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                <BookOpen className="size-2.5 shrink-0" />
                                {ref.title}
                              </span>
                            ) : null}
                            {ref?.versionAbbr ? (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground-dim">
                                {ref.versionAbbr}
                              </span>
                            ) : null}
                          </div>
                          {note.selectedText ? (
                            <p className="mt-1 line-clamp-1 text-[11px] italic text-foreground-dim">
                              “{note.selectedText}”
                            </p>
                          ) : null}
                          {note.plainTextSnippet ? (
                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground/90">
                              {note.plainTextSnippet}
                            </p>
                          ) : null}
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === note.id}
                          aria-label={`Delete note ${note.title}`}
                          onClick={() => handleDeleteNote({ noteId: note.id })}
                          className="shrink-0 rounded-lg p-1.5 text-foreground-dim transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          {deletingId === note.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {hasMoreNotes ? (
                  <div className="pt-1 text-center space-y-1.5">
                    <button
                      type="button"
                      onClick={handleLoadMoreNotes}
                      disabled={isLoadingMoreNotes}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {isLoadingMoreNotes ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>
                          Load more ({notesList.length} of {notesTotalCount})
                        </span>
                      )}
                    </button>
                  </div>
                ) : null}
              </>
            )
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1.5">
              <Highlighter className="mx-auto size-6 text-foreground-dim/70" />
              <p className="text-sm font-medium text-foreground">
                {items.length === 0
                  ? "No highlights yet"
                  : "No matching highlights"}
              </p>
              <p className="text-xs text-foreground-dim">
                {items.length === 0
                  ? "Tap any verse or select text while reading to highlight it."
                  : "Try clearing your search or color filter."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const { title, versionAbbr } = formatHighlightReference({
                highlight: item,
              });
              return (
                <div
                  key={item.id}
                  className="group relative rounded-r-xl rounded-l-none border border-border bg-card py-3.5 pr-3.5 pl-4 transition-colors hover:bg-muted/40"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-[2px] ${COLOR_BAR_CLASSES[item.color]}`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToHighlight({
                          bookId: item.bookId,
                          chapter: item.chapter,
                          versionId: item.versionId,
                        });
                        onOpenChange(false);
                      }}
                      className="flex-1 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {title}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground-dim">
                          {versionAbbr}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-foreground/90">
                        “{item.selectedText}”
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      aria-label={`Delete highlight ${title}`}
                      onClick={() => handleDelete({ highlightId: item.id })}
                      className="shrink-0 rounded-lg p-1.5 text-foreground-dim transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
