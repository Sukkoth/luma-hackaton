"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import { Search, X } from "lucide-react";
import { AppShell } from "@/components/navigation/app-shell";
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
import { FilterPills } from "@/components/ui/filter-pills";

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
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [selectedCategory, setSelectedCategory] = useQueryState(
    "category",
    parseAsString.withDefault("All")
  );
  const [readChapters, setReadChapters] =
    useState<Record<string, ReadonlyArray<number>>>(initialReadData);
  const [activeBook, setActiveBook] = useState<BibleBook | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const canonBooks = getBibleBooks(canon);
  const canonStats = getCanonTestamentChapters(canon);

  const availableCategories = Array.from(
    new Set(canonBooks.map((b) => b.category))
  );
  const categoryFilters = [
    "All",
    "Old Testament",
    "New Testament",
    ...availableCategories,
  ];

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

  const totalChaptersAcrossCanon = canonStats.total;
  const totalReadChapters = Object.values(readChapters).reduce(
    (acc, chs) => acc + chs.length,
    0
  );
  const canonPercentage = Math.round(
    (totalReadChapters / totalChaptersAcrossCanon) * 100
  );

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
      } else if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
        window.dispatchEvent(
          new CustomEvent("achievement-unlocked", {
            detail: result.newlyUnlocked,
          })
        );
      }
    });
  };

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
      } else if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
        window.dispatchEvent(
          new CustomEvent("achievement-unlocked", {
            detail: result.newlyUnlocked,
          })
        );
      }
    });
  };

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
    <AppShell
      userName={userName || session?.user?.name || "Reader"}
      userEmail={session?.user?.email}
      userImage={session?.user?.image ?? undefined}
      streak={streak}
      trackers={trackers}
      activeTrackerId={activeTrackerId}
    >
      <div className="w-full max-w-[1440px] mx-auto space-y-6">
        {/* Top Highlight Cards */}
        <VerseOfTheDayBanner
          totalReadChapters={totalReadChapters}
          totalChaptersAcrossCanon={totalChaptersAcrossCanon}
          canonPercentage={canonPercentage}
          verse={verseOfTheDay}
        />

        {/* Books Section */}
        <section className="ui-card p-3.5 sm:p-6">
          {/* Header & Controls Toolbar */}
          <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2
                  className="text-xl font-bold tracking-tight text-foreground"
                  aria-label="All Books"
                >
                  Scripture Books
                </h2>
                <span className="text-xs text-muted-foreground font-semibold">
                  All Books ({filteredBooks.length} of {canonBooks.length})
                </span>
                {trackerName && (
                  <span className="hidden sm:inline-block rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                    {trackerName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Select any book to check off chapters or open the Scripture
                reader.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search books..."
                className="w-full rounded-xl border border-input bg-card py-2 pr-3.5 pl-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills - Horizontally scrollable on small screens */}
          <FilterPills
            containerTestId="books-category-filter"
            className="mt-4"
            items={categoryFilters.map((cat) => ({ id: cat, label: cat }))}
            activeFilter={selectedCategory}
            onFilterChange={({ filter }) => setSelectedCategory(filter)}
          />

          {/* Books Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm">
                No Bible books found matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-3 rounded-xl border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
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
    </AppShell>
  );
}
