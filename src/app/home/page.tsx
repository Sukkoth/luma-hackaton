import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { userSettings } from "@/db/schema";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { evaluateAndUnlockAchievementsAction } from "@/actions/achievements";
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

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({
      userId: session.user.id,
    }),
    syncUserStreak({
      userId: session.user.id,
    }),
    evaluateAndUnlockAchievementsAction({
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
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={activeTracker.id}
      className="h-full flex flex-col min-h-0"
    >
      <div className="flex h-full w-full flex-1 min-h-0 flex-col px-6 sm:px-8 py-3.5 sm:py-4">
        {/* Global Chart SVG Patterns & Gradients */}
        <ChartDefs />

        {/* =========================================================================
          DASHBOARD: Single Responsive Layout
          Desktop (>= 1024px): Strictly 100dvh, 12-column grid with 2 rows, zero page scroll
          Mobile (< 1024px): Single column, natural vertical scroll
          ========================================================================= */}
        <main className="mt-1 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[1.18fr_1fr] gap-3.5 lg:gap-3 pb-8 lg:pb-0 pr-0.5 lg:pr-0">
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
    </AppShell>
  );
}
