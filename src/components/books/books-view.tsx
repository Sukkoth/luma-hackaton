"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Search,
  Check,
  X,
  Bookmark,
  CheckCircle2,
} from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";
import { BIBLE_BOOKS, type BibleBook } from "@/data/bibleData";

type BooksViewProps = {
  initialReadData?: Record<string, ReadonlyArray<number>>;
};

// Initial realistic read chapters sample for initial state
const DEFAULT_READ_CHAPTERS: Record<string, ReadonlyArray<number>> = {
  gen: Array.from({ length: 50 }, (_, i) => i + 1), // Genesis complete
  exo: Array.from({ length: 20 }, (_, i) => i + 1), // Exodus 1-20
  psa: Array.from({ length: 45 }, (_, i) => i + 1), // Psalms 1-45
  pro: Array.from({ length: 31 }, (_, i) => i + 1), // Proverbs complete
  mat: Array.from({ length: 28 }, (_, i) => i + 1), // Matthew complete
  mrk: Array.from({ length: 16 }, (_, i) => i + 1), // Mark complete
  luk: Array.from({ length: 24 }, (_, i) => i + 1), // Luke complete
  jhn: Array.from({ length: 21 }, (_, i) => i + 1), // John complete
  act: Array.from({ length: 14 }, (_, i) => i + 1), // Acts 1-14
  rom: Array.from({ length: 8 }, (_, i) => i + 1), // Romans 1-8
};

const CATEGORY_FILTERS = [
  "All",
  "Old Testament",
  "New Testament",
  "Law",
  "History",
  "Poetry & Wisdom",
  "Major Prophets",
  "Minor Prophets",
  "Gospels",
  "Pauline Epistles",
  "General Epistles",
] as const;

