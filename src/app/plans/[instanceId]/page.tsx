import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
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
    <AppShell
      userName={displayName}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full max-w-[1440px] mx-auto pb-16">
        <PlanDetailView key={plan.id} plan={plan} />
      </div>
    </AppShell>
  );
}

export default async function PlanInstancePage(props: PlanInstancePageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      }
    >
      <PlanInstanceContent {...props} />
    </Suspense>
  );
}
