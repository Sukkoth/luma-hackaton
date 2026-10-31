"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";
import { BIBLE_BOOKS, type BibleBook } from "@/data/bibleData";
import { useSession } from "@/lib/auth-client";
import { VerseOfTheDayBanner } from "./verse-of-the-day-banner";
import { BookCard } from "./book-card";
import { BookChaptersModal } from "./book-chapters-modal";
import { BooksAuthModal } from "./books-auth-modal";

type Props = {
  initialReadData?: Record<string, ReadonlyArray<number>>;
};

const DEFAULT_READ_CHAPTERS: Record<string, ReadonlyArray<number>> = {};

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

export function BooksView({ initialReadData = DEFAULT_READ_CHAPTERS }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [readChapters, setReadChapters] =
    useState<Record<string, ReadonlyArray<number>>>(initialReadData);
  const [activeBook, setActiveBook] = useState<BibleBook | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  // Handle chapter toggle for active book - requires authentication
  const handleToggleChapter = ({
    bookId,
    chapter,
  }: {
    bookId: string;
    chapter: number;
  }) => {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    setReadChapters((prev) => {
      const current = prev[bookId] ?? [];
      const updated = current.includes(chapter)
        ? current.filter((c) => c !== chapter)
        : [...current, chapter];
      return { ...prev, [bookId]: updated };
    });
  };

  // Mark all chapters as read for active book
  const handleMarkAllChapters = ({ book }: { book: BibleBook }) => {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    const all = Array.from({ length: book.chapters }, (_, i) => i + 1);
    setReadChapters((prev) => ({
      ...prev,
      [book.id]: all,
    }));
  };

  // Reset all chapters for active book
  const handleClearAllChapters = ({ bookId }: { bookId: string }) => {
    if (!session?.user) {
      setShowAuthModal(true);
      return;
    }

    setReadChapters((prev) => ({
      ...prev,
      [bookId]: [],
    }));
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName={session?.user?.name || "Reader"} />

      {/* Top Highlight Cards: Verse of the Day & Active Reading */}
      <VerseOfTheDayBanner
        totalReadChapters={totalReadChapters}
        totalChaptersAcrossCanon={totalChaptersAcrossCanon}
        canonPercentage={canonPercentage}
      />

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
            <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
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

        {/* Category Filter Pills */}
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
              className="mt-3 rounded-[12px] border border-white/80 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-black shadow-2xs hover:bg-white"
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
