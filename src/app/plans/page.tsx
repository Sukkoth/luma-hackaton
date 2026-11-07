import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
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
      statusColor: "bg-[#82ADD4]/15 text-[#507ea6] dark:text-[#82ADD4]",
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
        "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
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
      statusColor:
        "bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]",
      completedAt: p.completedAt ? p.completedAt.toISOString() : null,
    }));

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
  );
}
