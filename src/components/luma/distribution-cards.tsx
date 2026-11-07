import Link from "next/link";
import { Bookmark } from "lucide-react";

export type ActivePlanSummary = {
  id: string;
  title: string;
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
};

export type DistributionBreakdown = {
  law: number;
  history: number;
  poetry: number;
  gospelsEpistles: number;
};

type DistributionCardsProps = {
  distribution?: DistributionBreakdown;
  activePlans?: ReadonlyArray<ActivePlanSummary>;
};

export function DistributionCards({
  distribution = {
    law: 0,
    history: 0,
    poetry: 0,
    gospelsEpistles: 0,
  },
  activePlans = [],
}: DistributionCardsProps) {
  const totalRead =
    distribution.law +
    distribution.history +
    distribution.poetry +
    distribution.gospelsEpistles;

  const getPercent = (count: number) => {
    if (totalRead === 0) return "0%";
    return `${Math.round((count / totalRead) * 100)}%`;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Left Card: Scripture Distribution */}
      <div className="glass-panel flex flex-col justify-between rounded-[28px] p-6">
        <div>
          <div>
            <h4 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
              Scripture Distribution
            </h4>
          </div>

          {/* Breakdown items */}
          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="size-1.5 rounded-full bg-[#82ADD4]" />
                <span>Pentateuch & Law</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-light text-black dark:text-white">
                  {distribution.law}
                </span>
                <span className="rounded-sm bg-black/4 px-1.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                  {getPercent(distribution.law)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="size-1.5 rounded-full bg-[#A3C4E2]" />
                <span>Historical Books</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-light text-black dark:text-white">
                  {distribution.history}
                </span>
                <span className="rounded-sm bg-black/4 px-1.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                  {getPercent(distribution.history)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="size-1.5 rounded-full bg-[#C2D9EE]" />
                <span>Poetry & Wisdom</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-light text-black dark:text-white">
                  {distribution.poetry}
                </span>
                <span className="rounded-sm bg-black/4 px-1.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                  {getPercent(distribution.poetry)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="size-1.5 rounded-full bg-black dark:bg-white" />
                <span>Gospels & Epistles</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-light text-black dark:text-white">
                  {distribution.gospelsEpistles}
                </span>
                <span className="rounded-sm bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black shadow-2xs">
                  {getPercent(distribution.gospelsEpistles)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: Active Plans Status */}
      <div className="glass-panel flex flex-col justify-between rounded-[28px] p-6">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
              Active Plans Status
            </h4>
            <span className="rounded-full bg-black/4 px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
              {activePlans.length}{" "}
              {activePlans.length === 1 ? "Active" : "Active"}
            </span>
          </div>

          {activePlans.length > 0 ? (
            <div className="mt-5 space-y-3.5">
              {activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/50 p-3.5 dark:border-white/10 dark:bg-white/4"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-[#82ADD4] text-white">
                      <Bookmark className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-black dark:text-white">
                        {plan.title}
                      </p>
                      <p className="text-[11px] text-[#888888] dark:text-[#9CA3AF]">
                        {plan.completedChapters} of {plan.totalChapters}{" "}
                        chapters
                      </p>
                    </div>
                  </div>
                  <span className="rounded-sm bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                    {plan.progressPercent}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 p-6 text-center dark:border-white/10">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#82ADD4]">
                <Bookmark className="size-4" />
              </div>
              <p className="mt-2.5 text-[13px] font-medium text-black dark:text-white">
                No Active Reading Plans
              </p>
              <p className="mt-0.5 text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                Explore structured plans to guide your devotional rhythm.
              </p>
              <Link
                href="/plans"
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-1.5 text-[11px] font-medium text-white shadow-2xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <span>Browse Plans</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
