"use client";

import type { CSSProperties } from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search, ChevronLeft, ChevronRight, ChevronDown, Check, CheckCircle2, Loader2, Minus, Plus, RotateCcw, X, ArrowLeft } from "lucide-react";
import {
  type BibleCanon,
  type BibleBook,
  getBibleBooks,
} from "@/data/bibleData";
import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";
import {
  BIBLE_VERSIONS,
  type BibleVersion,
  detectDefaultVersion,
  saveSelectedVersion,
  buildBibleComPath,
  isBookSupportedInSixtySixBookVersions,
} from "@/lib/bible-versions";
import { toast } from "sonner";
import { togglePlanReadingItemAction } from "@/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const FONT_SIZE_STORAGE_KEY = "luma-bible-font-size";
const DEFAULT_FONT_SIZE = 18;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 32;

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

type PassageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; path: string; contentHtml: string };

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

export type BibleWorkspaceProps = {
  canon?: BibleCanon;
  readChapters?: Record<string, ReadonlyArray<number>>;
  totalReadChapters?: number;
  totalChaptersAcrossCanon?: number;
  canonPercentage?: number;
  onToggleTrackerChapter?: (params: {
    bookId: string;
    bookName: string;
    chapter: number;
  }) => void;
  onMarkAllChapters?: (params: { book: BibleBook }) => void;
  onClearAllChapters?: (params: { bookId: string }) => void;
};

type ReaderQueryState = {
  book: string;
  ch: number;
  v: number | null;
  plan: string | null;
  readingId: string | null;
  startVerse: number | null;
  endVerse: number | null;
};

function parseReaderQuery(searchParams: URLSearchParams): ReaderQueryState {
  const rawBook = searchParams.get("book")?.trim().toLowerCase();
  const rawCh = Number.parseInt(searchParams.get("ch") ?? "", 10);
  const rawV = Number.parseInt(searchParams.get("v") ?? "", 10);
  const rawStart = Number.parseInt(searchParams.get("startVerse") ?? "", 10);
  const rawEnd = Number.parseInt(searchParams.get("endVerse") ?? "", 10);

  return {
    book: rawBook || "gen",
    ch: Number.isFinite(rawCh) && rawCh > 0 ? rawCh : 1,
    v: Number.isFinite(rawV) ? rawV : null,
    plan: searchParams.get("plan") || null,
    readingId: searchParams.get("readingId") || null,
    startVerse: Number.isFinite(rawStart) ? rawStart : null,
    endVerse: Number.isFinite(rawEnd) ? rawEnd : null,
  };
}

