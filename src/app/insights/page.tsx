import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
import { InsightsKpiCards } from "@/components/insights/insights-kpi-cards";
import { CanonCoverageSection } from "@/components/insights/canon-coverage-section";
import { MilestonesSection } from "@/components/insights/milestones-section";

export const instant = false;

export default async function InsightsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/insights");
  }

  const userFirstName = session.user.name.split(" ")[0] || "Reader";

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navigation */}
      <TopNavbar userName={session.user.name} />

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
            <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-normal text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
              Active: Personal Reading Tracker
            </span>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <InsightsKpiCards />

        {/* Section 1: Canonical Distribution & Velocity */}
        <CanonCoverageSection />

        {/* Section 2: Milestones & Badges Grid */}
        <MilestonesSection />
      </main>
    </div>
  );
}
