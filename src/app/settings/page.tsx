import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userSettings, trackerChapterProgress } from "@/db/schema";
import { SettingsView } from "@/components/settings/settings-view";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getCanonTestamentChapters, type BibleCanon } from "@/data/bibleData";

export const instant = false;

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/settings");
  }

  const { user } = session;

  const [trackersData, streak, settingsRecord] = await Promise.all([
    getUserTrackersData({ userId: user.id }),
    syncUserStreak({ userId: user.id }),
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    }),
  ]);

  // Compute real read chapters for each tracker
  const trackerIds = trackersData.trackers.map((t) => t.id);
  const chapterProgressRows =
    trackerIds.length > 0
      ? await db.query.trackerChapterProgress.findMany({
          where: inArray(trackerChapterProgress.trackerId, trackerIds),
        })
      : [];

  const progressCountByTrackerId = chapterProgressRows.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.trackerId] = (acc[row.trackerId] || 0) + 1;
      return acc;
    },
    {}
  );

  const enrichedTrackers = trackersData.trackers.map((t) => {
    const canon = (t.canon as BibleCanon) || "protestant";
    const totals = getCanonTestamentChapters(canon);
    const readCount = progressCountByTrackerId[t.id] || 0;
    return {
      ...t,
      readChaptersCount: readCount,
      totalChaptersCount: totals.total,
    };
  });

  return (
    <SettingsView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerifiedAt: (user as { emailVerifiedAt?: Date | string | null })
          .emailVerifiedAt,
      }}
      trackers={enrichedTrackers}
      activeTrackerId={trackersData.activeTracker?.id}
      streak={streak}
      settings={{
        dailyReminderEnabled: settingsRecord?.dailyReminderEnabled ?? false,
        dailyReminderTime: settingsRecord?.dailyReminderTime ?? "20:00",
      }}
    />
  );
}
