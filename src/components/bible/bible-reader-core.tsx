"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Loader2,
  BookOpen,
  ChevronDown,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  BIBLE_VERSIONS,
  type BibleVersion,
  detectDefaultVersion,
  saveSelectedVersion,
  buildBibleComPath,
} from "@/lib/bible-versions";
import { useRouter, useSearchParams } from "next/navigation";

export type BibleReaderCoreProps = {
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  versionId?: number;
  planContext?: {
    plan: {
      id: string;
      title: string;
    };
    reading: {
      id: string;
      bookId: string;
      chapter: number;
      startVerse?: number;
      endVerse?: number;
      isCompleted: boolean;
    };
    flattenedReadings: readonly {
      id: string;
      bookId: string;
      chapter: number;
      startVerse?: number;
      endVerse?: number;
      isCompleted?: boolean;
      sessionIndex: number;
      sessionTitle: string;
    }[];
  } | null;
  onToggleReading?: (readingId: string) => void;
};

const FONT_SIZE_STORAGE_KEY = "luma-bible-font-size";
const DEFAULT_FONT_SIZE = 22;
const MIN_FONT_SIZE = 20;
const MAX_FONT_SIZE = 32;

function getStoredFontSize(): number {
  if (typeof window === "undefined") return DEFAULT_FONT_SIZE;
  try {
    const raw = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SIZE;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return DEFAULT_FONT_SIZE;
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

function saveStoredFontSize({ fontSize }: { fontSize: number }): void {
  try {
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

type FlattenedReading = {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  displayText?: string | null;
  isCompleted: boolean;
  sessionIndex: number;
  sessionTitle: string;
};

export function BibleReaderCore({
  bookId,
  chapter,
  startVerse,
  endVerse,
  versionId: initialVersionId,
  planContext,
  onToggleReading,
}: BibleReaderCoreProps) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Version state - sync with URL
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(() => {
    if (initialVersionId) {
      const match = BIBLE_VERSIONS.find((v) => v.id === initialVersionId);
      if (match) return match;
    }
    return detectDefaultVersion({});
  });
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  // Font size state
  const [fontSize, setFontSize] = useState<number>(() => getStoredFontSize());
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const versionMenuRef = useRef<HTMLDivElement | null>(null);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click or window blur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        isVersionDropdownOpen &&
        versionMenuRef.current &&
        !versionMenuRef.current.contains(target)
      ) {
        setIsVersionDropdownOpen(false);
      }
      if (
        isFontMenuOpen &&
        fontMenuRef.current &&
        !fontMenuRef.current.contains(target)
      ) {
        setIsFontMenuOpen(false);
      }
    }

    function handleWindowBlur() {
      setIsVersionDropdownOpen(false);
      setIsFontMenuOpen(false);
    }

    if (isVersionDropdownOpen || isFontMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("blur", handleWindowBlur);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isVersionDropdownOpen, isFontMenuOpen]);

  // Sync theme changes to iframe without reloading
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_THEME", theme: resolvedTheme },
        window.location.origin
      );
    }
  }, [resolvedTheme]);

  const handleUpdateFontSize = ({ newSize }: { newSize: number }) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, newSize));
    setFontSize(clamped);
    saveStoredFontSize({ fontSize: clamped });
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_FONT_SIZE", fontSize: clamped },
        window.location.origin
      );
    }
  };

  // Build flattened readings list - either from plan context or single passage
  const flattenedReadings = useMemo((): FlattenedReading[] => {
    if (planContext) {
      return planContext.flattenedReadings.map((r) => ({
        ...r,
        bookName: r.bookId.toUpperCase(),
        displayText: r.bookId.toUpperCase(),
        isCompleted: Boolean(r.isCompleted),
      }));
    }
    return [{
      id: "standalone",
      bookId,
      bookName: bookId.toUpperCase(),
      chapter,
      startVerse,
      endVerse,
      displayText: bookId.toUpperCase(),
      isCompleted: false,
      sessionIndex: 1,
      sessionTitle: "Bible",
    }];
  }, [planContext, bookId, chapter, startVerse, endVerse]);

  // Find current reading index
  const currentIndex = useMemo(() => {
    if (planContext) {
      return flattenedReadings.findIndex((r) => r.id === planContext.reading.id);
    }
    return 0;
  }, [flattenedReadings, planContext]);

  const currentReading = flattenedReadings[currentIndex] ?? flattenedReadings[0];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < flattenedReadings.length - 1;

  // Build Bible proxy path
  const biblePath = currentReading
    ? buildBibleComPath({
        versionId: selectedVersion.id,
        bookId: currentReading.bookId,
        chapter: currentReading.chapter,
        startVerse: currentReading.startVerse,
        endVerse: currentReading.endVerse,
      })
    : "";

  const iframeSrc = biblePath
    ? `/api/bible-proxy?path=${encodeURIComponent(biblePath)}`
    : "";

  const isIframeLoading = Boolean(iframeSrc) && loadedSrc !== iframeSrc;

  // Version selection with URL sync
  const handleSelectVersion = ({ version }: { version: BibleVersion }) => {
    setSelectedVersion(version);
    saveSelectedVersion({ versionId: version.id });
    setIsVersionDropdownOpen(false);
    // Update URL with new version
    const params = new URLSearchParams(searchParams.toString());
    params.set("v", version.id.toString());
    router.replace(`?${params.toString()}`);
  };

  // Navigation
  const handlePrev = useCallback(() => {
    if (!hasPrev) return;
    const prev = flattenedReadings[currentIndex - 1];
    if (!prev) return;

    if (planContext) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("readingId", prev.id);
      router.replace(`/bible/${prev.bookId.toLowerCase()}/${prev.chapter}?${params.toString()}`);
    } else {
      router.replace(`/bible/${prev.bookId.toLowerCase()}/${prev.chapter}?v=${selectedVersion.id}`);
    }
  }, [hasPrev, currentIndex, flattenedReadings, planContext, searchParams, router, selectedVersion.id]);

  const handleNext = useCallback(() => {
    if (!hasNext) return;
    const next = flattenedReadings[currentIndex + 1];
    if (!next) return;

    if (planContext) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("readingId", next.id);
      router.replace(`/bible/${next.bookId.toLowerCase()}/${next.chapter}?${params.toString()}`);
    } else {
      router.replace(`/bible/${next.bookId.toLowerCase()}/${next.chapter}?v=${selectedVersion.id}`);
    }
  }, [hasNext, currentIndex, flattenedReadings, planContext, searchParams, router, selectedVersion.id]);

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

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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

  // Prefetch adjacent passages
  useEffect(() => {
    if (!hasNext && !hasPrev) return;
    if (isIframeLoading) return;

    const controller = new AbortController();
    let nextTimer: ReturnType<typeof setTimeout> | null = null;
    let prevTimer: ReturnType<typeof setTimeout> | null = null;

    if (hasNext) {
      nextTimer = setTimeout(() => {
        const nextItem = flattenedReadings[currentIndex + 1];
        if (nextItem) {
          const path = buildBibleComPath({
            versionId: selectedVersion.id,
            bookId: nextItem.bookId,
            chapter: nextItem.chapter,
            startVerse: nextItem.startVerse,
            endVerse: nextItem.endVerse,
          });
          void fetch(`/api/bible-proxy?path=${encodeURIComponent(path)}`, {
            signal: controller.signal,
          });
        }
      }, 800);
    }

    if (hasPrev) {
      prevTimer = setTimeout(() => {
        const prevItem = flattenedReadings[currentIndex - 1];
        if (prevItem) {
          const path = buildBibleComPath({
            versionId: selectedVersion.id,
            bookId: prevItem.bookId,
            chapter: prevItem.chapter,
            startVerse: prevItem.startVerse,
            endVerse: prevItem.endVerse,
          });
          void fetch(`/api/bible-proxy?path=${encodeURIComponent(path)}`, {
            signal: controller.signal,
          });
        }
      }, 2200);
    }

    return () => {
      controller.abort();
      if (nextTimer) clearTimeout(nextTimer);
      if (prevTimer) clearTimeout(prevTimer);
    };
  }, [
    hasNext,
    hasPrev,
    isIframeLoading,
    currentIndex,
    flattenedReadings,
    selectedVersion.id,
  ]);

  const readingTitle = currentReading.displayText || `${currentReading.bookName} ${currentReading.chapter}`;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* =========================================================================
          TOP TOOLBAR
          ========================================================================= */}
      <header className="sticky top-0 z-20 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border bg-surface/95 px-3 sm:px-6 backdrop-blur-md gap-2">
        {/* Left: Back button + Passage info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          {planContext ? (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(`/plans/${planContext.plan.id}`);
                }
              }}
              aria-label="Close reader and return to plan"
              className="flex size-8.5 sm:size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground-secondary transition-all hover:bg-surface-elevated hover:text-foreground cursor-pointer shadow-2xs"
            >
              <X className="size-4 sm:size-4.5" />
            </button>
          ) : (
            <Link
              href="/bible"
              className="flex size-8.5 sm:size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground-secondary transition-all hover:bg-surface-elevated hover:text-foreground cursor-pointer shadow-2xs"
            >
              <X className="size-4 sm:size-4.5" />
            </Link>
          )}

          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="truncate text-[13px] sm:text-[16px] font-bold text-foreground">
                {readingTitle}
              </span>
              {currentReading.isCompleted && planContext && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <CheckCircle2 className="size-3.5 fill-primary text-primary-foreground" />
                  <span>Completed</span>
                </span>
              )}
            </div>
            {planContext && (
              <span className="truncate text-[10px] sm:text-[11px] font-medium text-foreground-dim">
                {currentReading.sessionTitle} • Item {currentIndex + 1} of{" "}
                {flattenedReadings.length}
              </span>
            )}
          </div>
        </div>

        {/* Center: Version Selector & Font Size Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Version Selector Dropdown */}
          <div ref={versionMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsVersionDropdownOpen(!isVersionDropdownOpen);
                setIsFontMenuOpen(false);
              }}
              aria-expanded={isVersionDropdownOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-1 sm:gap-1.5 rounded-[12px] border border-border bg-surface px-2 sm:px-3 py-1.5 text-[11.5px] sm:text-[13px] font-medium text-foreground transition-all hover:border-border-strong cursor-pointer shadow-2xs"
            >
              <BookOpen className="size-3.5 text-primary" />
              <span className="font-semibold">
                {selectedVersion.abbreviation}
              </span>
              <ChevronDown className="size-3 text-foreground-dim" />
            </button>

            {isVersionDropdownOpen && (
              <div
                role="listbox"
                className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-1.5 z-40 w-64 max-h-80 overflow-y-auto rounded-[16px] border border-border bg-surface p-1.5 shadow-lg"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground-dim">
                  Bible Version
                </div>
                {BIBLE_VERSIONS.map((v) => {
                  const isSelected = v.id === selectedVersion.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectVersion({ version: v })}
                      className={`flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-left text-[12.5px] transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground hover:bg-surface-elevated font-normal"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{v.name}</span>
                        <span
                          className={`text-[10.5px] ${
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-foreground-dim"
                          }`}
                        >
                          {v.abbreviation} • {v.language.toUpperCase()}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-primary-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Font Size Menu */}
          <div ref={fontMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFontMenuOpen(!isFontMenuOpen);
                setIsVersionDropdownOpen(false);
              }}
              aria-expanded={isFontMenuOpen}
              aria-label="Adjust font size"
              className={`flex items-center gap-1 sm:gap-1.5 rounded-[12px] border px-2 sm:px-3 py-1.5 text-[11.5px] sm:text-[13px] font-medium transition-all cursor-pointer shadow-2xs ${
                isFontMenuOpen
                  ? "border-primary bg-surface-elevated text-foreground"
                  : "border-border bg-surface text-foreground hover:border-border-strong"
              }`}
            >
              <span className="font-serif font-bold text-[13px] sm:text-[14px] tracking-tight">
                Aa
              </span>
              <span className="hidden sm:inline text-[11px] font-semibold text-foreground-dim">
                {Math.round((fontSize / DEFAULT_FONT_SIZE) * 100)}%
              </span>
            </button>

            {isFontMenuOpen && (
              <div
                role="region"
                aria-label="Font size controls"
                className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-1.5 z-40 w-60 rounded-[16px] border border-border bg-surface p-3 shadow-lg flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
                    Text Size
                  </span>
                  {fontSize !== DEFAULT_FONT_SIZE && (
                    <button
                      type="button"
                      onClick={() => handleUpdateFontSize({ newSize: DEFAULT_FONT_SIZE })}
                      aria-label="Reset font size to default"
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <RotateCcw className="size-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Stepper with Minus / Size Indicator / Plus */}
                <div className="flex items-center justify-between rounded-[12px] border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateFontSize({ newSize: fontSize - 2 })}
                    disabled={fontSize <= MIN_FONT_SIZE}
                    aria-label="Decrease font size"
                    className="flex size-8 items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Minus className="size-3.5 stroke-[2.5]" />
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-[13px] font-bold text-foreground">
                      {fontSize}px
                    </span>
                    <span className="text-[10px] text-foreground-dim">
                      {Math.round((fontSize / DEFAULT_FONT_SIZE) * 100)}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateFontSize({ newSize: fontSize + 2 })}
                    disabled={fontSize >= MAX_FONT_SIZE}
                    aria-label="Increase font size"
                    className="flex size-8 items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus className="size-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Quick Size Preset Pills */}
                <div className="grid grid-cols-4 gap-1 text-center">
                  {[
                    { label: "Sm", size: 20 },
                    { label: "Def", size: 22 },
                    { label: "Lg", size: 25 },
                    { label: "XL", size: 28 },
                  ].map((preset) => {
                    const isActive = fontSize === preset.size;
                    return (
                      <button
                        key={preset.size}
                        type="button"
                        onClick={() => handleUpdateFontSize({ newSize: preset.size })}
                        className={`rounded-[8px] py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "bg-surface-elevated text-foreground-secondary hover:text-foreground hover:bg-border"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>
        </div>

        {/* Right: Mark as Read button (only in plan context) */}
        {planContext && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (planContext && onToggleReading) {
                  onToggleReading(currentReading.id);
                }
              }}
              aria-pressed={currentReading.isCompleted}
              aria-label={currentReading.isCompleted ? "Mark as unread" : "Mark as read"}
              className={`flex items-center gap-1.5 rounded-[12px] border px-2.5 sm:px-3 py-1.5 text-[11.5px] sm:text-[13px] font-medium transition-all cursor-pointer shadow-2xs ${
                currentReading.isCompleted
                  ? "border-border bg-surface text-foreground hover:bg-surface-elevated hover:border-border-strong"
                  : "border-primary bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
              }`}
            >
              {currentReading.isCompleted ? (
                <>
                  <Check className="size-3.5 text-primary stroke-[2.5]" />
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5 text-primary-foreground stroke-[2.5]" />
                  <span className="hidden sm:inline">Mark as Read</span>
                  <span className="sm:hidden">Read</span>
                </>
              )}
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          IFRAME WEBVIEW BODY
          ========================================================================= */}
      <main className="relative flex-1 w-full bg-background overflow-hidden">
        {/* Themed Reading Skeleton */}
        {isIframeLoading && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-10 flex flex-col items-center justify-start overflow-hidden bg-background px-4 py-8 animate-in fade-in duration-150"
          >
            <div className="w-full max-w-[680px] space-y-6">
              {/* Heading Skeleton */}
              <div className="space-y-2">
                <div className="h-7 w-48 rounded-lg bg-surface-elevated animate-pulse" />
                <div className="h-3.5 w-32 rounded bg-surface-elevated/70 animate-pulse" />
              </div>

              {/* Verse Paragraph Skeleton */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-primary/20 animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-surface-elevated animate-pulse" />
                </div>
                <div className="h-4 w-11/12 rounded bg-surface-elevated animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-surface-elevated animate-pulse" />
              </div>

              {/* Second Verse Skeleton */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded bg-primary/20 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-surface-elevated animate-pulse" />
                </div>
                <div className="h-4 w-full rounded bg-surface-elevated animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-surface-elevated animate-pulse" />
              </div>

              {/* Status Hint */}
              <div className="flex items-center justify-center gap-2 pt-6 text-foreground-dim">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-[12px] font-medium">
                  Loading scripture...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Themed Proxy Iframe */}
        <iframe
          ref={iframeRef}
          key={`${iframeSrc}-${currentReading.id}`}
          src={iframeSrc}
          title={`Bible reading ${readingTitle}`}
          onLoad={handleIframeLoad}
          className="size-full border-0 bg-background"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </main>

      {/* =========================================================================
          BOTTOM NAVIGATION TOOLBAR
          ========================================================================= */}
      <footer className="sticky bottom-0 z-20 flex h-15 shrink-0 items-center justify-between border-t border-border bg-surface/95 px-4 sm:px-8 backdrop-blur-md">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!hasPrev}
          aria-label="Previous reading item"
          className="flex items-center gap-1.5 rounded-[12px] border border-border bg-surface px-3 sm:px-4 py-2 text-[12.5px] sm:text-[13px] font-medium text-foreground transition-all hover:bg-surface-elevated hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="size-4" />
          <span>Previous</span>
        </button>

        {/* Middle: Sequence Indicator */}
        <div className="text-center">
          {planContext ? (
            <span className="text-[11.5px] sm:text-[12.5px] font-semibold text-foreground">
              {currentIndex + 1}{" "}
              <span className="text-foreground-dim font-normal">
                of {flattenedReadings.length}
              </span>
            </span>
          ) : (
            <span className="text-[11.5px] sm:text-[12.5px] font-semibold text-foreground">
              {currentReading.bookName} {currentReading.chapter}
            </span>
          )}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Next reading item"
          className="flex items-center gap-1.5 rounded-[12px] border border-border bg-surface px-3 sm:px-4 py-2 text-[12.5px] sm:text-[13px] font-medium text-foreground transition-all hover:bg-surface-elevated hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
        >
          <span>Next</span>
          <ChevronRight className="size-4" />
        </button>
      </footer>
    </div>
  );
}