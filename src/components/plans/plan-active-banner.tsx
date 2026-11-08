import Link from "next/link";
import { Bookmark, LogIn, Play } from "lucide-react";
import type { useSession } from "@/lib/auth-client";
import { READING_PLANS } from "@/data/readingPlans";

export type ActivePlanInstance = {
  id: string;
  templateId: string;
  title: string;
  currentPassage: string;
  dayText: string;
  progressPercent: number;
  readChapters: number;
  totalChapters: number;
  status: "On Track" | "Rest Buffer" | "Flexible" | "Paused" | "Finished";
  statusColor: string;
  completedAt?: string | null;
};

type SessionData = ReturnType<typeof useSession>["data"];

type Props = {
  session: SessionData;
  activePlanInstances: ReadonlyArray<ActivePlanInstance>;
  onBrowseCatalog?: () => void;
};

export function PlanActiveBanner({ session, activePlanInstances }: Props) {
  return (
    <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {!session ? (
        /* Public Unauthenticated Catalog Discovery Banner */
        <div className="ui-card flex flex-col justify-between p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold text-foreground-secondary">
                <Bookmark className="size-3.5 text-primary" />
                <span>Bible Plans Catalog • Curated Journeys</span>
              </span>
              <span className="ui-pill text-[11px] font-bold">
                {READING_PLANS.length} Curated Plans
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
                Explore Structured Scripture Plans
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-foreground-secondary">
                From 7-day topical deep-dives to comprehensive year-long
                canonical schedules across 4 Christian traditions. Preview
                reading outlines freely or sign in to begin your journey.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3 text-[13px]">
            <span className="text-foreground-dim">
              Sign in to activate plans & track daily checkoffs
            </span>
            <Link
              href="/login?redirect=/plans"
              className="ui-btn-primary ui-btn-sm gap-1.5"
            >
              <LogIn className="size-3.5" />
              <span>Sign In to Start Plan</span>
            </Link>
          </div>
        </div>
      ) : activePlanInstances.length > 0 ? (
        /* Active Plan in Progress Banner for User with Active Plans */
        <div className="ui-card flex flex-col justify-between p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold text-foreground-secondary">
                <Bookmark className="size-3.5 text-primary" />
                <span>Bible Plans • Active Reading</span>
              </span>
              <span className="ui-pill-primary text-[11px] font-bold">
                {activePlanInstances[0]?.progressPercent}% Complete
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h3 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
                  {activePlanInstances[0]?.title}
                </h3>
                <p className="text-[13px] text-foreground-secondary">
                  Today:{" "}
                  <span className="font-bold text-foreground">
                    {activePlanInstances[0]?.currentPassage}
                  </span>{" "}
                  • {activePlanInstances[0]?.dayText}
                </p>
              </div>
              <span className="text-[12px] font-medium text-foreground-dim">
                {activePlanInstances[0]?.readChapters} /{" "}
                {activePlanInstances[0]?.totalChapters} chapters read
              </span>
            </div>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                style={{
                  width: `${activePlanInstances[0]?.progressPercent}%`,
                }}
                className="h-full rounded-full bg-primary transition-all duration-300"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3 text-[13px]">
            <span className="font-medium text-foreground-dim">
              {activePlanInstances[0]?.status}
            </span>
            <Link
              href={`/plans/${activePlanInstances[0]?.id}`}
              className="ui-btn-primary ui-btn-sm gap-1.5"
            >
              <Play className="size-3 fill-current" />
              <span>Resume Reading</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Authenticated User without Active Plans */
        <div className="ui-card flex flex-col justify-between p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-bold text-foreground-secondary">
                <Bookmark className="size-3.5 text-primary" />
                <span>Bible Plans • Personal Reading</span>
              </span>
              <span className="ui-pill text-[11px] font-bold">
                Ready to Start
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
                Start Your First Reading Plan
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-foreground-secondary">
                You don&apos;t have any active plans running yet. Select any
                curriculum from the catalog below and click &ldquo;Create &
                Start Plan&rdquo; to begin your daily scheduled readings.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3 text-[13px]">
            <span className="text-foreground-dim">
              {READING_PLANS.length} curated blueprints available below
            </span>
            <span className="text-[12px] font-bold text-foreground">
              Select a plan below to start
            </span>
          </div>
        </div>
      )}

      {/* Quick Plans Stats Card */}
      <div className="ui-card flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-foreground-secondary">
              Plans Overview
            </span>
            <span className="ui-pill text-[11px] font-bold">
              {activePlanInstances.length} Active
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-foreground-secondary">
                Total Catalog Templates
              </span>
              <span className="text-[18px] font-medium text-foreground">
                {READING_PLANS.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-foreground-secondary">
                Christian Traditions
              </span>
              <span className="text-[18px] font-medium text-foreground">
                4 Canons
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-foreground-secondary">
                Pacing Flexibility
              </span>
              <span className="ui-pill text-[11px] font-medium">
                Fixed & Self-Paced
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border-subtle pt-3 text-[12px] text-foreground-dim">
          <span>Click any plan below to inspect blueprint</span>
        </div>
      </div>
    </section>
  );
}
