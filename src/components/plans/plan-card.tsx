import Link from "next/link";
import {
  BookOpen,
  Bookmark,
  Clock,
  ArrowRight,
  Lock,
  Sliders,
  Compass,
  Activity,
  Check,
} from "lucide-react";
import type { ReadingPlanTemplate } from "@/data/readingPlans";

type Props = {
  plan: ReadingPlanTemplate;
  onStartPlanAction?: (plan: ReadingPlanTemplate) => void;
  isEnrolled?: boolean;
};

export function PlanCard({
  plan,
  onStartPlanAction,
  isEnrolled = false,
}: Props) {
  const isCustom =
    plan.id.startsWith("custom_") || plan.id.startsWith("imported_");

  return (
    <div className="ui-card group relative isolate flex flex-col justify-between p-5 transition-all duration-150 hover:border-border-strong">
      <div>
        {/* Top Header Badge & Meta Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-surface-elevated px-2 py-0.5 text-[10px] font-bold text-foreground uppercase tracking-wide">
              {plan.category}
            </span>
            {plan.canonCompatibility &&
              plan.canonCompatibility !== "protestant" && (
                <span className="flex items-center gap-1 rounded-lg bg-primary-muted px-2 py-0.5 text-[10px] font-bold text-primary">
                  <Bookmark className="size-2.5" />
                  <span>{plan.canonCompatibility.replace("_", " ")}</span>
                </span>
              )}
            {isCustom && (
              <span className="rounded-lg bg-primary-muted px-2 py-0.5 text-[10px] font-bold text-primary">
                Custom
              </span>
            )}
            {isEnrolled && (
              <span className="flex items-center gap-1 rounded-lg bg-primary-muted px-2 py-0.5 text-[10px] font-bold text-primary">
                <Check className="size-2.5" />
                <span>Enrolled</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-dim">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              <span>{plan.totalChapters} ch</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{plan.recommendedDays} days</span>
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h3 className="mt-3 text-[17px] font-bold tracking-tight text-foreground">
          {plan.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed font-normal text-foreground-dim">
          {plan.subtitle || plan.description}
        </p>

        {/* Capabilities & Pacing Specs Strip (Watermelon signature) */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {plan.allowCustomPace === false ? (
            <span className="flex items-center gap-1 rounded-[8px] bg-surface-elevated px-2 py-1 text-[10.5px] font-medium text-foreground-dim">
              <Lock className="size-3" />
              <span>Fixed {plan.recommendedDays}d</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-[8px] bg-primary-muted px-2 py-1 text-[10.5px] font-bold text-primary">
              <Sliders className="size-3" />
              <span>Custom Pace</span>
            </span>
          )}

          {plan.allowSelfPaced === false ? (
            <span className="flex items-center gap-1 rounded-[8px] bg-surface-elevated px-2 py-1 text-[10.5px] font-medium text-foreground-dim">
              <Clock className="size-3" />
              <span>Scheduled Only</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-[8px] bg-surface-elevated px-2 py-1 text-[10.5px] font-medium text-foreground-secondary">
              <Compass className="size-3" />
              <span>Self-Paced</span>
            </span>
          )}

          <span className="flex items-center gap-1 rounded-[8px] bg-surface-elevated px-2 py-1 text-[10.5px] font-medium text-foreground-dim">
            <Activity className="size-3" />
            <span>~{plan.defaultDailyTarget} ch/d</span>
          </span>
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5">
        <div>
          <span className="block text-[9.5px] font-bold tracking-wider text-foreground-dim uppercase">
            Recommended Pace
          </span>
          <span className="text-[11.5px] font-semibold text-foreground">
            {plan.recommendedDays} days · ~{plan.defaultDailyTarget} ch/day
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/plans/templates/${plan.id}`}
            className="rounded-[12px] border border-border bg-surface-elevated px-3 py-1.5 text-[12px] font-bold text-foreground-secondary hover:border-border-strong hover:text-foreground transition-colors"
          >
            Details
          </Link>
          {onStartPlanAction && (
            <button
              type="button"
              onClick={() => onStartPlanAction(plan)}
              className="flex items-center gap-1 rounded-[12px] bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span>Start</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
