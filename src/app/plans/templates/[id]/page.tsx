import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Sliders,
  BookOpen,
  Clock,
  Sparkles,
  Calendar,
  Bookmark,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
import { resolvePlanBlueprint } from "@/actions/plans";
import { StartPlanAction } from "@/components/plans/start-plan-action";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";

type PlanTemplateDetailContentParams = {
  params: Promise<{ id: string }>;
};

async function PlanTemplateDetailContent({
  params,
}: PlanTemplateDetailContentParams) {
  const { id } = await params;
  const plan = await resolvePlanBlueprint({ templateId: id });

  if (!plan) {
    notFound();
  }

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

      <main className="mt-4 space-y-4">
        {/* Breadcrumb / Back button */}
        <div>
          <Link href="/plans" className="ui-btn-secondary ui-btn-sm gap-1.5">
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            <span>Back to Plan Catalog</span>
          </Link>
        </div>

        {/* Hero Card */}
        <div className="ui-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-pill text-[11px]">{plan.category}</span>
            {plan.canonCompatibility &&
              plan.canonCompatibility !== "protestant" && (
                <span className="ui-pill text-[10px]">
                  <Bookmark className="size-3" />
                  <span>{plan.canonCompatibility.replace("_", " ")}</span>
                </span>
              )}
            <span className="ui-pill-primary text-[10px]">
              Blueprint Template
            </span>
          </div>

          <h1 className="mt-3 text-[26px] font-bold tracking-tight text-foreground sm:text-[30px]">
            {plan.title}
          </h1>
          {plan.subtitle && (
            <p className="mt-1 text-[15px] font-normal text-foreground-secondary">
              {plan.subtitle}
            </p>
          )}
          <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-foreground-dim">
            {plan.description}
          </p>

          {/* Quick Specs Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3.5 border-t border-border pt-6 sm:grid-cols-4">
            <div className="ui-card-elevated p-4">
              <span className="flex items-center gap-1.5 text-[12px] text-foreground-dim">
                <BookOpen className="size-3.5 text-foreground-secondary" />
                <span>Chapters</span>
              </span>
              <p className="mt-1.5 text-[24px] font-light text-foreground">
                {plan.totalChapters}
              </p>
            </div>
            <div className="ui-card-elevated p-4">
              <span className="flex items-center gap-1.5 text-[12px] text-foreground-dim">
                <Clock className="size-3.5 text-foreground-secondary" />
                <span>Duration</span>
              </span>
              <p className="mt-1.5 text-[24px] font-light text-foreground">
                {plan.recommendedDays} days
              </p>
            </div>
            <div className="ui-card-elevated p-4">
              <span className="flex items-center gap-1.5 text-[12px] text-foreground-dim">
                <Sparkles className="size-3.5 text-foreground-secondary" />
                <span>Daily Target</span>
              </span>
              <p className="mt-1.5 text-[24px] font-light text-foreground">
                ~{plan.defaultDailyTarget} / day
              </p>
            </div>
            <div className="ui-card-elevated p-4">
              <span className="flex items-center gap-1.5 text-[12px] text-foreground-dim">
                <Calendar className="size-3.5 text-foreground-secondary" />
                <span>Pacing Mode</span>
              </span>
              <p className="mt-1.5 text-[18px] font-normal text-foreground">
                {plan.allowSelfPaced ? "Self-Paced" : "Fixed Target"}
              </p>
            </div>
          </div>

          {/* Multi-Step Plan Wizard Card */}
          <div className="ui-card-elevated mt-7 p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-foreground">
                  <Sliders className="size-4 text-foreground" />
                  <span>Start Reading Plan</span>
                </h3>
                <p className="mt-0.5 text-[12px] text-foreground-dim">
                  Configure your starting date, schedule buffer, and active
                  tracker association.
                </p>
              </div>
              <StartPlanAction
                plan={plan}
                activeTrackerId={trackersData.activeTracker?.id}
                trackerName={trackersData.activeTracker?.name}
                trackerCanon={trackersData.activeTracker?.canon}
                isAuthenticated={Boolean(session)}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="ui-card-elevated p-3.5">
                <span className="text-[11px] font-medium text-foreground-dim">
                  Step 1
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-foreground">
                  Select Active Tracker
                </p>
              </div>
              <div className="ui-card-elevated p-3.5">
                <span className="text-[11px] font-medium text-foreground-dim">
                  Step 2
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-foreground">
                  Set Schedule & Rest Days
                </p>
              </div>
              <div className="ui-card-elevated p-3.5">
                <span className="text-[11px] font-medium text-foreground-dim">
                  Step 3
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-foreground">
                  Confirm Blueprint Instance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum & Reading Breakdown */}
        <div className="ui-card p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h2 className="text-[18px] font-normal tracking-tight text-foreground">
                Curriculum & Reading Breakdown
              </h2>
              <p className="mt-0.5 text-[12px] text-foreground-secondary">
                {plan.sections?.length > 0
                  ? `${plan.sections.length} thematic sections`
                  : `${plan.readings.length} reading assignments`}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {plan.sections && plan.sections.length > 0 ? (
              plan.sections.map((section, idx) => (
                <div
                  key={section.title || idx}
                  className="ui-card-elevated flex items-center justify-between p-4"
                >
                  <div>
                    <h4 className="text-[14px] font-medium text-foreground">
                      {section.title}
                    </h4>
                    {section.subtitle && (
                      <p className="text-[12px] text-foreground-secondary">
                        {section.subtitle}
                      </p>
                    )}
                    {section.booksDescription && (
                      <p className="mt-0.5 text-[11px] text-foreground-dim">
                        {section.booksDescription}
                      </p>
                    )}
                  </div>
                  <span className="ui-pill text-[11px]">
                    {section.chaptersCount} chapters
                  </span>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {plan.readings.slice(0, 10).map((reading, idx) => (
                  <div
                    key={reading.id || idx}
                    className="ui-card-elevated flex items-center justify-between px-4 py-2.5 text-[12px]"
                  >
                    <span className="font-medium text-foreground">
                      {reading.bookName || reading.bookId} {reading.chapter}
                      {reading.versesLabel ? ` (${reading.versesLabel})` : ""}
                    </span>
                    <span className="text-foreground-dim">
                      Assignment #{reading.order || idx + 1}
                    </span>
                  </div>
                ))}
                {plan.readings.length > 10 && (
                  <p className="pt-2 text-center text-[12px] text-foreground-dim">
                    + {plan.readings.length - 10} more reading assignments
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

type PlanTemplateDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function PlanTemplateDetailPage({
  params,
}: PlanTemplateDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-350 p-8 text-center text-[13px] text-[#777777]">
          Loading plan blueprint...
        </div>
      }
    >
      <PlanTemplateDetailContent params={params} />
    </Suspense>
  );
}
