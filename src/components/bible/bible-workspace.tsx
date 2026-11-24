"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  X,
  ArrowLeft,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";
import {
  BIBLE_VERSIONS,
  type BibleVersion,
  detectDefaultVersion,
  saveSelectedVersion,
  buildBibleComPath,
  isBookSupportedInSixtySixBookVersions,
} from "@/lib/bible-versions";
import { useTheme } from "@/components/theme/theme-provider";
import { togglePlanReadingItemAction } from "@/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const FONT_SIZE_STORAGE_KEY = "luma-bible-font-size";
const LAST_READ_STORAGE_KEY = "luma-last-read";
const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 32;

const OT_BOOKS = PROTESTANT_BIBLE_BOOKS.filter((b) => b.testament === "OT");
const NT_BOOKS = PROTESTANT_BIBLE_BOOKS.filter((b) => b.testament === "NT");

type FlattenedPlanReading = {
  id: string;
  bookId: string;
  bookName?: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  displayText?: string | null;
  isCompleted: boolean;
  sessionIndex: number;
  sessionTitle: string;
};

type PlanContextData = {
  plan: { id: string; title: string };
  reading: FlattenedPlanReading;
  flattenedReadings: ReadonlyArray<FlattenedPlanReading>;
};

type LastRead = {
  bookId: string;
  chapter: number;
  versionId: number;
  timestamp: number;
};

function getStoredFontSize(): number {
  if (typeof window === "undefined") return DEFAULT_FONT_SIZE;
  try {
    const raw = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SIZE;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return DEFAULT_FONT_SIZE;
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

function saveStoredFontSize({ fontSize }: { fontSize: number }): void {
  try {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
  } catch {
    // Ignore storage restrictions
  }
}

function getStoredLastRead(): LastRead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_READ_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastRead;
  } catch {
    return null;
  }
}

