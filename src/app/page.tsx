import { TopNavbar } from "@/components/luma/top-navbar";
import { HeroProgressCard } from "@/components/luma/hero-progress-card";
import { StatMetricCards } from "@/components/luma/stat-metric-cards";
import { ActivityBarChart } from "@/components/luma/activity-bar-chart";
import { DistributionCards } from "@/components/luma/distribution-cards";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col px-4 py-3 sm:px-6 md:px-8 md:py-4 lg:h-dvh">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      {/* Main Dashboard Layout */}
      <main className="mt-3 flex flex-1 flex-col gap-3.5 pb-1 lg:flex-row lg:items-stretch lg:overflow-hidden">
        {/* Left Column: Hero Progress Card */}
        <HeroProgressCard
          userName="James"
          readChapters={443}
          totalChapters={1189}
          otChapters={498}
          ntChapters={443}
          remainingChapters={167}
        />

        {/* Right Column: Metrics, Chart, Distribution */}
        <div className="flex flex-1 flex-col justify-between gap-3.5 lg:overflow-hidden">
          <StatMetricCards />
          <ActivityBarChart />
          <DistributionCards />
        </div>
      </main>
    </div>
  );
}
