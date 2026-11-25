import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { trackerChapterProgress } from "@/db/schema";
import { BooksView } from "@/components/books/books-view";
import { syncUserStreak } from "@/lib/streak-service";
import { getUserTrackersData } from "@/actions/trackers";
import { getVerseOfTheDay } from "@/lib/youversion";
import type { BibleCanon } from "@/data/bibleData";

export const instant = false;

export const metadata: Metadata = {
  title: "Bible Reader & Verse Study Notes",
  description:
    "Read Scripture in multiple translations, highlight key verses, save passage-anchored study notes, and track chapter progress across all 66 books.",
  alternates: {
    canonical: "/bible",
  },
};

export default async function BiblePage() {
  await connection();
  const sessionPromise = auth.api.getSession({
    headers: await headers(),
  });
  const versePromise = getVerseOfTheDay();

  const [session, verseOfTheDay] = await Promise.all([
    sessionPromise,
    versePromise,
  ]);

  if (!session) {
    return (
      <BooksView
        initialReadData={{}}
        activeTrackerId={null}
        canon="protestant"
        userName={null}
        verseOfTheDay={verseOfTheDay}
      />
    );
  }

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
  ]);

  const activeTracker = trackersData.activeTracker;
  const canon = (activeTracker?.canon as BibleCanon) || "protestant";

  const progress = activeTracker
    ? await db.query.trackerChapterProgress.findMany({
        where: eq(trackerChapterProgress.trackerId, activeTracker.id),
      })
    : [];

  const initialReadData: Record<string, number[]> = {};
  for (const item of progress) {
    if (!initialReadData[item.bookId]) {
      initialReadData[item.bookId] = [];
    }
    initialReadData[item.bookId].push(item.chapter);
  }

  const displayName =
    session.user.name.split(" ")[0] || session.user.name || "Reader";

  return (
    <BooksView
      key={activeTracker?.id ?? "guest"}
      initialReadData={initialReadData}
      activeTrackerId={activeTracker?.id ?? null}
      trackerName={activeTracker?.name ?? null}
      canon={canon}
      trackers={trackersData.trackers}
      userName={displayName}
      streak={streak}
      verseOfTheDay={verseOfTheDay}
    />
  );
}
