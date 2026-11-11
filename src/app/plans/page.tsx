import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { PlanCatalog } from "@/components/plans/PlanCatalog";
import { getUserTrackersData } from "@/actions/trackers";
import {
  getUserPlansAction,
  getUserCustomPlanTemplatesAction,
} from "@/actions/plans";
import { syncUserStreak } from "@/lib/streak-service";
import type { ActivePlanInstance } from "@/components/plans/plan-active-banner";
import type { BibleCanon } from "@/data/bibleData";

export const instant = false;

export default async function PlansPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const [trackersData, streak, customPlans] = session
    ? await Promise.all([
        getUserTrackersData({ userId: session.user.id }),
        syncUserStreak({ userId: session.user.id }),
        getUserCustomPlanTemplatesAction({ userId: session.user.id }),
      ])
    : [{ trackers: [], activeTracker: null }, undefined, []];

  const rawPlans =
    session && trackersData.activeTracker?.id
      ? await getUserPlansAction({
          trackerId: trackersData.activeTracker.id,
        })
      : [];

  const activePlanInstances: ReadonlyArray<ActivePlanInstance> = rawPlans
    .filter((p) => p.status === "active")
    .map((p) => ({
      id: p.id,
      templateId: p.templateId,
      title: p.title,
      currentPassage: `${p.completedChapters} / ${p.totalChapters} Ch`,
      dayText: p.mode === "flexible" ? "Self-Paced" : "Active Schedule",
      progressPercent: p.progressPercent,
      readChapters: p.completedChapters,
      totalChapters: p.totalChapters,
      status: p.mode === "flexible" ? "Flexible" : "On Track",
      statusColor: "border border-border bg-surface-elevated text-foreground",
      completedAt: null,
    }));

  const pausedPlanInstances: ReadonlyArray<ActivePlanInstance> = rawPlans
    .filter((p) => p.status === "paused")
    .map((p) => ({
      id: p.id,
      templateId: p.templateId,
      title: p.title,
      currentPassage: `${p.completedChapters} / ${p.totalChapters} Ch`,
      dayText: "Paused • Pacing on hold",
      progressPercent: p.progressPercent,
      readChapters: p.completedChapters,
      totalChapters: p.totalChapters,
      status: "Paused",
      statusColor:
        "border border-border bg-surface-elevated text-foreground-dim",
      completedAt: null,
    }));

  const finishedPlanInstances: ReadonlyArray<ActivePlanInstance> = rawPlans
    .filter((p) => p.status === "completed")
    .map((p) => ({
      id: p.id,
      templateId: p.templateId,
      title: p.title,
      currentPassage: `${p.completedChapters} / ${p.totalChapters} Ch`,
      dayText: p.completedAt
        ? `Finished ${new Date(p.completedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : "Finished Journey",
      progressPercent: 100,
      readChapters: p.completedChapters,
      totalChapters: p.totalChapters,
      status: "Finished",
      statusColor: "border border-primary bg-primary text-primary-foreground",
      completedAt: p.completedAt ? p.completedAt.toISOString() : null,
    }));

  const displayName = session?.user?.name || "Reader";

  return (
    <AppShell
      userName={displayName}
      userEmail={session?.user?.email}
      userImage={session?.user?.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full px-6 sm:px-8 py-4 sm:py-6">
        {/* Main Content Area */}
        <main className="mt-1 w-full">
          <PlanCatalog
            activePlanInstances={activePlanInstances}
            pausedPlanInstances={pausedPlanInstances}
            finishedPlanInstances={finishedPlanInstances}
            customPlans={customPlans}
            activeTrackerId={trackersData.activeTracker?.id}
            trackerName={trackersData.activeTracker?.name}
            trackerCanon={
              (trackersData.activeTracker?.canon as BibleCanon) || "protestant"
            }
          />
        </main>
      </div>
    </AppShell>
  );
}
