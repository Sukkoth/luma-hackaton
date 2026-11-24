"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import type { PlanSessionDetail } from "@/actions/plans";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  BIBLE_VERSIONS,
  type BibleVersion,
  detectDefaultVersion,
  saveSelectedVersion,
  buildBibleComPath,
  isBookSupportedInSixtySixBookVersions,
} from "@/lib/bible-versions";

export type PlanBibleReaderModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  allSessions: ReadonlyArray<PlanSessionDetail>;
  currentReadingId: string | null;
  onSelectReadingAction: (readingId: string) => void;
  onToggleReadingAction: (readingItemId: string) => void;
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

type SaveStoredFontSizeParams = {
  fontSize: number;
};

function saveStoredFontSize({ fontSize }: SaveStoredFontSizeParams): void {
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

export function PlanBibleReaderModal({
  isOpen,
  onCloseAction,
  allSessions,
  currentReadingId,
  onSelectReadingAction,
  onToggleReadingAction,
}: PlanBibleReaderModalProps) {
  const { resolvedTheme } = useTheme();

  // Local optimistic completion overrides so the button immediately reflects toggles
  const [optimisticCompletedMap, setOptimisticCompletedMap] = useState<
    Record<string, boolean>
  >({});

  // Version state initialized from detector (localStorage / timezone)
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(() =>
    detectDefaultVersion({})
  );
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  // Font size state initialized from storage (default: 17px)
  const [fontSize, setFontSize] = useState<number>(() => getStoredFontSize());
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const versionMenuRef = useRef<HTMLDivElement | null>(null);
  const fontMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click or window blur (clicking into iframe)
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

  type HandleUpdateFontSizeParams = {
    newSize: number;
  };

  const handleUpdateFontSize = ({ newSize }: HandleUpdateFontSizeParams) => {
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

  // Flatten all reading items in sequential plan order
  const flattenedReadings = useMemo(() => {
    const list: FlattenedReading[] = [];
    for (const session of allSessions) {
      for (const reading of session.readings) {
        const isCompleted =
          optimisticCompletedMap[reading.id] !== undefined
            ? optimisticCompletedMap[reading.id]
            : reading.isCompleted;
        list.push({
          id: reading.id,
          bookId: reading.bookId,
          bookName: reading.bookName,
          chapter: reading.chapter,
          startVerse: reading.startVerse,
          endVerse: reading.endVerse,
          displayText: reading.displayText,
          isCompleted,
          sessionIndex: session.sessionIndex,
          sessionTitle: session.title,
        });
      }
    }
    return list;
  }, [allSessions, optimisticCompletedMap]);

  // Current reading item
  const currentIndex = flattenedReadings.findIndex(
    (r) => r.id === currentReadingId
  );
  const currentReading =
    currentIndex >= 0 ? flattenedReadings[currentIndex] : flattenedReadings[0];

  const hasPrev = currentIndex > 0;
  const hasNext =
    currentIndex >= 0 && currentIndex < flattenedReadings.length - 1;

  const isBookSupported = currentReading
    ? isBookSupportedInSixtySixBookVersions({ bookId: currentReading.bookId })
    : false;

  // Bible proxy path and active src (decoupled from theme changes to prevent iframe remounting)
  const biblePath =
    currentReading && isBookSupported
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

  const handleToggleCurrentReading = useCallback(() => {
    if (!currentReading) return;
    const nextStatus = !currentReading.isCompleted;
    setOptimisticCompletedMap((prev) => ({
      ...prev,
      [currentReading.id]: nextStatus,
    }));
    onToggleReadingAction(currentReading.id);
  }, [currentReading, onToggleReadingAction]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseAction();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        const prevItem = flattenedReadings[currentIndex - 1];
        if (
          prevItem &&
          isBookSupportedInSixtySixBookVersions({ bookId: prevItem.bookId })
        ) {
          onSelectReadingAction(prevItem.id);
        }
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        const nextItem = flattenedReadings[currentIndex + 1];
        if (
          nextItem &&
          isBookSupportedInSixtySixBookVersions({ bookId: nextItem.bookId })
        ) {
          onSelectReadingAction(nextItem.id);
        }
      } else if (
        (e.key === "m" || e.key === "M") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        handleToggleCurrentReading();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    hasPrev,
    hasNext,
    currentIndex,
    flattenedReadings,
    currentReading,
    onCloseAction,
    onSelectReadingAction,
    handleToggleCurrentReading,
  ]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Staggered background prefetch of adjacent reading items
  // Waits until current passage finishes loading so it never competes for bandwidth
  useEffect(() => {
    if (!isOpen || isIframeLoading) return;

    const controller = new AbortController();
    let nextTimer: ReturnType<typeof setTimeout> | null = null;
    let prevTimer: ReturnType<typeof setTimeout> | null = null;

    if (hasNext) {
      nextTimer = setTimeout(() => {
        const nextItem = flattenedReadings[currentIndex + 1];
        if (
          nextItem &&
          isBookSupportedInSixtySixBookVersions({ bookId: nextItem.bookId })
        ) {
          const path = buildBibleComPath({
            versionId: selectedVersion.id,
            bookId: nextItem.bookId,
            chapter: nextItem.chapter,
            startVerse: nextItem.startVerse,
            endVerse: nextItem.endVerse,
          });
          void fetch(`/api/bible-proxy?path=${encodeURIComponent(path)}`, {
            signal: controller.signal,
          }).catch(() => {
            // Ignore aborts during cleanup
          });
        }
      }, 800);
    }

    if (hasPrev) {
      prevTimer = setTimeout(() => {
        const prevItem = flattenedReadings[currentIndex - 1];
        if (
          prevItem &&
          isBookSupportedInSixtySixBookVersions({ bookId: prevItem.bookId })
        ) {
          const path = buildBibleComPath({
            versionId: selectedVersion.id,
            bookId: prevItem.bookId,
            chapter: prevItem.chapter,
            startVerse: prevItem.startVerse,
            endVerse: prevItem.endVerse,
          });
          void fetch(`/api/bible-proxy?path=${encodeURIComponent(path)}`, {
            signal: controller.signal,
          }).catch(() => {
            // Ignore aborts during cleanup
          });
        }
      }, 2200);
    }

    return () => {
      if (nextTimer) clearTimeout(nextTimer);
      if (prevTimer) clearTimeout(prevTimer);
      controller.abort();
    };
  }, [
    isOpen,
    isIframeLoading,
    currentIndex,
    hasNext,
    hasPrev,
    flattenedReadings,
    selectedVersion.id,
  ]);

  if (!isOpen || !currentReading) return null;

  type HandleSelectVersionParams = {
    version: BibleVersion;
  };

  const handleSelectVersion = ({ version }: HandleSelectVersionParams) => {
    setSelectedVersion(version);
    saveSelectedVersion({ versionId: version.id });
    setIsVersionDropdownOpen(false);
  };

  const handlePrev = () => {
    if (hasPrev) {
      const prev = flattenedReadings[currentIndex - 1];
      if (prev) onSelectReadingAction(prev.id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const next = flattenedReadings[currentIndex + 1];
      if (next) onSelectReadingAction(next.id);
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

  const readingTitle =
    currentReading.displayText ||
    `${currentReading.bookName} ${currentReading.chapter}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reading ${readingTitle}`}
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in fade-in duration-200 select-none"
    >
      {/* =========================================================================
          TOP TOOLBAR
          ========================================================================= */}
      <header className="sticky top-0 z-20 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-border bg-surface/95 px-3 sm:px-6 backdrop-blur-md gap-2">
        {/* Left: Close button + Passage info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onCloseAction}
            aria-label="Close reading view"
            className="flex size-8.5 sm:size-10 shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface text-foreground-secondary transition-all hover:bg-surface-elevated hover:text-foreground cursor-pointer shadow-2xs"
          >
            <X className="size-4 sm:size-4.5" />
          </button>

          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="truncate text-[13px] sm:text-[16px] font-bold text-foreground">
                {readingTitle}
              </span>
              {currentReading.isCompleted && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <CheckCircle2 className="size-3.5 fill-primary text-primary-foreground" />
                  <span>Completed</span>
                </span>
              )}
            </div>
            <span className="truncate text-[10px] sm:text-[11px] font-medium text-foreground-dim">
              {currentReading.sessionTitle} • Item {currentIndex + 1} of{" "}
              {flattenedReadings.length}
            </span>
          </div>
        </div>

        {/* Center: Version Selector & Font Size Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Version Selector Dropdown */}
          {isBookSupported && (
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
          )}

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
                      onClick={() =>
                        handleUpdateFontSize({ newSize: DEFAULT_FONT_SIZE })
                      }
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
                    onClick={() =>
                      handleUpdateFontSize({ newSize: fontSize - 2 })
                    }
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
                    onClick={() =>
                      handleUpdateFontSize({ newSize: fontSize + 2 })
                    }
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
                        onClick={() =>
                          handleUpdateFontSize({ newSize: preset.size })
                        }
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

          {/* Theme Toggle: hidden on mobile toolbar to avoid crowding, accessible on larger screens */}
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>
        </div>

        {/* Right: Mark as Read Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleCurrentReading}
            aria-pressed={currentReading.isCompleted}
            aria-label={
              currentReading.isCompleted ? "Mark as unread" : "Mark as read"
            }
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
        ) : (
          <iframe
            ref={iframeRef}
            key={`${iframeSrc}-${currentReading.id}`}
            src={iframeSrc}
            title={`Bible reading ${readingTitle}`}
            onLoad={handleIframeLoad}
            className="size-full border-0 bg-background"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
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
          <span className="text-[11.5px] sm:text-[12.5px] font-semibold text-foreground">
            {currentIndex + 1}{" "}
            <span className="text-foreground-dim font-normal">
              of {flattenedReadings.length}
            </span>
          </span>
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
