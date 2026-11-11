import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { trackerChapterProgress } from "@/db/schema";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getUserAchievementsData } from "@/actions/achievements";
import {
  InsightsContainer,
  type InsightsTab,
} from "@/components/insights/insights-container";
import type { DivisionProgress } from "@/components/insights/canon-coverage-section";
import {
  type BibleCanon,
  getBibleBooks,
  getCanonTestamentChapters,
  getScriptureDivisionForBook,
} from "@/data/bibleData";

export const instant = false;

const DIVISION_CONFIG: ReadonlyArray<{
  key: string;
  label: string;
  booksLabel: string;
}> = [
  {
    key: "law",
    label: "Law & Pentateuch",
    booksLabel: "Genesis to Deuteronomy",
  },
  {
    key: "history",
    label: "Historical Books",
    booksLabel: "Joshua to Esther / Maccabees",
  },
  {
    key: "wisdom",
    label: "Poetry & Wisdom",
    booksLabel: "Job to Song of Solomon / Sirach",
  },
  {
    key: "prophets",
    label: "Prophets & Apocalypse",
    booksLabel: "Major/Minor Prophets & Revelation",
  },
  {
    key: "gospels",
    label: "The Gospels & Acts",
    booksLabel: "Matthew to Acts",
  },
  {
    key: "epistles",
    label: "Epistles & Letters",
    booksLabel: "Romans to Jude",
  },
];

function formatCanonTitle({ canon }: { canon: string }): string {
  switch (canon) {
    case "catholic":
      return "Catholic Canon (73 Books)";
    case "eastern_orthodox":
      return "Eastern Orthodox (78 Books)";
    case "ethiopian_orthodox":
      return "Ethiopian Orthodox (81 Books)";
    case "protestant":
    default:
      return "Protestant Standard (66 Books)";
  }
}

type InsightsPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function InsightsPage({
  searchParams,
}: InsightsPageProps) {
  await connection();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTab: InsightsTab =
    resolvedSearchParams?.tab === "achievements" ? "achievements" : "coverage";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/insights");
  }

  const [trackersData, streak, achievementsData] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
    getUserAchievementsData({ userId: session.user.id }),
  ]);

  const activeTracker = trackersData.activeTracker;
  const canon = (activeTracker?.canon as BibleCanon) || "protestant";

  const progress = activeTracker
    ? await db.query.trackerChapterProgress.findMany({
        where: eq(trackerChapterProgress.trackerId, activeTracker.id),
      })
    : [];

  const canonBooks = getBibleBooks(canon);
  const canonTotals = getCanonTestamentChapters(canon);
  const totalReadChapters = progress.length;
  const totalChaptersAcrossCanon = canonTotals.total;
  const canonPercentage =
    totalChaptersAcrossCanon > 0
      ? Math.round((totalReadChapters / totalChaptersAcrossCanon) * 100)
      : 0;

  // Calculate read counts and total chapters per scripture division
  const readByDivision: Record<string, number> = {
    law: 0,
    history: 0,
    wisdom: 0,
    prophets: 0,
    gospels: 0,
    epistles: 0,
  };

  for (const p of progress) {
    const div = getScriptureDivisionForBook(p.bookId);
    readByDivision[div] = (readByDivision[div] || 0) + 1;
  }

  const totalByDivision: Record<string, number> = {
    law: 0,
    history: 0,
    wisdom: 0,
    prophets: 0,
    gospels: 0,
    epistles: 0,
  };

  for (const b of canonBooks) {
    const div = getScriptureDivisionForBook(b.id);
    totalByDivision[div] = (totalByDivision[div] || 0) + b.chapters;
  }

  const divisions: ReadonlyArray<DivisionProgress> = DIVISION_CONFIG.map(
    (cfg) => {
      const read = readByDivision[cfg.key] || 0;
      const total = totalByDivision[cfg.key] || 0;
      const pct = total > 0 ? Math.round((read / total) * 100) : 0;
      return {
        key: cfg.key,
        label: cfg.label,
        booksLabel: cfg.booksLabel,
        readChapters: read,
        totalChapters: total,
        percentage: pct,
      };
    }
  );

  const userFirstName = session.user.name?.split(" ")[0] || "Reader";
  const activeTrackerName = activeTracker?.name ?? "Personal Reading";
  const canonName = formatCanonTitle({ canon });

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={activeTracker?.id}
    >
      <div className="w-full px-6 sm:px-8 py-4 sm:py-6">
        {/* Main Insights Content Layout */}
        <main className="mt-1 w-full space-y-6">
          {/* Header Greeting & Tracker Status */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[26px] font-normal tracking-tight text-foreground sm:text-[30px]">
                Spiritual Metrics & Insights
              </h1>
              <p className="text-[13px] text-foreground-secondary">
                Welcome back, {userFirstName}. Here is your reading trajectory
                and scriptural milestones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="ui-pill text-[12px] font-normal">
                Active: {activeTrackerName}
              </span>
            </div>
          </div>

          {/* Tabbed Insights & Achievements Container */}
          <InsightsContainer
            initialTab={initialTab}
            canonName={canonName}
            divisions={divisions}
            streak={streak}
            totalReadChapters={totalReadChapters}
            totalChaptersAcrossCanon={totalChaptersAcrossCanon}
            canonPercentage={canonPercentage}
            activeTrackerName={activeTrackerName}
            achievementsData={achievementsData}
          />
        </main>
      </div>
    </AppShell>
  );
}
