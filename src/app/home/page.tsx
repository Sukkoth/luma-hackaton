import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  userSettings,
  trackerChapterProgress,
  readingLogs,
  planInstances,
} from "@/db/schema";
import {
  type BibleCanon,
  getBibleBookById,
  getCanonTestamentChapters,
} from "@/data/bibleData";
import { TopNavbar } from "@/components/luma/top-navbar";
import { HeroProgressCard } from "@/components/luma/hero-progress-card";
import { StatMetricCards } from "@/components/luma/stat-metric-cards";
import {
  ActivityBarChart,
  type DailyActivity,
} from "@/components/luma/activity-bar-chart";
import {
  DistributionCards,
  type DistributionBreakdown,
  type ActivePlanSummary,
} from "@/components/luma/distribution-cards";
import { syncUserStreak } from "@/lib/streak-service";
import {
  getUserTrackersData,
  type UserTrackerSummary,
} from "@/actions/trackers";

export const instant = false;

type FormatCanonParams = {
  canon: string;
};

function formatCanonName({ canon }: FormatCanonParams): string {
  switch (canon) {
    case "catholic":
      return "Catholic Canon (73 Books)";
    case "eastern_orthodox":
      return "Eastern Orthodox (78 Books)";
    case "ethiopian_orthodox":
      return "Ethiopian Orthodox (81 Books)";
    case "protestant":
    default:
      return "Standard 66 Books";
  }
}

type GetHomeMetricsParams = {
  userId: string;
  tracker: UserTrackerSummary | null;
};

async function getHomeMetrics({ userId, tracker }: GetHomeMetricsParams) {
  const canon = (tracker?.canon || "protestant") as BibleCanon;
  const canonStats = getCanonTestamentChapters(canon);

  // Parallelize independent queries: tracker progress, recent reading logs, and active plans
  const [progress, recentLogs, activeEnrolledPlans] = await Promise.all([
    tracker
      ? db.query.trackerChapterProgress.findMany({
          where: eq(trackerChapterProgress.trackerId, tracker.id),
        })
      : Promise.resolve([]),
    db.query.readingLogs.findMany({
      where: eq(readingLogs.userId, userId),
      orderBy: (readingLogs, { desc }) => [desc(readingLogs.loggedAt)],
      limit: 100,
    }),
    db.query.planInstances.findMany({
      where: and(
        eq(planInstances.userId, userId),
        eq(planInstances.status, "active")
      ),
    }),
  ]);

  let readOt = 0;
  let readNt = 0;
  const distribution: DistributionBreakdown = {
    law: 0,
    history: 0,
    poetry: 0,
    gospelsEpistles: 0,
  };

  for (const item of progress) {
    const book = getBibleBookById(item.bookId, canon);
    if (book) {
      if (book.testament === "OT") readOt++;
      else if (book.testament === "NT") readNt++;

      if (book.category === "Law") {
        distribution.law++;
      } else if (
        book.category === "History" ||
        book.category === "Church History"
      ) {
        distribution.history++;
      } else if (book.category === "Poetry & Wisdom") {
        distribution.poetry++;
      } else {
        distribution.gospelsEpistles++;
      }
    }
  }

  const now = new Date();
  const past7Days: DailyActivity[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = recentLogs.filter((l) => {
      const logDate = new Date(l.loggedAt).toISOString().split("T")[0];
      return logDate === dateStr;
    }).length;
    past7Days.push({ dayLabel, dateLabel: dateStr, count });
  }

  const activePlans: ActivePlanSummary[] = activeEnrolledPlans.map((p) => {
    return {
      id: p.id,
      title: p.title,
      progressPercent: 0,
      completedChapters: 0,
      totalChapters: p.totalChapters,
    };
  });

  return {
    tracker,
    canon,
    canonName: formatCanonName({ canon }),
    totalChapters: canonStats.total,
    readChapters: progress.length,
    remainingChapters: Math.max(0, canonStats.total - progress.length),
    readOt,
    readNt,
    distribution,
    past7Days,
    activePlans,
  };
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/home");
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (!settings?.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  const displayName =
    session.user.name.split(" ")[0] || session.user.name || "Reader";

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({
      userId: session.user.id,
    }),
    syncUserStreak({
      userId: session.user.id,
    }),
  ]);

  const metrics = await getHomeMetrics({
    userId: session.user.id,
    tracker: trackersData.activeTracker,
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-350 flex-col px-4 py-3 sm:px-6 md:px-8 md:py-4 lg:h-dvh">
      {/* Top Navbar */}
      <TopNavbar
        userName={displayName}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      />

      {/* Main Dashboard Layout */}
      <main className="mt-3 flex flex-1 flex-col gap-3.5 pb-1 lg:flex-row lg:items-stretch lg:overflow-hidden">
        {/* Left Column: Hero Progress Card */}
        <HeroProgressCard
          userName={displayName}
          trackerName={metrics.tracker?.name}
          readChapters={metrics.readChapters}
          totalChapters={metrics.totalChapters}
          otChapters={metrics.readOt}
          ntChapters={metrics.readNt}
          remainingChapters={metrics.remainingChapters}
          canonName={metrics.canonName}
        />

        {/* Right Column: Metrics, Chart, Distribution */}
        <div className="flex flex-1 flex-col justify-between gap-3.5 lg:overflow-hidden">
          <StatMetricCards
            chaptersRead={metrics.readChapters}
            currentStreak={streak.currentStreak}
            streakFreezesAvailable={streak.availableFreezes}
            longestStreak={streak.longestStreak}
            isFreezeUnlocked={streak.isFreezeUnlocked}
          />
          <ActivityBarChart
            totalChapters={metrics.readChapters}
            activity={metrics.past7Days}
          />
          <DistributionCards
            distribution={metrics.distribution}
            activePlans={metrics.activePlans}
          />
        </div>
      </main>
    </div>
  );
}
