import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getPlanInstanceDetailAction } from "@/actions/plans";
import { PlanDetailView } from "@/components/plans/plan-detail-view";

type PlanInstancePageProps = {
  params: Promise<{ instanceId: string }>;
};

export const instant = false;

async function PlanInstanceContent({ params }: PlanInstancePageProps) {
  const { instanceId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?redirect=/plans/${instanceId}`);
  }

  const [trackersData, streak, plan] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
    getPlanInstanceDetailAction({ instanceId }),
  ]);

  if (!plan) {
    notFound();
  }

  const displayName = session.user.name || "Reader";

  return (
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar
        userName={displayName}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      />

      <main className="mx-auto mt-4 max-w-4xl pb-12">
        <PlanDetailView plan={plan} />
      </main>
    </div>
  );
}

export default async function PlanInstancePage(props: PlanInstancePageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-350 items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
        </div>
      }
    >
      <PlanInstanceContent {...props} />
    </Suspense>
  );
}