function saveStoredLastRead({
  bookId,
  chapter,
  versionId,
}: {
  bookId: string;
  chapter: number;
  versionId: number;
}): void {
  try {
    localStorage.setItem(
      LAST_READ_STORAGE_KEY,
      JSON.stringify({ bookId, chapter, versionId, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage restrictions
  }
}

export function BibleWorkspace() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  // URL state managed atomically with nuqs
  const [queryState, setQueryState] = useQueryStates({
    book: parseAsString.withDefault("gen"),
    ch: parseAsInteger.withDefault(1),
    v: parseAsInteger,
    plan: parseAsString,
    readingId: parseAsString,
    startVerse: parseAsInteger,
    endVerse: parseAsInteger,
  });

  const {
    book: bookParam,
    ch: chapterParam,
    v: versionParam,
    plan: planIdParam,
    readingId: readingIdParam,
    startVerse: startVerseParam,
    endVerse: endVerseParam,
  } = queryState;

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [storedVersionId, setStoredVersionId] = useState<number | null>(null);
  const [iframeInit, setIframeInit] = useState<{
    theme: string;
    fontSize: number;
  } | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [planContext, setPlanContext] = useState<PlanContextData | null>(null);
  const [activeTestamentOverride, setActiveTestamentOverride] = useState<
    "OT" | "NT" | null
  >(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const hasRestoredLastReadRef = useRef(false);
  const hasHydratedPrefsRef = useRef(false);

  // Resolve active book & chapter
  const normalizedBookId = bookParam.toLowerCase();
  const activeBookIndex = PROTESTANT_BIBLE_BOOKS.findIndex(
    (b) => b.id === normalizedBookId
  );
  const activeBook =
    activeBookIndex >= 0
      ? PROTESTANT_BIBLE_BOOKS[activeBookIndex]
      : PROTESTANT_BIBLE_BOOKS[0];
  const activeChapter = Math.min(
    activeBook.chapters,
    Math.max(1, chapterParam || 1)
  );

  // Resolve selected Bible version (hydration-safe)
  const selectedVersion: BibleVersion = useMemo(() => {
    if (versionParam != null) {
      const match = BIBLE_VERSIONS.find((ver) => ver.id === versionParam);
      if (match) return match;
    }
    if (storedVersionId != null) {
      const match = BIBLE_VERSIONS.find((ver) => ver.id === storedVersionId);
      if (match) return match;
    }
    return (
      BIBLE_VERSIONS.find((ver) => ver.id === 111) ?? BIBLE_VERSIONS[0]
    );
  }, [versionParam, storedVersionId]);

  // Hydrate client-only preferences (fontSize, saved version, initial iframe theme) after mount
  useEffect(() => {
    if (hasHydratedPrefsRef.current) return;
    const timer = setTimeout(() => {
      hasHydratedPrefsRef.current = true;
      const storedSize = getStoredFontSize();
      const detectedVersion = detectDefaultVersion({});
      setFontSize(storedSize);
      setStoredVersionId(detectedVersion.id);
      setIframeInit({ theme: resolvedTheme, fontSize: storedSize });
    }, 0);
    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  // Derived testament tab: follows user click override or active book's testament
  const activeTestament: "OT" | "NT" =
    activeTestamentOverride ?? activeBook.testament;

  // Restore last read on initial visit when no explicit book/plan query is set
  useEffect(() => {
    if (hasRestoredLastReadRef.current) return;
    hasRestoredLastReadRef.current = true;
    if (typeof window === "undefined") return;

    const search = new URLSearchParams(window.location.search);
    if (search.has("book") || search.has("ch") || search.has("plan")) return;

    const last = getStoredLastRead();
    if (!last) return;
    const matched = PROTESTANT_BIBLE_BOOKS.find(
      (b) => b.id === last.bookId.toLowerCase()
    );
    if (!matched) return;

    void setQueryState({
      book: matched.id,
      ch: Math.min(matched.chapters, Math.max(1, last.chapter || 1)),
    }).catch(() => {});
  }, [setQueryState]);

  // Persist last read in standalone mode
  useEffect(() => {
    if (planIdParam) return;
    saveStoredLastRead({
      bookId: activeBook.id,
      chapter: activeChapter,
      versionId: selectedVersion.id,
    });
  }, [planIdParam, activeBook.id, activeChapter, selectedVersion.id]);

  // Fetch plan context when ?plan=...&readingId=... is present
  useEffect(() => {
    if (!planIdParam || !readingIdParam) {
      const timer = setTimeout(() => {
        setPlanContext(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isCancelled = false;

    async function loadPlanContext() {
      try {
        const response = await fetch(
          `/api/bible/plan-context?planId=${encodeURIComponent(
            planIdParam!
          )}&readingId=${encodeURIComponent(readingIdParam!)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          if (response.status === 403) {
            router.replace(`/plans/${planIdParam}`);
            return;
          }
          if (!isCancelled) setPlanContext(null);
          return;
        }
        const data = (await response.json()) as PlanContextData;
        if (!isCancelled) {
          setPlanContext(data);
        }
      } catch {
        if (!isCancelled) setPlanContext(null);
      }
    }

    void loadPlanContext();
    return () => {
      isCancelled = true;
    };
  }, [planIdParam, readingIdParam, router]);

  // Sync theme to iframe without reloading
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_THEME", theme: resolvedTheme },
        window.location.origin
      );
    }
  }, [resolvedTheme]);

  // Sync font size to iframe without reloading
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_FONT_SIZE", fontSize },
        window.location.origin
      );
    }
  }, [fontSize]);

  // Plan navigation state
  const flattenedReadings = useMemo(
    () => planContext?.flattenedReadings ?? [],
    [planContext]
  );

  const planReadingIndex = useMemo(() => {
    if (!planContext || !readingIdParam) return -1;
    return flattenedReadings.findIndex((r) => r.id === readingIdParam);
  }, [planContext, readingIdParam, flattenedReadings]);

  const activePlanReading =
    planReadingIndex >= 0
      ? flattenedReadings[planReadingIndex]
      : planContext?.reading ?? null;

  // Determine current passage to load
  const currentBookId = activePlanReading
    ? activePlanReading.bookId.toLowerCase()
    : normalizedBookId;
  const currentChapter = activePlanReading
    ? activePlanReading.chapter
    : activeChapter;
  const currentStartVerse = activePlanReading
    ? activePlanReading.startVerse
    : startVerseParam ?? undefined;
  const currentEndVerse = activePlanReading
    ? activePlanReading.endVerse
    : endVerseParam ?? undefined;

  const isBookSupported = isBookSupportedInSixtySixBookVersions({
    bookId: currentBookId,
  });

  const biblePath = isBookSupported
    ? buildBibleComPath({
        versionId: selectedVersion.id,
        bookId: currentBookId,
        chapter: currentChapter,
        startVerse: currentStartVerse,
        endVerse: currentEndVerse,
      })
    : "";

  const iframeSrc =
    biblePath && iframeInit
      ? `/api/bible-proxy?path=${encodeURIComponent(biblePath)}&theme=${iframeInit.theme}&fontSize=${iframeInit.fontSize}`
      : "";

  const isIframeLoading = Boolean(iframeSrc) && loadedSrc !== iframeSrc;

  // Standalone previous / next targets
  const standaloneNav = useMemo(() => {
    const bookIdx = activeBookIndex >= 0 ? activeBookIndex : 0;
    const book = PROTESTANT_BIBLE_BOOKS[bookIdx];

    const prev =
      activeChapter > 1
        ? { bookId: book.id, chapter: activeChapter - 1 }
        : bookIdx > 0
          ? {
              bookId: PROTESTANT_BIBLE_BOOKS[bookIdx - 1].id,
              chapter: PROTESTANT_BIBLE_BOOKS[bookIdx - 1].chapters,
            }
          : null;

    const next =
      activeChapter < book.chapters
        ? { bookId: book.id, chapter: activeChapter + 1 }
        : bookIdx < PROTESTANT_BIBLE_BOOKS.length - 1
          ? {
              bookId: PROTESTANT_BIBLE_BOOKS[bookIdx + 1].id,
              chapter: 1,
            }
          : null;

    return { prev, next };
  }, [activeBookIndex, activeChapter]);

  const isPlanMode = Boolean(planContext && activePlanReading);
  const hideBookSelector = Boolean(planIdParam && readingIdParam);

  const hasPrev = isPlanMode
    ? planReadingIndex > 0
    : Boolean(standaloneNav.prev);
  const hasNext = isPlanMode
    ? planReadingIndex >= 0 && planReadingIndex < flattenedReadings.length - 1
    : Boolean(standaloneNav.next);

  const navigateToBookChapter = useCallback(
    ({ nextBookId, nextChapter }: { nextBookId: string; nextChapter: number }) => {
      setActiveTestamentOverride(null);
      setExpandedBookId(null);
      setIsMobileDrawerOpen(false);
      setIsDesktopSidebarOpen(false);
      void setQueryState({
        book: nextBookId,
        ch: nextChapter,
        startVerse: null,
        endVerse: null,
        ...(readingIdParam ? { readingId: null } : {}),
      }).catch(() => {});
    },
    [setQueryState, readingIdParam]
  );

  const handlePrev = useCallback(() => {
    if (!hasPrev) return;

    if (isPlanMode) {
      const prevItem = flattenedReadings[planReadingIndex - 1];
      if (!prevItem) return;
      setActiveTestamentOverride(null);
      void setQueryState({
        book: prevItem.bookId.toLowerCase(),
        ch: prevItem.chapter,
        readingId: prevItem.id,
        startVerse: prevItem.startVerse ?? null,
        endVerse: prevItem.endVerse ?? null,
      }).catch(() => {});
      return;
    }

    if (standaloneNav.prev) {
      navigateToBookChapter({
        nextBookId: standaloneNav.prev.bookId,
        nextChapter: standaloneNav.prev.chapter,
      });
    }
  }, [
    hasPrev,
    isPlanMode,
    flattenedReadings,
    planReadingIndex,
    standaloneNav.prev,
    setQueryState,
    navigateToBookChapter,
  ]);

  const handleNext = useCallback(() => {
    if (!hasNext) return;

    if (isPlanMode) {
      const nextItem = flattenedReadings[planReadingIndex + 1];
      if (!nextItem) return;
      setActiveTestamentOverride(null);
      void setQueryState({
        book: nextItem.bookId.toLowerCase(),
        ch: nextItem.chapter,
        readingId: nextItem.id,
        startVerse: nextItem.startVerse ?? null,
        endVerse: nextItem.endVerse ?? null,
      }).catch(() => {});
      return;
    }

    if (standaloneNav.next) {
      navigateToBookChapter({
        nextBookId: standaloneNav.next.bookId,
        nextChapter: standaloneNav.next.chapter,
      });
    }
  }, [
    hasNext,
    isPlanMode,
    flattenedReadings,
    planReadingIndex,
    standaloneNav.next,
    setQueryState,
    navigateToBookChapter,
  ]);

  // Keyboard shortcuts (ArrowLeft / ArrowRight when not typing)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, handlePrev, handleNext]);

  // Background prefetch adjacent chapter/reading
  useEffect(() => {
    if (isIframeLoading) return;
    const controller = new AbortController();

    const nextTarget = isPlanMode
      ? flattenedReadings[planReadingIndex + 1]
      : standaloneNav.next
        ? {
            bookId: standaloneNav.next.bookId,
            chapter: standaloneNav.next.chapter,
            startVerse: undefined,
            endVerse: undefined,
          }
        : null;

    if (
      !nextTarget ||
      !isBookSupportedInSixtySixBookVersions({ bookId: nextTarget.bookId })
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const path = buildBibleComPath({
        versionId: selectedVersion.id,
        bookId: nextTarget.bookId,
        chapter: nextTarget.chapter,
        startVerse: nextTarget.startVerse,
        endVerse: nextTarget.endVerse,
      });
      void fetch(`/api/bible-proxy?path=${encodeURIComponent(path)}`, {
        signal: controller.signal,
      }).catch(() => {});
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    isIframeLoading,
    isPlanMode,
    flattenedReadings,
    planReadingIndex,
    standaloneNav.next,
    selectedVersion.id,
  ]);

  const handleVersionValueChange = (value: string) => {
    const parsedId = Number.parseInt(value, 10);
    const match = BIBLE_VERSIONS.find((ver) => ver.id === parsedId);
    if (!match) return;
    saveSelectedVersion({ versionId: match.id });
    setStoredVersionId(match.id);
    void setQueryState({ v: match.id }).catch(() => {});
  };

  const handleUpdateFontSize = ({ newSize }: { newSize: number }) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, newSize));
    setFontSize(clamped);
    saveStoredFontSize({ fontSize: clamped });
  };

  const handleTogglePlanReading = async () => {
    if (!planContext || !activePlanReading) return;
    const targetId = activePlanReading.id;
    const prevCompleted = activePlanReading.isCompleted;
    const nextCompleted = !prevCompleted;

    setPlanContext((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        reading:
          prev.reading.id === targetId
            ? { ...prev.reading, isCompleted: nextCompleted }
            : prev.reading,
        flattenedReadings: prev.flattenedReadings.map((r) =>
          r.id === targetId ? { ...r, isCompleted: nextCompleted } : r
        ),
      };
    });

    try {
      const res = await togglePlanReadingItemAction({
        instanceId: planContext.plan.id,
        readingItemId: targetId,
      });
      if (!res.success) {
        setPlanContext((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            reading:
              prev.reading.id === targetId
                ? { ...prev.reading, isCompleted: prevCompleted }
                : prev.reading,
            flattenedReadings: prev.flattenedReadings.map((r) =>
              r.id === targetId ? { ...r, isCompleted: prevCompleted } : r
            ),
          };
        });
      }
    } catch {
      setPlanContext((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          reading:
            prev.reading.id === targetId
              ? { ...prev.reading, isCompleted: prevCompleted }
              : prev.reading,
          flattenedReadings: prev.flattenedReadings.map((r) =>
            r.id === targetId ? { ...r, isCompleted: prevCompleted } : r
          ),
        };
      });
    }
  };

  const handleIframeLoad = () => {
    setLoadedSrc(iframeSrc);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_THEME", theme: resolvedTheme },
        window.location.origin
      );
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_FONT_SIZE", fontSize },
        window.location.origin
      );
    }
  };

  const visibleBooks = useMemo(() => {
    const base = activeTestament === "OT" ? OT_BOOKS : NT_BOOKS;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return PROTESTANT_BIBLE_BOOKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    );
  }, [activeTestament, searchQuery]);

  const readingTitle = activePlanReading
    ? activePlanReading.displayText ||
      `${activePlanReading.bookName || activeBook.name} ${activePlanReading.chapter}`
    : `${activeBook.name} ${activeChapter}`;

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Top OT / NT Switcher + Search */}
      <div className="p-3.5 border-b border-border-subtle space-y-2.5 bg-surface-elevated/40">
        <div
          role="tablist"
          aria-label="Testament"
          className="grid grid-cols-2 gap-1 rounded-[12px] bg-surface-elevated p-1 border border-border-subtle"
        >
          <Button
            type="button"
            role="tab"
            size="sm"
            variant={activeTestament === "OT" ? "primary" : "ghost"}
            aria-selected={activeTestament === "OT"}
            onClick={() => {
              setActiveTestamentOverride("OT");
              setSearchQuery("");
            }}
            className="h-7.5 rounded-[9px] text-[12px]"
          >
            Old Testament
          </Button>
          <Button
            type="button"
            role="tab"
            size="sm"
            variant={activeTestament === "NT" ? "primary" : "ghost"}
            aria-selected={activeTestament === "NT"}
            onClick={() => {
              setActiveTestamentOverride("NT");
              setSearchQuery("");
            }}
            className="h-7.5 rounded-[9px] text-[12px]"
          >
            New Testament
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-foreground-dim z-10" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="h-8.5 pl-8.5 pr-7 text-[12.5px]"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear book search"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 size-6 text-foreground-dim hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Book List + Collapsible Chapter Grid */}
      <div className="luma-thin-scroll flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleBooks.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-foreground-dim">
            No matching books
          </p>
        ) : (
          visibleBooks.map((book) => {
            const openBookId =
              expandedBookId === "" ? null : (expandedBookId ?? currentBookId);
            const isExpandedBook = book.id === openBookId;
            const isCurrentReadingBook = book.id === currentBookId;
            return (
              <Collapsible
                key={book.id}
                open={isExpandedBook}
                onOpenChange={(open) => setExpandedBookId(open ? book.id : "")}
                className={`rounded-[12px] transition-colors ${
                  isExpandedBook ? "bg-surface-elevated/80 my-1" : ""
                }`}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`w-full justify-between px-3 py-2 h-auto rounded-[12px] text-left ${
                      isExpandedBook || isCurrentReadingBook
                        ? "text-primary font-semibold hover:text-primary"
                        : "text-foreground-secondary font-normal hover:text-foreground"
                    }`}
                  >
                    <span className="truncate text-[13px]">{book.name}</span>
                    {isExpandedBook && (
                      <Badge
                        variant="secondary"
                        className="text-[10.5px] tabular-nums text-primary bg-primary/10 border-transparent shrink-0"
                      >
                        {book.chapters} ch
                      </Badge>
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="px-2.5 pb-2.5 pt-0.5">
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from(
                      { length: book.chapters },
                      (_, idx) => idx + 1
                    ).map((chNum) => {
                      const isActiveCh =
                        isCurrentReadingBook && chNum === currentChapter;
                      return (
                        <Button
                          key={chNum}
                          type="button"
                          size="sm"
                          variant={isActiveCh ? "primary" : "outline"}
                          onClick={() =>
                            navigateToBookChapter({
                              nextBookId: book.id,
                              nextChapter: chNum,
                            })
                          }
                          className="h-7 px-0 rounded-[8px] text-[11.5px] font-semibold tabular-nums"
                        >
                          {chNum}
                        </Button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-10.5rem)] min-h-[420px] lg:h-[calc(100dvh-6.75rem)] lg:min-h-[560px] rounded-[16px] border border-border bg-surface shadow-xs overflow-hidden lg:divide-x lg:divide-border-subtle">
      {/* ── Desktop Left Sidebar: OT/NT + Books + Chapters ── */}
      {!hideBookSelector && isDesktopSidebarOpen && (
        <aside className="hidden lg:flex w-68 xl:w-72 shrink-0 flex-col bg-surface overflow-hidden">
          {renderSidebarContent()}
        </aside>
      )}

      {/* ── Mobile Sheet Drawer for Books & Chapters ── */}
      {!hideBookSelector && (
        <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
          <SheetContent
            side="left"
            className="w-80 max-w-[85vw] p-0 flex flex-col gap-0 lg:hidden"
          >
            <SheetHeader className="px-4 py-3 border-b border-border-subtle">
              <SheetTitle className="text-sm font-bold">
                Books &amp; Chapters
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0">{renderSidebarContent()}</div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Right Pane: Reader Canvas ── */}
      <section className="flex flex-1 min-w-0 flex-col bg-surface overflow-hidden">
        {/* Top Reader Toolbar */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-4 sm:px-6">
          {/* Left: Sidebar Toggles + Plan Back + Passage Title */}
          <div className="flex items-center gap-2 min-w-0">
            {!hideBookSelector && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDesktopSidebarOpen((prev) => !prev)}
                  aria-label={
                    isDesktopSidebarOpen
                      ? "Hide books sidebar"
                      : "Show books sidebar"
                  }
                  aria-expanded={isDesktopSidebarOpen}
                  className="hidden lg:inline-flex gap-1.5 h-8 px-2.5 text-xs shrink-0"
                >
                  {isDesktopSidebarOpen ? (
                    <PanelLeftClose className="size-3.5 text-primary" />
                  ) : (
                    <PanelLeft className="size-3.5 text-primary" />
                  )}
                  <span>{isDesktopSidebarOpen ? "Hide" : "Books"}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  aria-label="Open books and chapters"
                  className="inline-flex lg:hidden gap-1.5 h-8 px-2.5 text-xs shrink-0"
                >
                  <PanelLeft className="size-3.5 text-primary" />
                  <span>Books</span>
                </Button>
              </>
            )}

            {isPlanMode && planContext && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(`/plans/${planContext.plan.id}`)}
                aria-label="Back to reading plan"
                className="h-8 px-2.5 text-xs gap-1 shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                <span className="hidden sm:inline max-w-[140px] truncate">
                  {planContext.plan.title}
                </span>
              </Button>
            )}

            {isPlanMode && activePlanReading && (
              <p className="truncate text-xs font-medium text-foreground-dim">
                {activePlanReading.sessionTitle}
              </p>
            )}
          </div>

          {/* Right: Version Select, Font Size Popover, Plan Mark Read */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isBookSupported && (
              <Select
                value={String(selectedVersion.id)}
                onValueChange={handleVersionValueChange}
              >
                <SelectTrigger
                  aria-label="Bible version"
                  className="h-8 w-auto sm:min-w-[96px] gap-1.5 rounded-[12px] px-2.5 text-xs font-semibold"
                >
                  <BookOpen className="size-3.5 text-primary shrink-0" />
                  <SelectValue>{selectedVersion.abbreviation}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end" className="w-64">
                  {BIBLE_VERSIONS.map((ver) => (
                    <SelectItem key={ver.id} value={String(ver.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{ver.name}</span>
                        <span className="text-[10.5px] text-foreground-dim">
                          {ver.abbreviation} • {ver.language.toUpperCase()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Adjust font size"
                  className="h-8 px-2.5 gap-1 text-xs"
                >
                  <span className="font-serif font-bold">Aa</span>
                  <span className="hidden sm:inline text-[11px] text-foreground-dim">
                    {fontSize}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground-dim">
                    Text Size
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() =>
                      handleUpdateFontSize({ newSize: DEFAULT_FONT_SIZE })
                    }
                    className="h-auto p-0 text-[11px] gap-1"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleUpdateFontSize({ newSize: fontSize - 2 })
                    }
                    disabled={fontSize <= MIN_FONT_SIZE}
                    aria-label="Decrease font size"
                    className="size-8 rounded-lg"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="text-xs font-bold tabular-nums text-foreground">
                    {fontSize}px
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handleUpdateFontSize({ newSize: fontSize + 2 })
                    }
                    disabled={fontSize >= MAX_FONT_SIZE}
                    aria-label="Increase font size"
                    className="size-8 rounded-lg"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {isPlanMode && activePlanReading && (
              <Button
                type="button"
                size="sm"
                variant={activePlanReading.isCompleted ? "outline" : "primary"}
                onClick={handleTogglePlanReading}
                aria-pressed={activePlanReading.isCompleted}
                className="h-8 px-2.5 sm:px-3 gap-1.5 text-xs"
              >
                <Check className="size-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">
                  {activePlanReading.isCompleted ? "Completed" : "Mark Read"}
                </span>
              </Button>
            )}
          </div>
        </header>

        {/* Chapter Content Area */}
        <div className="relative flex-1 min-h-0 bg-background">
          {isIframeLoading && isBookSupported && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background p-6">
              <div className="w-full max-w-xl space-y-5">
                <div className="space-y-2 border-b border-border/50 pb-4">
                  <div className="h-7 w-44 rounded-lg bg-surface-elevated animate-pulse" />
                  <div className="h-3.5 w-28 rounded bg-surface-elevated/70 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-surface-elevated animate-pulse" />
                  <div className="h-4 w-11/12 rounded bg-surface-elevated animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-surface-elevated animate-pulse" />
                </div>
                <div className="flex items-center justify-center gap-2 pt-4 text-foreground-dim">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-xs font-medium">
                    Loading scripture...
                  </span>
                </div>
              </div>
            </div>
          )}

          {!isBookSupported ? (
            <div className="flex size-full items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-2">
                <BookOpen className="mx-auto size-8 text-foreground-dim" />
                <h2 className="text-base font-semibold text-foreground">
                  Book unavailable in the reader
                </h2>
                <p className="text-sm text-foreground-dim">
                  {readingTitle} is outside the 66-book canon supported by the
                  available Bible translations.
                </p>
              </div>
            </div>
          ) : iframeSrc ? (
            <iframe
              ref={iframeRef}
              key={iframeSrc}
              src={iframeSrc}
              title={`Bible reading ${readingTitle}`}
              onLoad={handleIframeLoad}
              className="size-full border-0 bg-background"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          ) : null}
        </div>

        {/* Bottom Previous / Next Bar */}
        <footer className="flex h-14 shrink-0 items-center justify-between border-t border-border-subtle bg-surface px-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={!hasPrev}
            aria-label={isPlanMode ? "Previous plan reading" : "Previous chapter"}
            className="h-8 gap-1.5 text-xs"
          >
            <ChevronLeft className="size-3.5" />
            <span>Previous</span>
          </Button>

          <div className="min-w-0 px-2 text-center text-[12.5px] font-medium text-foreground">
            {isPlanMode ? (
              <span className="truncate block">
                {readingTitle}{" "}
                <span className="font-normal text-foreground-dim">
                  • {planReadingIndex + 1} of {flattenedReadings.length}
                </span>
              </span>
            ) : (
              <span>
                {activeBook.name} {activeChapter}{" "}
                <span className="font-normal text-foreground-dim">
                  of {activeBook.chapters}
                </span>
              </span>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!hasNext}
            aria-label={isPlanMode ? "Next plan reading" : "Next chapter"}
            className="h-8 gap-1.5 text-xs"
          >
            <span>Next</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </footer>
      </section>
    </div>
  );
}
