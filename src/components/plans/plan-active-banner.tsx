import Link from "next/link";
import { Bookmark, LogIn, Play, Compass } from "lucide-react";
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
  status: "On Track" | "Rest Buffer" | "Flexible";
  statusColor: string;
};

type SessionData = ReturnType<typeof useSession>["data"];

type Props = {
  session: SessionData;
  activePlanInstances: ReadonlyArray<ActivePlanInstance>;
  onBrowseCatalog: () => void;
};

export function PlanActiveBanner({
  session,
  activePlanInstances,
  onBrowseCatalog,
}: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!session ? (
        /* Public Unauthenticated Catalog Discovery Banner */
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                <Bookmark className="size-3.5 text-[#82ADD4]" />
                <span>Bible Plans Catalog • Curated Journeys</span>
              </span>
              <span className="rounded-sm bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#497aa1] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
                {READING_PLANS.length} Curated Plans
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[22px] font-normal tracking-tight text-black sm:text-[24px] dark:text-white">
                Explore Structured Scripture Plans
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
                From 7-day topical deep-dives to comprehensive year-long
                canonical schedules across 4 Christian traditions. Preview
                reading outlines freely or sign in to begin your journey.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/4 pt-3 text-[13px] dark:border-white/6">
            <span className="text-[#777777] dark:text-[#A1A1AA]">
              Sign in to activate plans & track daily checkoffs
            </span>
            <Link
              href="/login?redirect=/plans"
              className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/80 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <LogIn className="size-3.5" />
              <span>Sign In to Start Plan</span>
            </Link>
          </div>
        </div>
      ) : activePlanInstances.length > 0 ? (
        /* Active Plan in Progress Banner for User with Active Plans */
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                <Bookmark className="size-3.5 text-[#82ADD4]" />
                <span>Bible Plans • Active Reading</span>
              </span>
              <span className="rounded-sm bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                {activePlanInstances[0]?.progressPercent}% Complete
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h3 className="text-[22px] font-light tracking-tight text-black sm:text-[24px] dark:text-white">
                  {activePlanInstances[0]?.title}
                </h3>
                <p className="text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                  Today:{" "}
                  <span className="font-medium text-black dark:text-white">
                    {activePlanInstances[0]?.currentPassage}
                  </span>{" "}
                  • {activePlanInstances[0]?.dayText}
                </p>
              </div>
              <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                {activePlanInstances[0]?.readChapters} /{" "}
                {activePlanInstances[0]?.totalChapters} chapters read
              </span>
            </div>

            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/6">
              <div
                style={{
                  width: `${activePlanInstances[0]?.progressPercent}%`,
                }}
                className="h-full rounded-full bg-linear-to-r from-[#82ADD4] to-[#DDFD2C]"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-black/4 pt-3 text-[13px] dark:border-white/6">
            <span className="text-[#777777] dark:text-[#A1A1AA]">
              {activePlanInstances[0]?.status}
            </span>
            <Link
              href={`/plans/${activePlanInstances[0]?.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/80 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Play className="size-3 fill-current" />
              <span>Resume Reading</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Authenticated User without Active Plans */
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                <Bookmark className="size-3.5 text-[#82ADD4]" />
                <span>Bible Plans • Personal Reading</span>
              </span>
              <span className="rounded-sm bg-black/5 px-2 py-0.5 text-[11px] font-medium text-[#666666] dark:bg-white/8 dark:text-[#A1A1AA]">
                Ready to Start
              </span>
            </div>

            <div className="mt-4">
              <h2 className="text-[22px] font-normal tracking-tight text-black sm:text-[24px] dark:text-white">
                Start Your First Reading Plan
              </h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
                You don&apos;t have any active plans running yet. Select any
                curriculum from the catalog below and click &ldquo;Create &
                Start Plan&rdquo; to begin your daily scheduled readings.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-black/4 pt-3 text-[13px] dark:border-white/6">
            <span className="text-[#777777] dark:text-[#A1A1AA]">
              {READING_PLANS.length} curated blueprints available
            </span>
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/80 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Compass className="size-3.5" />
              <span>Browse Catalog</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Plans Stats Card */}
      <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
              Plans Overview
            </span>
            <span className="rounded-full bg-black/4 px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
              {activePlanInstances.length} Active
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#666666] dark:text-[#9CA3AF]">
                Total Catalog Templates
              </span>
              <span className="text-[18px] font-light text-black dark:text-white">
                {READING_PLANS.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#666666] dark:text-[#9CA3AF]">
                Christian Traditions
              </span>
              <span className="text-[18px] font-light text-black dark:text-white">
                4 Canons
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#666666] dark:text-[#9CA3AF]">
                Pacing Flexibility
              </span>
              <span className="rounded-sm bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#497aa1] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
                Fixed & Self-Paced
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-black/4 pt-3 text-[12px] text-[#777777] dark:border-white/6 dark:text-[#A1A1AA]">
          <span>Click any plan below to inspect blueprint</span>
        </div>
      </div>
    </section>
  );
}
