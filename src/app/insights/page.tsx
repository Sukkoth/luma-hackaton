import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { trackerChapterProgress } from "@/db/schema";
import { TopNavbar } from "@/components/luma/top-navbar";
import { InsightsKpiCards } from "@/components/insights/insights-kpi-cards";
import {
  CanonCoverageSection,
  type DivisionProgress,
} from "@/components/insights/canon-coverage-section";
import { MilestonesSection } from "@/components/insights/milestones-section";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
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

export default async function InsightsPage() {
  await connection();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/insights");
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
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navigation */}
      <TopNavbar
        userName={session.user.name}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={activeTracker?.id}
      />

      {/* Main Insights Content Layout */}
      <main className="mt-4 space-y-6">
        {/* Header Greeting & Tracker Status */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
              Spiritual Metrics & Insights
            </h1>
            <p className="text-[13px] text-[#777777] dark:text-[#9CA3AF]">
              Welcome back, {userFirstName}. Here is your reading trajectory and
              scriptural milestones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/4 px-3 py-1 text-[12px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
              Active: {activeTrackerName}
            </span>
          </div>
        </div>

        {/* Highlight Stats Row (Real Metrics) */}
        <InsightsKpiCards
          streak={streak}
          totalReadChapters={totalReadChapters}
          totalChaptersAcrossCanon={totalChaptersAcrossCanon}
          canonPercentage={canonPercentage}
          activeTrackerName={activeTrackerName}
        />

        {/* Section 1: Canonical Distribution & Velocity (Real Progress) */}
        <CanonCoverageSection canonName={canonName} divisions={divisions} />

        {/* Section 2: Milestones & Badges Grid (Coming Soon) */}
        <MilestonesSection />
      </main>
    </div>
  );
}