export function BibleWorkspace({
  canon = "protestant",
  readChapters = {},
  totalReadChapters = 0,
  totalChaptersAcrossCanon = 1189,
  canonPercentage = 0,
  onToggleTrackerChapter,
  onMarkAllChapters,
  onClearAllChapters,
}: BibleWorkspaceProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  const [readerQuery, setReaderQuery] = useState<ReaderQueryState>(() =>
    parseReaderQuery(searchParams)
  );
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey);

  // Sync when Next.js searchParams changes via external route navigation
  if (searchKey !== prevSearchKey) {
    setPrevSearchKey(searchKey);
    setReaderQuery(parseReaderQuery(searchParams));
  }

  const updateReaderQuery = useCallback(
    (patch: Partial<ReaderQueryState>) => {
      setReaderQuery((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  // Sync URL bar after commit so Next.js Router never updates during render
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (readerQuery.book && readerQuery.book !== "gen") {
      params.set("book", readerQuery.book);
    } else {
      params.delete("book");
    }
    if (readerQuery.ch > 1) {
      params.set("ch", String(readerQuery.ch));
    } else {
      params.delete("ch");
    }
    if (readerQuery.v != null) params.set("v", String(readerQuery.v));
    else params.delete("v");
    if (readerQuery.plan) params.set("plan", readerQuery.plan);
    else params.delete("plan");
    if (readerQuery.readingId) params.set("readingId", readerQuery.readingId);
    else params.delete("readingId");
    if (readerQuery.startVerse != null)
      params.set("startVerse", String(readerQuery.startVerse));
    else params.delete("startVerse");
    if (readerQuery.endVerse != null)
      params.set("endVerse", String(readerQuery.endVerse));
    else params.delete("endVerse");

    const qs = params.toString();
    const nextUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [readerQuery]);

  const {
    book: bookParam,
    ch: chapterParam,
    v: versionParam,
    plan: planIdParam,
    readingId: readingIdParam,
    startVerse: startVerseParam,
    endVerse: endVerseParam,
  } = readerQuery;

  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [storedVersionId, setStoredVersionId] = useState<number | null>(null);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState<BibleBook | null>(null);
  const [pickerTestament, setPickerTestament] = useState<"OT" | "NT">("OT");
  const [passageState, setPassageState] = useState<PassageState>({
    status: "loading",
  });
  const [passageRetryNonce, setPassageRetryNonce] = useState(0);
  const [planContext, setPlanContext] = useState<PlanContextData | null>(null);
  const [isTogglingPlan, setIsTogglingPlan] = useState(false);

  const hasHydratedPrefsRef = useRef(false);

  // Resolve active book & chapter (from 66-book readable canon)
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

  // Hydrate client-only preferences (fontSize, saved version) after mount
  useEffect(() => {
    if (hasHydratedPrefsRef.current) return;
    const timer = setTimeout(() => {
      hasHydratedPrefsRef.current = true;
      setFontSize(getStoredFontSize());
      setStoredVersionId(detectDefaultVersion({}).id);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  const isPassageLoading =
    isBookSupported &&
    (passageState.status === "loading" ||
      (passageState.status === "success" && passageState.path !== biblePath));

  // Fetch sanitized passage HTML directly as JSON
  useEffect(() => {
    if (!biblePath) return;
    const controller = new AbortController();

    async function loadPassage() {
      const retryDelaysMs = [300, 800];

      for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
        try {
          const res = await fetch(
            `/api/bible-proxy?path=${encodeURIComponent(biblePath)}&format=json`,
            { signal: controller.signal }
          );

          if (res.status >= 500 && attempt < retryDelaysMs.length) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelaysMs[attempt])
            );
            continue;
          }

          const data = (await res.json()) as {
            contentHtml?: string;
            error?: string;
          };
          if (!res.ok || !data.contentHtml) {
            throw new Error(
              data.error || `Failed to load passage (${res.status})`
            );
          }

          setPassageState({
            status: "success",
            path: biblePath,
            contentHtml: data.contentHtml,
          });
          window.scrollTo({ top: 0, behavior: "instant" });
          return;
        } catch (err) {
          if (controller.signal.aborted) return;
          if (attempt < retryDelaysMs.length) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelaysMs[attempt])
            );
            continue;
          }
          const message =
            err instanceof Error ? err.message : "Unable to load passage";
          setPassageState({ status: "error", message });
        }
      }
    }

    void loadPassage();
    return () => controller.abort();
  }, [biblePath, passageRetryNonce]);

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
      setIsBookPickerOpen(false);
      setPickerBook(null);
      updateReaderQuery({
        book: nextBookId,
        ch: nextChapter,
        startVerse: null,
        endVerse: null,
        readingId: null,
      });
    },
    [updateReaderQuery]
  );

  const handlePrev = useCallback(() => {
    if (!hasPrev) return;

    if (isPlanMode) {
      const prevItem = flattenedReadings[planReadingIndex - 1];
      if (!prevItem) return;
      updateReaderQuery({
        book: prevItem.bookId.toLowerCase(),
        ch: prevItem.chapter,
        readingId: prevItem.id,
        startVerse: prevItem.startVerse ?? null,
        endVerse: prevItem.endVerse ?? null,
      });
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
    updateReaderQuery,
    navigateToBookChapter,
  ]);

  const handleNext = useCallback(() => {
    if (!hasNext) return;

    if (isPlanMode) {
      const nextItem = flattenedReadings[planReadingIndex + 1];
      if (!nextItem) return;
      updateReaderQuery({
        book: nextItem.bookId.toLowerCase(),
        ch: nextItem.chapter,
        readingId: nextItem.id,
        startVerse: nextItem.startVerse ?? null,
        endVerse: nextItem.endVerse ?? null,
      });
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
    updateReaderQuery,
    navigateToBookChapter,
  ]);

  // Keyboard shortcuts (ArrowLeft / ArrowRight when picker closed and not typing)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isBookPickerOpen) return;
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
  }, [isBookPickerOpen, hasPrev, hasNext, handlePrev, handleNext]);

  // Background prefetch adjacent chapter/reading
  useEffect(() => {
    if (isPassageLoading) return;
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
      void fetch(
        `/api/bible-proxy?path=${encodeURIComponent(path)}&format=json`,
        { signal: controller.signal }
      ).catch(() => {});
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    isPassageLoading,
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
    updateReaderQuery({ v: match.id });
  };

  const handleUpdateFontSize = ({ newSize }: { newSize: number }) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, newSize));
    setFontSize(clamped);
    saveStoredFontSize({ fontSize: clamped });
  };

  const handleTogglePlanReading = async () => {
    if (!planContext || !activePlanReading || isTogglingPlan) return;
    const targetId = activePlanReading.id;
    const prevCompleted = activePlanReading.isCompleted;
    const nextCompleted = !prevCompleted;

    setIsTogglingPlan(true);
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
        toast.error(res.error || "Failed to update reading status");
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
      } else {
        setPlanContext((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            reading:
              prev.reading.id === targetId
                ? { ...prev.reading, isCompleted: res.isCompleted }
                : prev.reading,
            flattenedReadings: prev.flattenedReadings.map((r) =>
              r.id === targetId ? { ...r, isCompleted: res.isCompleted } : r
            ),
          };
        });
        if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
          window.dispatchEvent(
            new CustomEvent("achievement-unlocked", {
              detail: res.newlyUnlocked,
            })
          );
        }
        try {
          sessionStorage.setItem("luma-plan-dirty", planContext.plan.id);
        } catch {
          // Ignore storage restrictions
        }
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update reading status";
      toast.error(msg);
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
    } finally {
      setIsTogglingPlan(false);
    }
  };

  // Books for the picker Sheet (follows active tracker's canon)
  const canonBooks = useMemo(() => getBibleBooks(canon), [canon]);
  const filteredPickerBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return canonBooks.filter((b) => {
      if (q) {
        return (
          b.name.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
        );
      }
      return b.testament === pickerTestament;
    });
  }, [canonBooks, searchQuery, pickerTestament]);

  const readingTitle = activePlanReading
    ? activePlanReading.displayText ||
      `${activePlanReading.bookName || activeBook.name} ${activePlanReading.chapter}`
    : `${activeBook.name} ${activeChapter}`;

  const isCurrentChapterRead = (readChapters[currentBookId] ?? []).includes(
    currentChapter
  );

  const openBookPicker = () => {
    setPickerBook(null);
    setPickerTestament(activeBook.testament);
    setSearchQuery("");
    setIsBookPickerOpen(true);
  };

  return (
    <div className="flex w-full flex-col min-h-[calc(100dvh-10.5rem)] lg:min-h-[calc(100dvh-6.75rem)]">
      {/* ── Sticky Reader Toolbar ── */}
      <header className="sticky top-0 z-20 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[820px] items-center justify-between gap-2">
          {/* Left: Book & Chapter Picker Trigger / Plan Context */}
          <div className="flex items-center gap-2 min-w-0">
            {!hideBookSelector && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openBookPicker}
                aria-label="Choose book and chapter"
                className="h-8 gap-1.5 px-3 text-xs font-semibold shrink-0"
              >
                <BookOpen className="size-3.5 text-primary" />
                <span>
                  {activeBook.name} {activeChapter}
                </span>
                <ChevronDown className="size-3 text-foreground-dim" />
              </Button>
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
              <div className="min-w-0 flex items-baseline gap-1.5">
                <span className="truncate text-xs sm:text-sm font-bold text-foreground">
                  {readingTitle}
                </span>
                <span className="hidden sm:inline truncate text-[11px] font-medium text-foreground-dim">
                  • {activePlanReading.sessionTitle}
                </span>
              </div>
            )}
          </div>

          {/* Right: Version Select, Font Size Popover, Mark Read */}
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

            <Popover>
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
                disabled={isTogglingPlan}
                aria-pressed={activePlanReading.isCompleted}
                className="h-8 px-2.5 sm:px-3 gap-1.5 text-xs"
              >
                <Check className="size-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">
                  {activePlanReading.isCompleted ? "Completed" : "Mark Read"}
                </span>
              </Button>
            )}

            {!isPlanMode && onToggleTrackerChapter && isBookSupported && (
              <Button
                type="button"
                size="sm"
                variant={isCurrentChapterRead ? "outline" : "primary"}
                onClick={() =>
                  onToggleTrackerChapter({
                    bookId: currentBookId,
                    bookName: activeBook.name,
                    chapter: currentChapter,
                  })
                }
                aria-pressed={isCurrentChapterRead}
                className="h-8 px-2.5 sm:px-3 gap-1.5 text-xs"
              >
                <Check className="size-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">
                  {isCurrentChapterRead ? "Read" : "Mark Read"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Open Editorial Reading Column ── */}
      <div className="mx-auto w-full max-w-[760px] flex-1 px-2 sm:px-6 py-6 sm:py-10">
        {!isBookSupported ? (
          <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
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
        ) : isPassageLoading ? (
          <div className="space-y-6 py-2">
            {[
              ["w-full", "w-11/12", "w-4/5"],
              ["w-full", "w-5/6", "w-3/4"],
              ["w-11/12", "w-full", "w-2/3"],
              ["w-full", "w-4/5", "w-5/6"],
              ["w-5/6", "w-full", "w-3/5"],
              ["w-full", "w-11/12", "w-4/5"],
              ["w-4/5", "w-full", "w-2/3"],
            ].map((widths, idx) => (
              <div key={idx} className="space-y-2.5">
                {widths.map((widthClass, lineIdx) => (
                  <div
                    key={lineIdx}
                    className={`h-4 ${widthClass} rounded bg-surface-elevated animate-pulse`}
                  />
                ))}
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 pt-2 text-foreground-dim">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading scripture...</span>
            </div>
          </div>
        ) : passageState.status === "error" ? (
          <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-3">
              <h2 className="text-base font-semibold text-foreground">
                Unable to load passage
              </h2>
              <p className="text-sm text-foreground-dim">
                {passageState.message}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPassageRetryNonce((n) => n + 1)}
              >
                Retry Passage
              </Button>
            </div>
          </div>
        ) : passageState.status === "success" ? (
          <article
            style={{ "--bible-font-size": `${fontSize}px` } as CSSProperties}
            className="luma-bible-passage"
            /* Passage HTML is returned by YouVersion API and sanitized server-side via sanitize-html */
            dangerouslySetInnerHTML={{ __html: passageState.contentHtml }}
          />
        ) : null}
      </div>

      {/* ── Bottom Previous / Next Navigation ── */}
      <footer className="mx-auto w-full max-w-[760px] px-2 sm:px-6 pb-8 pt-4 border-t border-border/60 flex items-center justify-between gap-2">
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

      {/* ── Unified Book & Progress Picker Sheet ── */}
      {!hideBookSelector && (
        <Sheet open={isBookPickerOpen} onOpenChange={setIsBookPickerOpen}>
          <SheetContent
            side="left"
            className="w-[90vw] sm:max-w-[440px] p-0 flex flex-col gap-0"
          >
            <SheetHeader className="px-5 py-4 border-b border-border-subtle space-y-2">
              <div className="flex items-center justify-between pr-6">
                <SheetTitle className="text-base font-bold">
                  {pickerBook ? pickerBook.name : "Books & Progress"}
                </SheetTitle>
                <span className="text-xs font-semibold tabular-nums text-primary">
                  {totalReadChapters}/{totalChaptersAcrossCanon} ({canonPercentage}
                  %)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <div
                  style={{ width: `${canonPercentage}%` }}
                  className="h-full rounded-full bg-primary transition-all duration-300"
                />
              </div>
            </SheetHeader>

            {pickerBook ? (
              <div className="flex flex-1 min-h-0 flex-col">
                {/* Book Subheader + Bulk Actions */}
                <div className="px-5 py-3 border-b border-border-subtle flex flex-wrap items-center justify-between gap-2 bg-surface-elevated/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPickerBook(null)}
                    className="h-8 px-2 gap-1 text-xs"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>All Books</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    {onMarkAllChapters && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => onMarkAllChapters({ book: pickerBook })}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Mark All Read</span>
                      </Button>
                    )}
                    {onClearAllChapters &&
                      (readChapters[pickerBook.id]?.length ?? 0) > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onClearAllChapters({ bookId: pickerBook.id })
                          }
                          className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                        >
                          <RotateCcw className="size-3" />
                          <span>Reset</span>
                        </Button>
                      )}
                  </div>
                </div>

                {/* Chapter Grid */}
                <div className="luma-thin-scroll flex-1 overflow-y-auto p-5">
                  {!isBookSupportedInSixtySixBookVersions({
                    bookId: pickerBook.id,
                  }) && (
                    <p className="mb-3 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-foreground-secondary">
                      Tracking only — this book is outside the 66-book reader
                      translations. Tap chapters to mark them read.
                    </p>
                  )}

                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                    {Array.from(
                      { length: pickerBook.chapters },
                      (_, idx) => idx + 1
                    ).map((chNum) => {
                      const isReadable = isBookSupportedInSixtySixBookVersions({
                        bookId: pickerBook.id,
                      });
                      const isActiveCh =
                        isReadable &&
                        pickerBook.id === currentBookId &&
                        chNum === currentChapter;
                      const isReadCh = (
                        readChapters[pickerBook.id] ?? []
                      ).includes(chNum);
                      return (
                        <Button
                          key={chNum}
                          type="button"
                          size="sm"
                          variant={isActiveCh ? "primary" : "ghost"}
                          onClick={() => {
                            if (isReadable) {
                              navigateToBookChapter({
                                nextBookId: pickerBook.id,
                                nextChapter: chNum,
                              });
                            } else if (onToggleTrackerChapter) {
                              onToggleTrackerChapter({
                                bookId: pickerBook.id,
                                bookName: pickerBook.name,
                                chapter: chNum,
                              });
                            }
                          }}
                          className={`h-10 px-0 rounded-[12px] text-[13.5px] tabular-nums transition-all ${
                            isActiveCh
                              ? "bg-primary border border-primary font-semibold text-primary-foreground shadow-xs"
                              : isReadCh
                                ? "border border-primary/60 bg-surface-elevated font-medium text-foreground-secondary hover:border-primary hover:text-foreground hover:bg-surface-elevated"
                                : "border border-border bg-surface-elevated font-medium text-foreground-secondary hover:border-border-strong hover:text-foreground hover:bg-surface-elevated"
                          }`}
                        >
                          {chNum}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 min-h-0 flex-col">
                {/* OT / NT Tabs + Search */}
                <div className="p-4 border-b border-border-subtle space-y-2.5 bg-surface-elevated/40">
                  <div
                    role="tablist"
                    aria-label="Testament"
                    className="grid grid-cols-2 gap-1 rounded-[12px] bg-surface-elevated p-1 border border-border-subtle"
                  >
                    <Button
                      type="button"
                      role="tab"
                      size="sm"
                      variant={pickerTestament === "OT" ? "primary" : "ghost"}
                      aria-selected={pickerTestament === "OT"}
                      onClick={() => {
                        setPickerTestament("OT");
                        setSearchQuery("");
                      }}
                      className="h-7.5 rounded-[9px] text-xs"
                    >
                      Old Testament
                    </Button>
                    <Button
                      type="button"
                      role="tab"
                      size="sm"
                      variant={pickerTestament === "NT" ? "primary" : "ghost"}
                      aria-selected={pickerTestament === "NT"}
                      onClick={() => {
                        setPickerTestament("NT");
                        setSearchQuery("");
                      }}
                      className="h-7.5 rounded-[9px] text-xs"
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

                {/* BookCard Grid */}
                <div className="luma-thin-scroll flex-1 overflow-y-auto p-4">
                  {filteredPickerBooks.length === 0 ? (
                    <p className="py-8 text-center text-xs text-foreground-dim">
                      No matching books
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {filteredPickerBooks.map((book) => {
                        const readCount = readChapters[book.id]?.length ?? 0;
                        const isFullyRead =
                          readCount >= book.chapters && book.chapters > 0;
                        const progressPercent = isFullyRead
                          ? 100
                          : book.chapters > 0
                            ? Math.min(
                                99,
                                Math.round((readCount / book.chapters) * 100)
                              )
                            : 0;
                        const orderFormatted =
                          book.order < 10 ? `0${book.order}` : `${book.order}`;
                        return (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => setPickerBook(book)}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-[12px] border border-border bg-surface p-2.5 text-left transition-all duration-150 hover:border-border-strong hover:bg-surface-elevated/60 active:scale-[0.98] cursor-pointer"
                          >
                            {isFullyRead ? (
                              <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 bg-primary/10 rounded-[12px]"
                              />
                            ) : progressPercent > 0 ? (
                              <div
                                aria-hidden="true"
                                style={{ width: `${progressPercent}%` }}
                                className="pointer-events-none absolute inset-y-0 left-0 bg-primary/8 rounded-l-[12px]"
                              />
                            ) : null}

                            <div className="relative z-10 flex items-center justify-between gap-1">
                              <span className="text-[10px] tabular-nums text-foreground-dim">
                                {orderFormatted}
                              </span>
                              {isFullyRead ? (
                                <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <Check className="size-2" strokeWidth={3} />
                                </span>
                              ) : progressPercent > 0 ? (
                                <span className="text-[9.5px] font-semibold tabular-nums text-primary">
                                  {progressPercent}%
                                </span>
                              ) : null}
                            </div>

                            <div className="relative z-10 mt-1.5">
                              <h3 className="text-[12.5px] font-medium tracking-tight text-foreground truncate">
                                {book.name}
                              </h3>
                              <p className="text-[10.5px] text-foreground-dim">
                                {readCount > 0
                                  ? `${readCount}/${book.chapters}`
                                  : `${book.chapters} ch`}
                              </p>
                            </div>

                            <div className="relative z-10 mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-elevated">
                              <div
                                style={{ width: `${progressPercent}%` }}
                                className={`h-full rounded-full ${
                                  isFullyRead ? "bg-primary" : "bg-primary/70"
                                }`}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
