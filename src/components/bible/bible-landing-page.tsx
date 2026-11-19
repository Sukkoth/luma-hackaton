"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Clock,
  Zap,
  Settings,
  Compass,
  Play,
} from "lucide-react";
import { detectDefaultVersion } from "@/lib/bible-versions";
import { Button } from "@/components/ui/button";

const OLD_TESTAMENT_BOOKS = [
  { id: "gen", name: "Genesis", chapters: 50 },
  { id: "exo", name: "Exodus", chapters: 40 },
  { id: "lev", name: "Leviticus", chapters: 27 },
  { id: "num", name: "Numbers", chapters: 36 },
  { id: "deu", name: "Deuteronomy", chapters: 34 },
  { id: "jos", name: "Joshua", chapters: 24 },
  { id: "jdg", name: "Judges", chapters: 21 },
  { id: "rut", name: "Ruth", chapters: 4 },
  { id: "1sa", name: "1 Samuel", chapters: 31 },
  { id: "2sa", name: "2 Samuel", chapters: 24 },
  { id: "1ki", name: "1 Kings", chapters: 22 },
  { id: "2ki", name: "2 Kings", chapters: 25 },
  { id: "1ch", name: "1 Chronicles", chapters: 29 },
  { id: "2ch", name: "2 Chronicles", chapters: 36 },
  { id: "ezr", name: "Ezra", chapters: 10 },
  { id: "neh", name: "Nehemiah", chapters: 13 },
  { id: "est", name: "Esther", chapters: 10 },
  { id: "job", name: "Job", chapters: 42 },
  { id: "psa", name: "Psalms", chapters: 150 },
  { id: "pro", name: "Proverbs", chapters: 31 },
  { id: "ecc", name: "Ecclesiastes", chapters: 12 },
  { id: "sng", name: "Song of Solomon", chapters: 8 },
  { id: "isa", name: "Isaiah", chapters: 66 },
  { id: "jer", name: "Jeremiah", chapters: 52 },
  { id: "lam", name: "Lamentations", chapters: 5 },
  { id: "ezk", name: "Ezekiel", chapters: 48 },
  { id: "dan", name: "Daniel", chapters: 12 },
  { id: "hos", name: "Hosea", chapters: 14 },
  { id: "jol", name: "Joel", chapters: 3 },
  { id: "amo", name: "Amos", chapters: 9 },
  { id: "oba", name: "Obadiah", chapters: 1 },
  { id: "jon", name: "Jonah", chapters: 4 },
  { id: "mic", name: "Micah", chapters: 7 },
  { id: "nam", name: "Nahum", chapters: 3 },
  { id: "hab", name: "Habakkuk", chapters: 3 },
  { id: "zep", name: "Zephaniah", chapters: 3 },
  { id: "hag", name: "Haggai", chapters: 2 },
  { id: "zec", name: "Zechariah", chapters: 14 },
  { id: "mal", name: "Malachi", chapters: 4 },
];

const NEW_TESTAMENT_BOOKS = [
  { id: "mat", name: "Matthew", chapters: 28 },
  { id: "mrk", name: "Mark", chapters: 16 },
  { id: "luk", name: "Luke", chapters: 24 },
  { id: "jhn", name: "John", chapters: 21 },
  { id: "act", name: "Acts", chapters: 28 },
  { id: "rom", name: "Romans", chapters: 16 },
  { id: "1co", name: "1 Corinthians", chapters: 16 },
  { id: "2co", name: "2 Corinthians", chapters: 13 },
  { id: "gal", name: "Galatians", chapters: 6 },
  { id: "eph", name: "Ephesians", chapters: 6 },
  { id: "php", name: "Philippians", chapters: 4 },
  { id: "col", name: "Colossians", chapters: 4 },
  { id: "1th", name: "1 Thessalonians", chapters: 5 },
  { id: "2th", name: "2 Thessalonians", chapters: 3 },
  { id: "1ti", name: "1 Timothy", chapters: 6 },
  { id: "2ti", name: "2 Timothy", chapters: 4 },
  { id: "tit", name: "Titus", chapters: 3 },
  { id: "phm", name: "Philemon", chapters: 1 },
  { id: "heb", name: "Hebrews", chapters: 13 },
  { id: "jas", name: "James", chapters: 5 },
  { id: "1pe", name: "1 Peter", chapters: 5 },
  { id: "2pe", name: "2 Peter", chapters: 3 },
  { id: "1jn", name: "1 John", chapters: 5 },
  { id: "2jn", name: "2 John", chapters: 1 },
  { id: "3jn", name: "3 John", chapters: 1 },
  { id: "jud", name: "Jude", chapters: 1 },
  { id: "rev", name: "Revelation", chapters: 22 },
];

