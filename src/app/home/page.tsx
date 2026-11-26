import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Bookmark, BookMarked, Play } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCachedUserSettings } from "@/lib/request-cache";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { getOverviewData } from "@/actions/overview";
import {
  HeaderActions,
  HeaderActionButton,
} from "@/components/ui/header-action-button";
import { ChartDefs } from "@/components/overview/chart-tokens";
import { HomeChartsGrid } from "@/components/home/home-charts-grid";

export const instant = false;

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/home");
  }

  const settings = await getCachedUserSettings({
    userId: session.user.id,
  });

  if (!settings?.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  const prefetchedTrackerId = settings.activeTrackerId;

  const [trackersData, streak, prefetchedOverview] = await Promise.all([
    getUserTrackersData({
      userId: session.user.id,
    }),
    syncUserStreak({
      userId: session.user.id,
    }),
    prefetchedTrackerId
      ? getOverviewData({
          userId: session.user.id,
          trackerId: prefetchedTrackerId,
        })
      : Promise.resolve(null),
  ]);

  const activeTracker = trackersData.activeTracker;
  if (!activeTracker) {
    redirect("/onboarding");
  }

  const overviewData =
    prefetchedOverview && activeTracker.id === prefetchedTrackerId
      ? prefetchedOverview
      : await getOverviewData({
          userId: session.user.id,
          trackerId: activeTracker.id,
        });

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = session.user.name?.split(" ")[0] || "Reader";
  const nextReading = overviewData.activityRings.nextReading;
  const primaryPlan = overviewData.planGauge.plans[0] ?? null;
  const primaryPlanUrl = primaryPlan
    ? `/plans/${primaryPlan.instanceId}`
    : "/plans";
  const primaryPlanLabel = primaryPlan ? "Continue Reading" : "Explore Plans";
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={activeTracker.id}
    >
      <div className="w-full max-w-[1440px] mx-auto space-y-6">
        {/* Global Chart SVG Patterns & Gradients */}
        <ChartDefs />

        {/* ── Unboxed Editorial Masthead ── */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>{todayFormatted} • Daily Devotional Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Good {timeOfDay}, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {overviewData.activityRings.thisWeekChapters > 0
                ? `You've read ${overviewData.activityRings.thisWeekChapters} chapters this week with a steady ${overviewData.activityRings.avgDay30d} ch/day pace. Pick up right where you left off below.`
                : "Welcome to your personal scripture sanctuary. Dive into today's assigned chapters or track your ongoing canonical progress."}
            </p>
          </div>

          <HeaderActions>
            <HeaderActionButton
              type="secondary"
              href="/plans"
              icon={<Bookmark className="size-4" />}
              label="Explore Bible Plans"
            />
            <HeaderActionButton
              type="primary"
              href={primaryPlanUrl}
              icon={<Play className="size-4 fill-current" />}
              label={primaryPlanLabel}
            />
          </HeaderActions>
        </section>

        {/* ── Signature Horizon Ribbon (Hidden on mobile) ── */}
        <section
          suppressHydrationWarning
          className="hidden md:block rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {/* Column 1: Daily Momentum & Habit */}
            <div className="pr-0 md:pr-8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Daily Devotional Momentum
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {streak.availableFreezes}{" "}
                  {streak.availableFreezes === 1 ? "freeze" : "freezes"} left
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {streak.currentStreak}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {streak.currentStreak === 1
                      ? "Day Active Streak"
                      : "Days Active Streak"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {streak.isTodayCompleted
                    ? "Today's reading completed! Your daily reading rhythm is protected."
                    : "Today's reading pending. Read any chapter to keep your streak glowing."}
                </p>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Habit Consistency</span>
                  <span className="text-primary font-medium">
                    {streak.isTodayCompleted
                      ? "Completed for today"
                      : "Awaiting today's read"}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: streak.isTodayCompleted ? "100%" : "35%" }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Canon Trajectory & Pace */}
            <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookMarked className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Active Canon Trajectory
                  </span>
                </div>
                <span className="text-[11px] font-medium text-primary">
                  {activeTracker.name}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {overviewData.activityRings.overallPercentage}%
                  </span>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {overviewData.activityRings.readChapters} /{" "}
                    {overviewData.activityRings.totalChapters} chapters
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {overviewData.activityRings.thisWeekChapters} chapters read
                  this week • On pace to finish{" "}
                  {overviewData.activityRings.projectedFinishDate}.
                </p>
              </div>

              {/* Progress Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {overviewData.activityRings.avgDay30d} ch/day velocity
                </span>
                <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Next: {nextReading?.displayText ?? "Genesis 1"}
                </span>
                <Link
                  href={
                    nextReading
                      ? `/bible/${nextReading.bookId}/${nextReading.chapter}`
                      : "/bible/GEN/1"
                  }
                  className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  Continue →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Accessible Section Title ── */}
        <h2 className="sr-only">Overview</h2>

        {/* ── Deep Analytics Cards Grid ── */}
        <HomeChartsGrid overviewData={overviewData} />
      </div>
    </AppShell>
  );
}
