import { TopNavbar } from "@/components/callivio/top-navbar";
import { HeroProgressCard } from "@/components/callivio/hero-progress-card";
import { StatMetricCards } from "@/components/callivio/stat-metric-cards";
import { ActivityBarChart } from "@/components/callivio/activity-bar-chart";
import { DistributionCards } from "@/components/callivio/distribution-cards";

export default function DashboardPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      {/* Main Dashboard Layout */}
      <main className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-stretch">
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
        <div className="flex flex-1 flex-col gap-4">
          <StatMetricCards />
          <ActivityBarChart />
          <DistributionCards />
        </div>
      </main>
    </div>
  );
}
