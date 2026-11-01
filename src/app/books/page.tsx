import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  userSettings,
  readingTrackers,
  trackerChapterProgress,
} from "@/db/schema";
import { BooksView } from "@/components/books/books-view";
import { syncUserStreak } from "@/lib/streak-service";

export const instant = false;

export default async function BooksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <BooksView initialReadData={{}} activeTrackerId={null} userName={null} />
    );
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  const tracker = settings?.activeTrackerId
    ? await db.query.readingTrackers.findFirst({
        where: and(
          eq(readingTrackers.id, settings.activeTrackerId),
          eq(readingTrackers.userId, session.user.id)
        ),
      })
    : await db.query.readingTrackers.findFirst({
        where: eq(readingTrackers.userId, session.user.id),
      });

  const initialReadData: Record<string, number[]> = {};

  const [progress, streak] = await Promise.all([
    tracker
      ? db.query.trackerChapterProgress.findMany({
          where: eq(trackerChapterProgress.trackerId, tracker.id),
        })
      : Promise.resolve([]),
    syncUserStreak({ userId: session.user.id }),
  ]);

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
      initialReadData={initialReadData}
      activeTrackerId={tracker?.id ?? null}
      userName={displayName}
      streak={streak}
    />
  );
}
