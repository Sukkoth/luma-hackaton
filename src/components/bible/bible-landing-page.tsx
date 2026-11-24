"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Compass,
  Play,
  X,
  ArrowUpRight,
} from "lucide-react";
import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";
import type { BibleBook } from "@/data/canons/types";
import {
  BIBLE_VERSIONS,
  type BibleVersion,
  detectDefaultVersion,
  saveSelectedVersion,
} from "@/lib/bible-versions";
import { FilterPills } from "@/components/ui/filter-pills";
import {
  HeaderActions,
  HeaderActionButton,
} from "@/components/ui/header-action-button";

const LAST_READ_STORAGE_KEY = "luma-last-read";

type LastRead = {
  bookId: string;
  chapter: number;
  versionId: number;
  timestamp: number;
};

function getLastRead(): LastRead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_READ_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastRead;
  } catch {
    return null;
  }
}

const AVAILABLE_CATEGORIES = Array.from(
  new Set(PROTESTANT_BIBLE_BOOKS.map((book) => book.category))
);

const FILTER_ITEMS = [
  { id: "All", label: "All (66)" },
  { id: "Old Testament", label: "Old Testament (39)" },
  { id: "New Testament", label: "New Testament (27)" },
  ...AVAILABLE_CATEGORIES.map((category) => ({
    id: category,
    label: category,
  })),
];

