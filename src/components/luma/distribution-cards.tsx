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
      <div className="ui-card flex flex-col justify-between p-6">
        <div>
          <div>
            <h4 className="text-[16px] font-normal tracking-tight text-foreground">
              Scripture Distribution
            </h4>
          </div>

          {/* Breakdown items */}
          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-foreground-secondary">
                <span className="size-1.5 rounded-full bg-border-strong" />
                <span>Pentateuch & Law</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-light text-foreground">
                  {distribution.law}
                </span>
                <span className="ui-pill text-[10px]">
                  {getPercent(distribution.law)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-foreground-secondary">
                <span className="size-1.5 rounded-full bg-border-strong" />
                <span>Historical Books</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-light text-foreground">
                  {distribution.history}
                </span>
                <span className="ui-pill text-[10px]">
                  {getPercent(distribution.history)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-foreground-secondary">
                <span className="size-1.5 rounded-full bg-border-strong" />
                <span>Poetry & Wisdom</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-light text-foreground">
                  {distribution.poetry}
                </span>
                <span className="ui-pill text-[10px]">
                  {getPercent(distribution.poetry)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-foreground-secondary">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>Gospels & Epistles</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-light text-foreground">
                  {distribution.gospelsEpistles}
                </span>
                <span className="ui-pill-primary text-[10px]">
                  {getPercent(distribution.gospelsEpistles)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: Active Plans Status */}
      <div className="ui-card flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-normal tracking-tight text-foreground">
              Active Plans Status
            </h4>
            <span className="ui-pill text-[10px]">
              {activePlans.length}{" "}
              {activePlans.length === 1 ? "Active" : "Active"}
            </span>
          </div>

          {activePlans.length > 0 ? (
            <div className="mt-5 space-y-3.5">
              {activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="ui-card-elevated flex items-center justify-between p-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Bookmark className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {plan.title}
                      </p>
                      <p className="text-[11px] text-foreground-secondary">
                        {plan.completedChapters} of {plan.totalChapters}{" "}
                        chapters
                      </p>
                    </div>
                  </div>
                  <span className="ui-pill text-[10px]">
                    {plan.progressPercent}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
              <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface-subtle text-foreground">
                <Bookmark className="size-4" />
              </div>
              <p className="mt-2.5 text-[13px] font-medium text-foreground">
                No Active Reading Plans
              </p>
              <p className="mt-0.5 text-[11px] text-foreground-secondary">
                Explore structured plans to guide your devotional rhythm.
              </p>
              <Link
                href="/plans"
                className="ui-btn-primary mt-3.5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px]"
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
