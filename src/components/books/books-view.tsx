"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";
import {
  type BibleCanon,
  getBibleBooks,
  getCanonTestamentChapters,
  type BibleBook,
} from "@/data/bibleData";
import { useSession } from "@/lib/auth-client";
import {
  toggleChapterAction,
  markAllChaptersAction,
  clearAllChaptersAction,
} from "@/actions/chapters";
import { VerseOfTheDayBanner } from "./verse-of-the-day-banner";
import { BookCard } from "./book-card";
import { BookChaptersModal } from "./book-chapters-modal";
import { BooksAuthModal } from "./books-auth-modal";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { UserTrackerSummary } from "@/actions/trackers";
import type { VerseOfTheDayData } from "@/lib/youversion";

type Props = {
  initialReadData?: Record<string, ReadonlyArray<number>>;
  activeTrackerId?: string | null;
  trackerName?: string | null;
  canon?: BibleCanon;
  trackers?: ReadonlyArray<UserTrackerSummary>;
  userName?: string | null;
  streak?: StreakData;
  verseOfTheDay?: VerseOfTheDayData;
};

const DEFAULT_READ_CHAPTERS: Record<string, ReadonlyArray<number>> = {};

export function BooksView({
  initialReadData = DEFAULT_READ_CHAPTERS,
  activeTrackerId = null,
  trackerName = null,
  canon = "protestant",
  trackers,
  userName = null,
  streak,
  verseOfTheDay,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [readChapters, setReadChapters] =
    useState<Record<string, ReadonlyArray<number>>>(initialReadData);
  const [activeBook, setActiveBook] = useState<BibleBook | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const canonBooks = getBibleBooks(canon);
  const canonStats = getCanonTestamentChapters(canon);

  // Dynamically compute category filters based on books present in this canon
  const availableCategories = Array.from(
    new Set(canonBooks.map((b) => b.category))
  );
  const categoryFilters = [
    "All",
    "Old Testament",
    "New Testament",
    ...availableCategories,
  ];

  // Filter books
  const filteredBooks = canonBooks.filter((book) => {
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
  const totalChaptersAcrossCanon = canonStats.total;
  const totalReadChapters = Object.values(readChapters).reduce(
    (acc, chs) => acc + chs.length,
    0
  );
  const canonPercentage = Math.round(
    (totalReadChapters / totalChaptersAcrossCanon) * 100
  );

  // Handle chapter toggle for active book - requires authenticated active tracker
  const handleToggleChapter = ({
    bookId,
    bookName,
    chapter,
  }: {
    bookId: string;
    bookName: string;
    chapter: number;
  }) => {
    if (!activeTrackerId) {
      setShowAuthModal(true);
      return;
    }

    const current = readChapters[bookId] ?? [];
    const isAdding = !current.includes(chapter);
    const updated = isAdding
      ? [...current, chapter]
      : current.filter((c) => c !== chapter);

    setReadChapters((prev) => ({
      ...prev,
      [bookId]: updated,
    }));

    startTransition(async () => {
      const result = await toggleChapterAction({
        trackerId: activeTrackerId,
        bookId,
        bookName,
        chapter,
      });

      if (!result.success) {
        setReadChapters((prev) => ({
          ...prev,
          [bookId]: current,
        }));
      }
    });
  };

  // Mark all chapters as read for active book
  const handleMarkAllChapters = ({ book }: { book: BibleBook }) => {
    if (!activeTrackerId) {
      setShowAuthModal(true);
      return;
    }

    const current = readChapters[book.id] ?? [];
    const all = Array.from({ length: book.chapters }, (_, i) => i + 1);

    setReadChapters((prev) => ({
      ...prev,
      [book.id]: all,
    }));

    startTransition(async () => {
      const result = await markAllChaptersAction({
        trackerId: activeTrackerId,
        bookId: book.id,
        bookName: book.name,
        totalChapters: book.chapters,
      });

      if (!result.success) {
        setReadChapters((prev) => ({
          ...prev,
          [book.id]: current,
        }));
      }
    });
  };

  // Reset all chapters for active book
  const handleClearAllChapters = ({ bookId }: { bookId: string }) => {
    if (!activeTrackerId) {
      setShowAuthModal(true);
      return;
    }

    const current = readChapters[bookId] ?? [];

    setReadChapters((prev) => ({
      ...prev,
      [bookId]: [],
    }));

    startTransition(async () => {
      const result = await clearAllChaptersAction({
        trackerId: activeTrackerId,
        bookId,
      });

      if (!result.success) {
        setReadChapters((prev) => ({
          ...prev,
          [bookId]: current,
        }));
      }
    });
  };

  return (
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar
        userName={userName || session?.user?.name || "Reader"}
        streak={streak}
        trackers={trackers}
        activeTrackerId={activeTrackerId}
      />

      {/* Top Highlight Cards: Verse of the Day & Active Reading */}
      <VerseOfTheDayBanner
        totalReadChapters={totalReadChapters}
        totalChaptersAcrossCanon={totalChaptersAcrossCanon}
        canonPercentage={canonPercentage}
        verse={verseOfTheDay}
      />

      {/* Books Section */}
      <section className="glass-panel mt-4 rounded-[28px] p-6 sm:p-7">
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col gap-4 border-b border-black/4 pb-5 md:flex-row md:items-center md:justify-between dark:border-white/8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-normal tracking-tight text-black dark:text-white">
                All Books
              </h2>
              <span className="rounded-full bg-black/4 px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                {filteredBooks.length} Books
              </span>
              {trackerName && (
                <span className="hidden rounded-full bg-[#82ADD4]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#507ea6] sm:inline-block dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                  {trackerName}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] font-normal text-[#777777] dark:text-[#9CA3AF]">
              Tap any book to view chapters and toggle your reading progress.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-3.5 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full rounded-xl border border-white/80 bg-white/50 py-2 pr-3.5 pl-9 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-white focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/4 dark:text-white dark:placeholder:text-[#6B7280] dark:focus:border-white/20 dark:focus:bg-white/8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#888888] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-[12px] backdrop-blur-md transition-all ${
                  isSelected
                    ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/20 dark:bg-white/15 dark:text-white"
                    : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/5 dark:bg-white/4 dark:text-[#9CA3AF] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
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
            return (
              <BookCard
                key={book.id}
                book={book}
                readCount={readList.length}
                onSelect={({ book: selected }) => setActiveBook(selected)}
              />
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
              className="mt-3 rounded-xl border border-white/80 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-black shadow-2xs hover:bg-white"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Chapter Selection Drawer / Modal */}
      {activeBook && (
        <BookChaptersModal
          book={activeBook}
          readChapters={readChapters[activeBook.id] ?? []}
          onClose={() => setActiveBook(null)}
          onToggleChapter={handleToggleChapter}
          onMarkAll={handleMarkAllChapters}
          onClearAll={handleClearAllChapters}
        />
      )}

      {/* Auth Guard Modal */}
      <BooksAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={() => router.push("/login?redirect=/books")}
      />
    </div>
  );
}
