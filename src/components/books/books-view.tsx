"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import {
  type BibleCanon,
  getCanonTestamentChapters,
  type BibleBook,
} from "@/data/bibleData";
import { useSession } from "@/lib/auth-client";
import {
  toggleChapterAction,
  markAllChaptersAction,
  clearAllChaptersAction,
} from "@/actions/chapters";
import { BooksAuthModal } from "./books-auth-modal";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { UserTrackerSummary } from "@/actions/trackers";
import type { VerseOfTheDayData } from "@/lib/youversion";
import { BibleWorkspace } from "@/components/bible/bible-workspace";

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
  canon = "protestant",
  trackers,
  userName = null,
  streak,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [, startTransition] = useTransition();
  const [readChapters, setReadChapters] =
    useState<Record<string, ReadonlyArray<number>>>(initialReadData);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const canonStats = getCanonTestamentChapters(canon);
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
      <div className="w-full max-w-[1440px] mx-auto">
        <BibleWorkspace
          canon={canon}
          readChapters={readChapters}
          totalReadChapters={totalReadChapters}
          totalChaptersAcrossCanon={totalChaptersAcrossCanon}
          canonPercentage={canonPercentage}
          onToggleTrackerChapter={handleToggleChapter}
          onMarkAllChapters={handleMarkAllChapters}
          onClearAllChapters={handleClearAllChapters}
        />

        <BooksAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignIn={() => router.push("/login?redirect=/books")}
        />
      </div>
    </AppShell>
  );
}
