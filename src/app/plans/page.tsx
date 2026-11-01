import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
import { PlanCatalog } from "@/components/plans/PlanCatalog";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";

export const instant = false;

export default async function PlansPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [trackersData, streak] = session
    ? await Promise.all([
        getUserTrackersData({ userId: session.user.id }),
        syncUserStreak({ userId: session.user.id }),
      ])
    : [{ trackers: [], activeTracker: null }, undefined];

  const displayName = session?.user?.name || "Reader";

  return (
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar
        userName={displayName}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      />

      {/* Main Content Area */}
      <main className="mt-3">
        <PlanCatalog />
      </main>
    </div>
  );
}
