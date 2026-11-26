"use client";

import dynamic from "next/dynamic";
import type { OverviewDataResult } from "@/actions/overview";
import { ActivityRingsCard } from "@/components/overview/activity-rings-card";
import { StreakHeatmapCard } from "@/components/overview/streak-heatmap-card";
import { OverviewChartSkeleton } from "@/components/overview/overview-skeletons";

const ProgressOverTimeCard = dynamic(
  () =>
    import("@/components/overview/progress-over-time-card").then(
      (mod) => mod.ProgressOverTimeCard
    ),
  { loading: () => <OverviewChartSkeleton /> }
);

const SunburstCard = dynamic(
  () =>
    import("@/components/overview/sunburst-card").then(
      (mod) => mod.SunburstCard
    ),
  { loading: () => <OverviewChartSkeleton /> }
);

const RadialClockCard = dynamic(
  () =>
    import("@/components/overview/radial-clock-card").then(
      (mod) => mod.RadialClockCard
    ),
  { loading: () => <OverviewChartSkeleton /> }
);

type Props = {
  overviewData: OverviewDataResult;
};

export function HomeChartsGrid({ overviewData }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 pb-8">
      {/* Card 1: Concentric Activity Rings (lg: col-span-4) */}
      <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[340px]">
        <ActivityRingsCard data={overviewData.activityRings} />
      </div>

      {/* Card 2: Stacked Progress Over Time Area (lg: col-span-8) */}
      <div className="col-span-1 md:col-span-1 lg:col-span-8 min-h-[340px]">
        <ProgressOverTimeCard data={overviewData.progressOverTime} />
      </div>

      {/* Card 3: Streak Heatmap & Activity Calendar (lg: col-span-4) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[260px]">
        <StreakHeatmapCard data={overviewData.streakHeatmap} />
      </div>

      {/* Card 4: Bible Sunburst Canon Depth (lg: col-span-4) */}
      <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[260px]">
        <SunburstCard data={overviewData.sunburst} />
      </div>

      {/* Card 5: 24-Hour Radial Clock Rhythm (lg: col-span-4) */}
      <div className="col-span-1 md:col-span-1 lg:col-span-4 min-h-[260px]">
        <RadialClockCard data={overviewData.radialClock} />
      </div>
    </div>
  );
}
