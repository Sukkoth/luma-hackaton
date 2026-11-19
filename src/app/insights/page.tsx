import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Flame, Layers, Globe } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { trackerChapterProgress } from "@/db/schema";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getUserAchievementsData } from "@/actions/achievements";
import { HeaderActions, HeaderActionButton } from "@/components/ui/header-action-button";
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
      <div className="w-full max-w-[1440px] mx-auto space-y-6">
        {/* ── Unboxed Editorial Masthead ── */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>Scriptural Analytics & Spiritual Metrics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Your Scripture journey, in numbers & rhythm.
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Welcome back, {userFirstName}. Analyze reading velocity, canon depth distribution, diurnal habits, and unlocked milestones.
            </p>
          </div>

          <HeaderActions>
            <HeaderActionButton
              type="primary"
              icon={<Layers className="size-4" />}
              label="Current Tracker"
            />
            <HeaderActionButton
              type="secondary"
              icon={<Globe className="size-4" />}
              label="All Canons"
            />
          </HeaderActions>
        </section>

        {/* ── Signature Horizon Ribbon ── */}
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {/* Column 1: Canon Trajectory */}
            <div className="pr-0 md:pr-8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Canon Trajectory
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {canonName}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {canonPercentage}%
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    Canon Completed
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {totalReadChapters} of {totalChaptersAcrossCanon} chapters read in {activeTrackerName}.
                </p>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Progress to Full Canon</span>
                  <span className="text-primary font-medium">{canonPercentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, canonPercentage))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Reading Momentum & Streak */}
            <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Reading Momentum
                  </span>
                </div>
                <span className="text-[11px] font-medium text-primary">
                  Best: {streak?.longestStreak ?? 0} days
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {streak?.currentStreak ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {streak?.currentStreak === 1 ? "Day Streak" : "Days Active Streak"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {streak?.availableFreezes ?? 0} streak freezes available • {achievementsData.stats.unlocked} milestones unlocked.
                </p>
              </div>

              {/* Progress Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Active Tracker: {activeTrackerName}
                </span>
                <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {totalReadChapters} Chapters Read
                </span>
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {achievementsData.stats.unlocked} Milestones
                </span>
              </div>
            </div>
          </div>
        </section>

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
      </div>
    </AppShell>
  );
}