export function BooksView({
  initialReadData = DEFAULT_READ_CHAPTERS,
}: BooksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [readChapters, setReadChapters] =
    useState<Record<string, ReadonlyArray<number>>>(initialReadData);
  const [activeBook, setActiveBook] = useState<BibleBook | null>(null);

  // Filter books
  const filteredBooks = BIBLE_BOOKS.filter((book) => {
    const matchesSearch =
      book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === "All") return true;
    if (selectedCategory === "Old Testament") return book.testament === "OT";
    if (selectedCategory === "New Testament") return book.testament === "NT";
    return book.category === selectedCategory;
  });

  // Calculate totals
  const totalChaptersAcrossCanon = 1189;
  const totalReadChapters = Object.values(readChapters).reduce(
    (acc, chs) => acc + chs.length,
    0
  );
  const canonPercentage = Math.round(
    (totalReadChapters / totalChaptersAcrossCanon) * 100
  );

  // Handle chapter toggle for active book
  const handleToggleChapter = ({
    bookId,
    chapter,
  }: {
    bookId: string;
    chapter: number;
  }) => {
    setReadChapters((prev) => {
      const current = prev[bookId] ?? [];
      const hasRead = current.includes(chapter);
      const nextChapters = hasRead
        ? current.filter((c) => c !== chapter)
        : [...current, chapter].sort((a, b) => a - b);
      return {
        ...prev,
        [bookId]: nextChapters,
      };
    });
  };

  const handleMarkAllChapters = ({ book }: { book: BibleBook }) => {
    setReadChapters((prev) => ({
      ...prev,
      [book.id]: Array.from({ length: book.chapters }, (_, i) => i + 1),
    }));
  };

  const handleClearAllChapters = ({ bookId }: { bookId: string }) => {
    setReadChapters((prev) => ({
      ...prev,
      [bookId]: [],
    }));
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      {/* Top Highlight Cards: Verse of the Day & Active Reading */}
      <section className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Verse of the Day */}
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#82ADD4]/20 text-[#6894BC]">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-[12px] font-medium tracking-wide text-[#555555] dark:text-[#9CA3AF]">
                  Verse of the Day
                </span>
              </div>
              <span className="rounded-[4px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                Daily Light
              </span>
            </div>

            <blockquote className="mt-4 text-[20px] leading-relaxed font-light text-black sm:text-[22px] dark:text-white">
              &ldquo;Your word is a lamp to my feet and a light to my
              path.&rdquo;
            </blockquote>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[13px] text-[#777777] dark:border-white/[0.08] dark:text-[#9CA3AF]">
            <span className="font-medium text-black dark:text-white">
              Psalm 119:105
            </span>
            <span>English Standard Version</span>
          </div>
        </div>

        {/* Today's Active Plan Reading */}
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                <Calendar className="h-3.5 w-3.5 text-[#82ADD4]" />
                <span>Today&apos;s Reading</span>
              </span>
              <Link
                href="/plans"
                className="text-[12px] font-medium text-[#6894BC] hover:underline"
              >
                View Plans
              </Link>
            </div>

            <div className="mt-4 rounded-[16px] border border-white/90 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#82ADD4] text-white">
                    <Bookmark className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-black dark:text-white">
                      Romans 8:1–39
                    </h4>
                    <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                      Bible in a Year • Day 212
                    </p>
                  </div>
                </div>
                <span className="rounded-[4px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                  94%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[12px] text-[#777777] dark:border-white/[0.08] dark:text-[#9CA3AF]">
            <span>Bible Tracker Total</span>
            <span className="font-light text-black dark:text-white">
              {totalReadChapters} / {totalChaptersAcrossCanon} ch (
              {canonPercentage}%)
            </span>
          </div>
        </div>
      </section>

      {/* 66 Books Section */}
      <section className="glass-panel mt-4 rounded-[28px] p-6 sm:p-7">
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col gap-4 border-b border-black/[0.04] pb-5 md:flex-row md:items-center md:justify-between dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-normal tracking-tight text-black dark:text-white">
                All Books
              </h2>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                {filteredBooks.length} Books
              </span>
            </div>
            <p className="mt-1 text-[13px] font-normal text-[#777777] dark:text-[#9CA3AF]">
              Tap any book to view chapters and toggle your reading progress.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full rounded-[12px] border border-white/80 bg-white/50 py-2 pr-3.5 pl-9 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-white focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-[#6B7280] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#888888] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills (Soft rounded rectangular tiles) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-[12px] px-3.5 py-1.5 text-[12px] backdrop-blur-md transition-all ${
                  isSelected
                    ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                    : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/[0.04] dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 66 Books Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredBooks.map((book) => {
            const readList = readChapters[book.id] ?? [];
            const readCount = readList.length;
            const isFullyRead = readCount === book.chapters;
            const progressPercent = Math.round(
              (readCount / book.chapters) * 100
            );

            return (
              <button
                key={book.id}
                type="button"
                onClick={() => setActiveBook(book)}
                className="group relative flex flex-col justify-between rounded-[18px] border border-black/[0.08] bg-white/75 p-4 text-left shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-black/[0.16] hover:bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-white/[0.16] dark:hover:bg-white/[0.08]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
                      {book.testament === "OT" ? "Old Test." : "New Test."}
                    </span>
                    {isFullyRead ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DDFD2C] text-black shadow-2xs">
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      </span>
                    ) : readCount > 0 ? (
                      <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/25 dark:text-[#82ADD4]">
                        {progressPercent}%
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-2 text-[15px] font-medium tracking-tight text-black group-hover:text-[#6894BC] dark:text-white dark:group-hover:text-[#82ADD4]">
                    {book.name}
                  </h3>
                  <p className="text-[11px] font-normal text-[#777777] dark:text-[#9CA3AF]">
                    {book.category}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                    <span>
                      {readCount} / {book.chapters} ch
                    </span>
                  </div>

                  {/* Micro Progress Track */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFullyRead
                          ? "bg-[#DDFD2C]"
                          : "bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredBooks.length === 0 && (
          <div className="py-16 text-center text-[#777777]">
            <p className="text-[15px] font-normal">
              No Bible books found matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-3 rounded-[12px] border border-white/80 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-black shadow-2xs hover:bg-white"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Chapter Selection Drawer / Modal */}
      {activeBook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chapter-dialog-title"
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm duration-200"
        >
          <div className="glass-panel relative flex max-h-[85vh] w-full max-w-[580px] flex-col rounded-[30px] border border-white/90 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-[#121215]/95">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
              <div>
                <span className="text-[11px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
                  {activeBook.testament === "OT"
                    ? "Old Testament"
                    : "New Testament"}{" "}
                  • {activeBook.category}
                </span>
                <h3
                  id="chapter-dialog-title"
                  className="mt-0.5 text-[24px] font-normal tracking-tight text-black dark:text-white"
                >
                  {activeBook.name}
                </h3>
                <p className="text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                  {readChapters[activeBook.id]?.length ?? 0} of{" "}
                  {activeBook.chapters} chapters read
                </p>
              </div>

              <button
                type="button"
                aria-label="Close chapter sheet"
                onClick={() => setActiveBook(null)}
                className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-black/5 text-[#555555] transition-colors hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-[#9CA3AF] dark:hover:bg-white/20 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between py-3">
              <span className="text-[12px] font-normal text-[#777777] dark:text-[#9CA3AF]">
                Tap chapters to toggle
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAllChapters({ book: activeBook })}
                  className="flex items-center gap-1.5 rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark All Read</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleClearAllChapters({ bookId: activeBook.id })
                  }
                  className="rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-[#555555] backdrop-blur-md transition-all hover:border-white/80 hover:bg-white hover:text-black dark:border-white/5 dark:bg-white/5 dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Scrollable Chapter Grid */}
            <div className="my-2 max-h-[46vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                {Array.from(
                  { length: activeBook.chapters },
                  (_, i) => i + 1
                ).map((ch) => {
                  const isRead =
                    readChapters[activeBook.id]?.includes(ch) ?? false;
                  return (
                    <button
                      key={ch}
                      type="button"
                      aria-pressed={isRead}
                      onClick={() =>
                        handleToggleChapter({
                          bookId: activeBook.id,
                          chapter: ch,
                        })
                      }
                      className={`flex h-10 items-center justify-center rounded-[11px] text-[13px] transition-all ${
                        isRead
                          ? "bg-[#82ADD4] font-medium text-white shadow-xs hover:bg-[#6894BC]"
                          : "border border-black/[0.06] bg-white/60 font-normal text-black hover:border-black/20 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.1]"
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
              <span className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                Progress:{" "}
                <strong className="font-medium text-black dark:text-white">
                  {Math.round(
                    ((readChapters[activeBook.id]?.length ?? 0) /
                      activeBook.chapters) *
                      100
                  )}
                  %
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveBook(null)}
                className="rounded-[12px] bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
