import Link from "next/link";
import { BookOpen, Bookmark, Clock, Sparkles, ArrowRight } from "lucide-react";
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
    <div className="ui-card group relative isolate flex flex-col justify-between p-5">
      <div>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="ui-pill text-[11px]">{plan.category}</span>
          {plan.canonCompatibility &&
            plan.canonCompatibility !== "protestant" && (
              <span className="ui-pill text-[11px]">
                <Bookmark className="size-3" />
                <span>{plan.canonCompatibility.replace("_", " ")}</span>
              </span>
            )}
          {isEnrolled && <span className="ui-pill text-[11px]">Enrolled</span>}
          {isCustom && (
            <span className="ui-pill-primary text-[11px]">Custom</span>
          )}
        </div>

        {/* Title & description */}
        <h3 className="mt-3 text-[17px] font-medium tracking-tight text-foreground transition-colors group-hover:text-foreground-secondary">
          {plan.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug font-normal text-foreground-secondary">
          {plan.subtitle || plan.description}
        </p>

        {/* Plan stats */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-foreground-dim">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5 text-foreground-dim" />
            <span>{plan.totalChapters} ch</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-foreground-dim" />
            <span>{plan.recommendedDays} days</span>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-foreground-dim" />
            <span>~{plan.defaultDailyTarget} / day</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
        <span className="text-[11px] font-normal text-foreground-dim">
          {plan.allowSelfPaced ? "Self-Paced allowed" : "Fixed schedule"}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/plans/templates/${plan.id}`}
            className="ui-btn-secondary px-3 py-1.5 text-[12px]"
          >
            <span>Details</span>
          </Link>
          {onStartPlanAction && (
            <button
              type="button"
              onClick={() => onStartPlanAction(plan)}
              className="ui-btn-primary px-3.5 py-1.5 text-[12px] gap-1"
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
