import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { userSettings } from "@/db/schema";
import { TopNavbar } from "@/components/luma/top-navbar";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getOverviewData } from "@/actions/overview";
import { ChartDefs } from "@/components/overview/chart-tokens";
import { ActivityRingsCard } from "@/components/overview/activity-rings-card";
import { ProgressStreakMergedCard } from "@/components/overview/progress-streak-merged-card";
import { ProgressOverTimeCard } from "@/components/overview/progress-over-time-card";
import { StreakHeatmapCard } from "@/components/overview/streak-heatmap-card";
import { SunburstCard } from "@/components/overview/sunburst-card";
import { RadialClockCard } from "@/components/overview/radial-clock-card";
import { PlanGaugeCard } from "@/components/overview/plan-gauge-card";

export const instant = false;

type FormatCanonNameParams = {
  canon: string;
};

function formatCanonName({ canon }: FormatCanonNameParams): string {
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

  const activeTracker = trackersData.activeTracker;
  if (!activeTracker) {
    redirect("/onboarding");
  }

  const overviewData = await getOverviewData({
    userId: session.user.id,
    trackerId: activeTracker.id,
  });

  return (
    <div className="mx-auto flex h-dvh max-w-[1600px] flex-col px-3 py-2 sm:px-5 sm:py-3 md:px-7 md:py-3.5 overflow-hidden">
      {/* Global Chart SVG Patterns & Gradients */}
      <ChartDefs />

      {/* Top Navbar */}
      <TopNavbar
        userName={displayName}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={activeTracker.id}
      />

      {/* Subheader: User Greeting & Active Tracker Context */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-1 py-0.5 text-xs text-foreground-secondary shrink-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">Hello, {displayName}!</p>
          <span className="text-foreground-dim">·</span>
          <span className="font-medium text-foreground">Bible Progress</span>
          <span className="text-foreground-dim tabular-nums">
            {overviewData.activityRings.readChapters} of{" "}
            {overviewData.activityRings.totalChapters}
          </span>
        </div>
        <p className="text-foreground-dim truncate">
          {`Tracking "${activeTracker.name}" with active ${formatCanonName({ canon: activeTracker.canon })}`}
        </p>
      </div>

      {/* =========================================================================
          DASHBOARD: Single Responsive Layout
          Desktop (>= 1024px): Strictly 100dvh, 12-column grid with 2 rows, zero page scroll
          Mobile (< 1024px): Single column, natural vertical scroll
          ========================================================================= */}
      <main className="mt-2.5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[1.18fr_1fr] gap-3.5 lg:gap-3 pb-8 lg:pb-0 pr-0.5 lg:pr-0">
        {/* Card 1: Activity Rings (Mobile: order-1, xl: col-span-3 row-1) */}
        <div className="block lg:hidden xl:block xl:col-span-3 xl:row-start-1 h-[360px] lg:h-full min-h-0 order-1 xl:order-none">
          <ActivityRingsCard data={overviewData.activityRings} />
        </div>

        {/* Cards 1+3 Merged: lg only (1024-1279px: col-span-6 row-1) */}
        <div className="hidden lg:block xl:hidden lg:col-span-6 lg:row-start-1 h-full min-h-0">
          <ProgressStreakMergedCard
            ringsData={overviewData.activityRings}
            streakData={overviewData.streakHeatmap}
          />
        </div>

        {/* Card 2: Progress Over Time Stacked Area (Mobile: order-3, lg+: col-span-6 row-1) */}
        <div className="col-span-1 lg:col-span-6 xl:col-span-6 lg:row-start-1 h-[250px] lg:h-full min-h-0 order-3 xl:order-none">
          <ProgressOverTimeCard data={overviewData.progressOverTime} />
        </div>

        {/* Card 3: Streak + Calendar Heatmap (Mobile: order-2, xl: col-span-3 row-1) */}
        <div className="block lg:hidden xl:block xl:col-span-3 xl:row-start-1 h-[250px] lg:h-full min-h-0 order-2 xl:order-none">
          <StreakHeatmapCard data={overviewData.streakHeatmap} />
        </div>

        {/* Card 4: Bible Sunburst (Mobile: order-5, lg+: col-span-4 row-2) */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-4 lg:row-start-2 h-[260px] lg:h-full min-h-0 order-5 xl:order-none">
          <SunburstCard data={overviewData.sunburst} />
        </div>

        {/* Card 5: 24-Hour Radial Clock (Mobile: order-4, lg+: col-span-4 row-2) */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-4 lg:row-start-2 h-[260px] lg:h-full min-h-0 order-4 xl:order-none">
          <RadialClockCard data={overviewData.radialClock} />
        </div>

        {/* Card 6: Plan Gauge (Mobile: order-6, lg+: col-span-4 row-2) */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-4 lg:row-start-2 h-[260px] lg:h-full min-h-0 order-6 xl:order-none">
          <PlanGaugeCard data={overviewData.planGauge} />
        </div>
      </main>
    </div>
  );
}
