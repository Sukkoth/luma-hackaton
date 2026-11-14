import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getPlanInstanceDetailAction } from "@/actions/plans";
import { PlanDetailViewV2 } from "@/components/plans/v2/plan-detail-view-v2";

type PlanInstanceV2PageProps = {
  params: Promise<{ instanceId: string }>;
};

export const instant = false;

async function PlanInstanceV2Content({ params }: PlanInstanceV2PageProps) {
  const { instanceId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?redirect=/plans/${instanceId}/v2`);
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
    <AppShell
      userName={displayName}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full px-6 sm:px-8 py-4 sm:py-6 flex justify-center">
        <main className="w-full max-w-5xl pb-16">
          <PlanDetailViewV2 plan={plan} />
        </main>
      </div>
    </AppShell>
  );
}

export default async function PlanInstanceV2Page(
  props: PlanInstanceV2PageProps
) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
        </div>
      }
    >
      <PlanInstanceV2Content {...props} />
    </Suspense>
  );
}