const ALL_BOOKS = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS];

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
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function BibleLandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ot" | "nt" | "search">("ot");
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [selectedVersion] = useState(() => detectDefaultVersion({}));

  // Initialize lastRead from localStorage on mount
  useEffect(() => {
    const lr = getLastRead();
    if (lr) {
      // Use a callback to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setLastRead(lr);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_BOOKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const booksForTab = activeTab === "ot" ? OLD_TESTAMENT_BOOKS : NEW_TESTAMENT_BOOKS;

  const lastReadBookName =
    ALL_BOOKS.find((b) => b.id === lastRead?.bookId)?.name || lastRead?.bookId;

  return (
    <div className="space-y-6">
      {/* ── Unboxed Editorial Masthead ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Scripture Reader & Living Text</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            The Holy Scriptures, chapter by chapter.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Read, study, and meditate on God&apos;s Word across canonical testaments, parallel translations, and original verses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link href="/books">
            <Button
              type="button"
              variant="outline"
              size="default"
              leftIcon={<Compass className="size-4" />}
              className="rounded-xl font-medium"
            >
              Canon Books
            </Button>
          </Link>
          <Link href="/bible/GEN/1">
            <Button
              type="button"
              variant="default"
              size="default"
              leftIcon={<BookOpen className="size-4" />}
              className="rounded-xl font-semibold shadow-xs"
            >
              Genesis 1
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Signature Horizon Ribbon ── */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
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
                  {lastRead ? "Recent Reading Session" : "Scripture Reader"}
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {selectedVersion.abbreviation}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {lastRead ? `${lastReadBookName} ${lastRead.chapter}` : "Genesis 1"}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {lastRead ? "Resume Chapter" : "Creation"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lastRead
                  ? `Pick up where you left off in ${selectedVersion.name}.`
                  : "In the beginning, God created the heavens and the earth."}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>{lastRead ? `Version: ${selectedVersion.abbreviation}` : "66 books ready to explore"}</span>
              <Link
                href={
                  lastRead
                    ? `/bible/${lastRead.bookId}/${lastRead.chapter}?v=${lastRead.versionId}`
                    : "/bible/GEN/1"
                }
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <Play className="size-3 fill-current" />
                <span>{lastRead ? "Resume Reading" : "Start Genesis 1"} →</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Scripture Library Architecture */}
          <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Scripture Library Structure
                </span>
              </div>
              <span className="text-[11px] font-medium text-primary">
                {selectedVersion.abbreviation} Active
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  66
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Canonical Books • 1,189 Chapters
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                39 Old Testament books and 27 New Testament books with full verse coverage.
              </p>
            </div>

            {/* Canon Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                39 Old Testament
              </span>
              <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                27 New Testament
              </span>
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {selectedVersion.abbreviation}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Version Selector */}
      <div className="ui-card p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-foreground-dim">Translation</p>
              <p className="text-[14px] font-semibold text-foreground">
                {selectedVersion.abbreviation} — {selectedVersion.name}
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
          >
            <Settings className="size-3.5" />
            <span>Change</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href={`/bible/psa/23?v=${selectedVersion.id}`}
          className="ui-card flex flex-col items-center gap-3 p-5 text-center shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-green-500/10 text-green-600 dark:text-green-400">
            <Zap className="size-5" />
          </div>
          <span className="text-[13px] font-medium text-foreground">Psalm 23</span>
          <span className="text-[11px] text-foreground-dim">The Lord is my Shepherd</span>
        </Link>
        <Link
          href={`/bible/jhn/3?v=${selectedVersion.id}`}
          className="ui-card flex flex-col items-center gap-3 p-5 text-center shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BookOpen className="size-5" />
          </div>
          <span className="text-[13px] font-medium text-foreground">John 3:16</span>
          <span className="text-[11px] text-foreground-dim">For God so loved the world</span>
        </Link>
        <Link
          href={`/bible/rom/8?v=${selectedVersion.id}`}
          className="ui-card flex flex-col items-center gap-3 p-5 text-center shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock className="size-5" />
          </div>
          <span className="text-[13px] font-medium text-foreground">Romans 8</span>
          <span className="text-[11px] text-foreground-dim">No condemnation</span>
        </Link>
        <Link
          href={`/bible/phil/4?v=${selectedVersion.id}`}
          className="ui-card flex flex-col items-center gap-3 p-5 text-center shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Search className="size-5" />
          </div>
          <span className="text-[13px] font-medium text-foreground">Philippians 4</span>
          <span className="text-[11px] text-foreground-dim">Rejoice always</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4.5 text-foreground-dim" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a book..."
          className="w-full pl-10 pr-4 py-3 rounded-[14px] border border-border bg-surface text-foreground placeholder:text-foreground-dim text-[14px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {searchQuery && (
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-foreground-dim">
            {filteredBooks.length} result{filteredBooks.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredBooks.map((book: typeof ALL_BOOKS[0]) => (
              <Link
                key={book.id}
                href={`/bible/${book.id}/1?v=${selectedVersion.id}`}
                className="ui-card flex items-center justify-between px-3 py-2.5 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
              >
                <span className="text-[13px] font-medium text-foreground truncate">
                  {book.name}
                </span>
                <span className="text-[11px] text-foreground-dim shrink-0 ml-2">
                  {book.chapters} ch
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Book Grid Tabs */}
      {!searchQuery && (
        <>
          <div className="flex gap-1 rounded-[12px] border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setActiveTab("ot")}
              className={`flex-1 rounded-[10px] px-4 py-2 text-[12.5px] font-medium transition-all cursor-pointer ${
                activeTab === "ot"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              Old Testament
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nt")}
              className={`flex-1 rounded-[10px] px-4 py-2 text-[12.5px] font-medium transition-all cursor-pointer ${
                activeTab === "nt"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              New Testament
            </button>
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {booksForTab.map((book) => (
              <Link
                key={book.id}
                href={`/bible/${book.id}/1?v=${selectedVersion.id}`}
                className="ui-card flex items-center justify-between px-3 py-2.5 shadow-xs hover:shadow-sm transition-shadow cursor-pointer"
              >
                <span className="text-[13px] font-medium text-foreground truncate">
                  {book.name}
                </span>
                <span className="text-[11px] text-foreground-dim shrink-0 ml-2">
                  {book.chapters} ch
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}