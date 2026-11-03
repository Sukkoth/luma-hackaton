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
    <div className="group relative isolate flex flex-col justify-between rounded-[20px] border border-black/8 bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/18 hover:bg-white hover:shadow-md dark:border-white/8 dark:bg-white/4 dark:shadow-none dark:hover:border-white/18 dark:hover:bg-white/8">
      <div>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-black/4 px-2 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
            {plan.category}
          </span>
          {plan.canonCompatibility &&
            plan.canonCompatibility !== "protestant" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                <Bookmark className="size-3" />
                <span>{plan.canonCompatibility.replace("_", " ")}</span>
              </span>
            )}
          {isEnrolled && (
            <span className="rounded-md bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              Enrolled
            </span>
          )}
          {isCustom && (
            <span className="rounded-md bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
              Custom
            </span>
          )}
        </div>

        {/* Title & description */}
        <h3 className="mt-3 text-[17px] font-medium tracking-tight text-black transition-colors group-hover:text-[#6894BC] dark:text-white dark:group-hover:text-[#82ADD4]">
          {plan.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug font-normal text-[#666666] dark:text-[#9CA3AF]">
          {plan.subtitle || plan.description}
        </p>

        {/* Plan stats */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5 text-[#888888] dark:text-[#9CA3AF]" />
            <span>{plan.totalChapters} ch</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-[#888888] dark:text-[#9CA3AF]" />
            <span>{plan.recommendedDays} days</span>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-[#888888] dark:text-[#9CA3AF]" />
            <span>~{plan.defaultDailyTarget} / day</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/6">
        <span className="text-[11px] font-normal text-[#888888] dark:text-[#A1A1AA]">
          {plan.allowSelfPaced ? "Self-Paced allowed" : "Fixed schedule"}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/plans/templates/${plan.id}`}
            className="flex items-center gap-1 rounded-xl border border-black/8 bg-white/70 px-3 py-1.5 text-[12px] font-medium text-black shadow-2xs transition-all hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            <span>Details</span>
          </Link>
          {onStartPlanAction && (
            <button
              type="button"
              onClick={() => onStartPlanAction(plan)}
              className="flex items-center gap-1 rounded-xl bg-black px-3.5 py-1.5 text-[12px] font-medium text-white shadow-2xs transition-all hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
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
