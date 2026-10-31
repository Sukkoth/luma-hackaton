import Link from "next/link";
import { BookOpen, Bookmark, Clock, Sparkles, ArrowRight } from "lucide-react";
import type { ReadingPlanTemplate } from "@/data/readingPlans";

type Props = {
  plan: ReadingPlanTemplate;
};

export function PlanCard({ plan }: Props) {
  const isCustom =
    plan.id.startsWith("custom_") || plan.id.startsWith("imported_");

  return (
    <div className="group relative isolate flex flex-col justify-between rounded-[20px] border border-black/[0.08] bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/[0.18] hover:bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-white/[0.18] dark:hover:bg-white/[0.08]">
      <div>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-[6px] bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
            {plan.category}
          </span>
          {plan.canonCompatibility &&
            plan.canonCompatibility !== "protestant" && (
              <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                <Bookmark className="h-3 w-3" />
                <span>{plan.canonCompatibility.replace("_", " ")}</span>
              </span>
            )}
          {isCustom && (
            <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
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
            <BookOpen className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
            <span>{plan.totalChapters} ch</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
            <span>{plan.recommendedDays} days</span>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
            <span>~{plan.defaultDailyTarget} / day</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-black/[0.05] pt-4 dark:border-white/[0.06]">
        <span className="text-[11px] font-normal text-[#888888] dark:text-[#A1A1AA]">
          {plan.allowSelfPaced ? "Self-Paced allowed" : "Fixed schedule"}
        </span>
        <Link
          href={`/plans/templates/${plan.id}`}
          className="flex items-center gap-1.5 rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
        >
          <span>View Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
