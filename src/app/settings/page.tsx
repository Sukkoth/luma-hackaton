import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trackerChapterProgress } from "@/db/schema";
import {
  SettingsView,
  type SettingsTab,
} from "@/components/settings/settings-view";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getCachedUserSettings } from "@/lib/request-cache";
import { getCanonTestamentChapters, type BibleCanon } from "@/data/bibleData";

export const instant = false;

type SettingsPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [session, resolvedParams] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    searchParams,
  ]);

  if (!session) {
    redirect("/login?redirect=/settings");
  }

  const initialTab: SettingsTab =
    resolvedParams.tab === "profile" || resolvedParams.tab === "export"
      ? resolvedParams.tab
      : "settings";

  const { user } = session;

  const [trackersData, streak, settingsRecord] = await Promise.all([
    getUserTrackersData({ userId: user.id }),
    syncUserStreak({ userId: user.id }),
    getCachedUserSettings({ userId: user.id }),
  ]);

  // Compute real read chapters for each tracker using SQL GROUP BY COUNT
  const trackerIds = trackersData.trackers.map((t) => t.id);
  const chapterProgressCounts =
    trackerIds.length > 0
      ? await db
          .select({
            trackerId: trackerChapterProgress.trackerId,
            count: sql<number>`count(*)::int`,
          })
          .from(trackerChapterProgress)
          .where(inArray(trackerChapterProgress.trackerId, trackerIds))
          .groupBy(trackerChapterProgress.trackerId)
      : [];

  const progressCountByTrackerId: Record<string, number> = {};
  for (const row of chapterProgressCounts) {
    progressCountByTrackerId[row.trackerId] = Number(row.count);
  }

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
      initialTab={initialTab}
    />
  );
}
