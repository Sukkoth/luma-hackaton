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

      {/* =========================================================================
          DESKTOP DASHBOARD (>= 1024px): Strictly 100dvh, zero page/card scroll
          ========================================================================= */}
      <main className="mt-2.5 hidden lg:flex flex-1 flex-col gap-3 min-h-0 overflow-hidden">
        {/* ROW 1: Activity Rings (3 col), Progress Over Time Stacked Area (6 col), Streak Heatmap (3 col) on >=1280px
            On lg (1024-1279px): Merged Rings+Streak (6 col) + Progress Over Time (6 col) */}
        <div className="grid grid-cols-12 gap-3 flex-[1.18] min-h-0">
          {/* Card 1: Activity Rings - xl only */}
          <div className="hidden xl:block xl:col-span-3 h-full min-h-0">
            <ActivityRingsCard data={overviewData.activityRings} />
          </div>

          {/* Cards 1+3 Merged: lg only (1024-1279px) */}
          <div className="hidden lg:block xl:hidden lg:col-span-6 h-full min-h-0">
            <ProgressStreakMergedCard
              ringsData={overviewData.activityRings}
              streakData={overviewData.streakHeatmap}
            />
          </div>

          {/* Card 2: Progress Over Time (Stacked Area Chart) */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6 h-full min-h-0">
            <ProgressOverTimeCard data={overviewData.progressOverTime} />
          </div>

          {/* Card 3: Streak + Calendar Heatmap - xl only */}
          <div className="hidden xl:block xl:col-span-3 h-full min-h-0">
            <StreakHeatmapCard data={overviewData.streakHeatmap} />
          </div>
        </div>

        {/* ROW 2: Sunburst (4 col), Radial Clock (4 col), Plan Gauge (4 col) */}
        <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Card 4: Bible Sunburst (with Radar / Treemap toggle) */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-4 h-full min-h-0">
            <SunburstCard data={overviewData.sunburst} />
          </div>

          {/* Card 5: 24-Hour Radial Clock (with Weekday radar toggle) */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-4 h-full min-h-0">
            <RadialClockCard data={overviewData.radialClock} />
          </div>

          {/* Card 6: Half-Circle Gauge + Burn-up Line */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-4 h-full min-h-0">
            <PlanGaugeCard data={overviewData.planGauge} />
          </div>
        </div>
      </main>

      {/* =========================================================================
          MOBILE / TABLET DASHBOARD (< 1024px): Single column, natural scroll
          Order: 1 Rings, 3 Streak, 2 Progress Over Time, 5 Radial Clock, 4 Sunburst, 6 Plan
          ========================================================================= */}
      <div className="mt-3 flex lg:hidden flex-1 flex-col gap-3.5 overflow-y-auto pb-8 pr-0.5">
        {/* 1. Activity Rings */}
        <div className="h-[360px] shrink-0">
          <ActivityRingsCard data={overviewData.activityRings} />
        </div>

        {/* 3. Streak + Heatmap */}
        <div className="h-[250px] shrink-0">
          <StreakHeatmapCard data={overviewData.streakHeatmap} />
        </div>

        {/* 2. Progress Over Time Stacked Area */}
        <div className="h-[250px] shrink-0">
          <ProgressOverTimeCard data={overviewData.progressOverTime} />
        </div>

        {/* 5. 24-Hour Radial Clock */}
        <div className="h-[260px] shrink-0">
          <RadialClockCard data={overviewData.radialClock} />
        </div>

        {/* 4. Bible Sunburst */}
        <div className="h-[260px] shrink-0">
          <SunburstCard data={overviewData.sunburst} />
        </div>

        {/* 6. Plan Gauge */}
        <div className="h-[260px] shrink-0">
          <PlanGaugeCard data={overviewData.planGauge} />
        </div>
      </div>
    </div>
  );
}