export function BibleLandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(() =>
    detectDefaultVersion({})
  );
  const [activeBook, setActiveBook] = useState<BibleBook | null>(null);

  useEffect(() => {
    const lr = getLastRead();
    if (!lr) return;
    const timer = setTimeout(() => {
      setLastRead(lr);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeBook) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveBook(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBook]);

  const handleSelectVersion = ({ version }: { version: BibleVersion }) => {
    setSelectedVersion(version);
    saveSelectedVersion({ versionId: version.id });
  };

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROTESTANT_BIBLE_BOOKS.filter((book) => {
      const matchesSearch =
        !q ||
        book.name.toLowerCase().includes(q) ||
        book.id.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedCategory === "All") return true;
      if (selectedCategory === "Old Testament") return book.testament === "OT";
      if (selectedCategory === "New Testament") return book.testament === "NT";
      return book.category === selectedCategory;
    });
  }, [searchQuery, selectedCategory]);

  const lastReadBook = lastRead
    ? PROTESTANT_BIBLE_BOOKS.find(
        (b) => b.id === lastRead.bookId.toLowerCase()
      )
    : undefined;

  const resumeHref = lastReadBook
    ? `/bible/${lastReadBook.id}/${lastRead?.chapter ?? 1}?v=${selectedVersion.id}`
    : `/bible/gen/1?v=${selectedVersion.id}`;

  const resumeLabel = lastReadBook
    ? `${lastReadBook.name} ${lastRead?.chapter ?? 1}`
    : "Genesis 1";

  return (
    <div className="space-y-6">
      {/* ── Unboxed Editorial Masthead ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Scripture Reader &amp; Living Text</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            The Holy Scriptures, chapter by chapter.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Browse all 66 canonical books, switch translations inline, and jump
            directly to any chapter.
          </p>
        </div>

        <HeaderActions>
          <HeaderActionButton
            type="secondary"
            href="/books"
            icon={<Compass className="size-4" />}
            label="Canon Books"
          />
          <HeaderActionButton
            type="primary"
            href={resumeHref}
            icon={<BookOpen className="size-4" />}
            label={resumeLabel}
          />
        </HeaderActions>
      </section>

      {/* ── Signature Horizon Ribbon (Resume + Translation Switcher) ── */}
      <section
        suppressHydrationWarning
        className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Column 1: Continue Reading Session */}
          <div className="pr-0 md:pr-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {lastReadBook ? "Recent Reading Session" : "Scripture Reader"}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {selectedVersion.abbreviation}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {resumeLabel}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {lastReadBook ? "Resume Chapter" : "Start Reading"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lastReadBook
                  ? `Pick up where you left off in ${selectedVersion.name}.`
                  : "In the beginning, God created the heavens and the earth."}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>66 books • 1,189 chapters</span>
              <Link
                href={resumeHref}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <Play className="size-3 fill-current" />
                <span>
                  {lastReadBook ? "Resume Reading" : "Start Genesis 1"} →
                </span>
              </Link>
            </div>
          </div>

          {/* Column 2: Active Translation Switcher */}
          <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Bible Translation
                </span>
              </div>
              <span className="text-[11px] font-medium text-primary">
                {selectedVersion.language.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {selectedVersion.abbreviation}
                </span>
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {selectedVersion.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose a translation below before opening any book or chapter.
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="Bible translation"
              className="flex flex-wrap items-center gap-1.5 pt-1"
            >
              {BIBLE_VERSIONS.map((version) => {
                const isSelected = version.id === selectedVersion.id;
                return (
                  <button
                    key={version.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectVersion({ version })}
                    className={`rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                        : "border-border/70 bg-surface-elevated text-foreground-secondary hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    {version.abbreviation}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Search & Canonical Filters ── */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-foreground-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books by name or category (e.g. Psalms, Gospels)..."
              className="w-full rounded-[14px] border border-border bg-surface pl-10 pr-9 py-2.5 text-[13.5px] text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-dim hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <span className="text-[12px] font-medium text-foreground-dim shrink-0">
            Showing {filteredBooks.length} of {PROTESTANT_BIBLE_BOOKS.length}{" "}
            books
          </span>
        </div>

        <FilterPills
          items={FILTER_ITEMS}
          activeFilter={selectedCategory}
          onFilterChange={({ filter }) => setSelectedCategory(filter)}
        />
      </section>

      {/* ── Book Grid ── */}
      {filteredBooks.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">
            No matching books found
          </p>
          <p className="text-xs text-muted-foreground">
            Try clearing your search or switching back to All books.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {filteredBooks.map((book) => {
            const orderFormatted =
              book.order < 10 ? `0${book.order}` : `${book.order}`;
            return (
              <button
                key={book.id}
                type="button"
                onClick={() => setActiveBook(book)}
                className="group flex flex-col justify-between rounded-[16px] border border-border bg-surface p-3.5 text-left transition-all duration-150 hover:border-border-strong hover:bg-surface-elevated/60 active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium tabular-nums text-foreground-dim">
                    {orderFormatted}
                  </span>
                  <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-foreground-secondary truncate">
                    {book.category}
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[14.5px] font-semibold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                      {book.name}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-foreground-dim">
                      {book.chapters}{" "}
                      {book.chapters === 1 ? "chapter" : "chapters"}
                    </p>
                  </div>
                  <ArrowUpRight className="size-3.5 shrink-0 text-foreground-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Chapter Picker Modal ── */}
      {activeBook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bible-chapter-dialog-title"
          onClick={() => setActiveBook(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ui-card relative flex max-h-[85vh] w-full max-w-145 flex-col p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between border-b border-border-subtle pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground-secondary">
                  <span className="text-primary font-semibold">
                    {activeBook.category}
                  </span>
                  <span>•</span>
                  <span>
                    {activeBook.testament === "OT"
                      ? "Old Testament"
                      : "New Testament"}
                  </span>
                  <span>•</span>
                  <span>{selectedVersion.abbreviation}</span>
                </div>
                <h3
                  id="bible-chapter-dialog-title"
                  className="mt-2 text-[24px] font-medium tracking-tight text-foreground"
                >
                  {activeBook.name}
                </h3>
                <p className="mt-0.5 text-[13px] text-foreground-secondary">
                  Select a chapter to open in the reader ({activeBook.chapters}{" "}
                  {activeBook.chapters === 1 ? "chapter" : "chapters"})
                </p>
              </div>

              <button
                type="button"
                aria-label="Close chapter picker"
                onClick={() => setActiveBook(null)}
                className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary transition-colors hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <span className="text-[12px] font-medium text-foreground-dim">
                Opening in {selectedVersion.name}
              </span>
              <Link
                href={`/bible/${activeBook.id}/1?v=${selectedVersion.id}`}
                className="ui-btn-primary ui-btn-sm gap-1.5"
              >
                <BookOpen className="size-3.5" />
                <span>Read Chapter 1</span>
              </Link>
            </div>

            <div className="my-3 max-h-[46vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                {Array.from(
                  { length: activeBook.chapters },
                  (_, index) => index + 1
                ).map((chapterNum) => (
                  <Link
                    key={chapterNum}
                    href={`/bible/${activeBook.id}/${chapterNum}?v=${selectedVersion.id}`}
                    className="flex h-10 items-center justify-center rounded-xl border border-border bg-surface-elevated text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {chapterNum}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
