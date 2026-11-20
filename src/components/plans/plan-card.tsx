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
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
              {plan.category}
            </span>
            {plan.canonCompatibility &&
              plan.canonCompatibility !== "protestant" && (
                <span className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Bookmark className="size-3" />
                  <span>{plan.canonCompatibility.replace("_", " ")}</span>
                </span>
              )}
            {isCustom && (
              <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                Custom
              </span>
            )}
            {isEnrolled && (
              <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Check className="size-3" />
                <span>Enrolled</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              <span>{plan.totalChapters} ch</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{plan.recommendedDays}d</span>
            </span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
          {plan.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {plan.subtitle || plan.description}
        </p>

        {/* Capabilities Strip */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {plan.allowCustomPace === false ? (
            <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
              <Lock className="size-3" />
              <span>Fixed {plan.recommendedDays}d</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary font-medium">
              <Sliders className="size-3" />
              <span>Custom Pace</span>
            </span>
          )}

          {plan.allowSelfPaced === false ? (
            <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>Scheduled</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-foreground font-medium">
              <Compass className="size-3" />
              <span>Self-Paced</span>
            </span>
          )}

          <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
            <Activity className="size-3" />
            <span>~{plan.defaultDailyTarget} ch/d</span>
          </span>
        </div>
      </div>

      {/* Bottom Action Row */}
      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">
            Pacing Target
          </span>
          <span className="text-xs font-semibold text-foreground">
            {plan.recommendedDays} days ({plan.defaultDailyTarget} ch/d)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/plans/templates/${plan.id}`}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Details
          </Link>
          {onStartPlanAction && (
            <button
              type="button"
              onClick={() => onStartPlanAction(plan)}
              className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-90 transition-opacity cursor-pointer"
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
