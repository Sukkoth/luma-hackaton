import { Suspense } from "react";
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
  ArrowRight,
} from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";
import { getReadingPlanById } from "@/data/readingPlans";

type PlanTemplateDetailContentParams = {
  params: Promise<{ id: string }>;
};

async function PlanTemplateDetailContent({
  params,
}: PlanTemplateDetailContentParams) {
  const { id } = await params;
  const plan = getReadingPlanById(id);

  if (!plan) {
    notFound();
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      <main className="mt-4 space-y-4">
        {/* Breadcrumb / Back button */}
        <div>
          <Link
            href="/plans"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/90 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.75]" />
            <span>Back to Plan Catalog</span>
          </Link>
        </div>

        {/* Hero Card */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[6px] bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
              {plan.category}
            </span>
            {plan.canonCompatibility &&
              plan.canonCompatibility !== "protestant" && (
                <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#82ADD4]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                  <Bookmark className="h-3 w-3" />
                  <span>{plan.canonCompatibility.replace("_", " ")}</span>
                </span>
              )}
            <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
              Blueprint Template
            </span>
          </div>

          <h1 className="mt-3 text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
            {plan.title}
          </h1>
          {plan.subtitle && (
            <p className="mt-1 text-[15px] font-normal text-[#666666] dark:text-[#9CA3AF]">
              {plan.subtitle}
            </p>
          )}
          <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-[#777777] dark:text-[#A1A1AA]">
            {plan.description}
          </p>

          {/* Quick Specs Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3.5 border-t border-black/[0.04] pt-6 sm:grid-cols-4 dark:border-white/[0.06]">
            <div className="rounded-[18px] border border-black/[0.06] bg-white/70 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]">
              <span className="flex items-center gap-1.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                <BookOpen className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
                <span>Chapters</span>
              </span>
              <p className="mt-1.5 text-[24px] font-light text-black dark:text-white">
                {plan.totalChapters}
              </p>
            </div>
            <div className="rounded-[18px] border border-black/[0.06] bg-white/70 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]">
              <span className="flex items-center gap-1.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                <Clock className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
                <span>Duration</span>
              </span>
              <p className="mt-1.5 text-[24px] font-light text-black dark:text-white">
                {plan.recommendedDays} days
              </p>
            </div>
            <div className="rounded-[18px] border border-black/[0.06] bg-white/70 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]">
              <span className="flex items-center gap-1.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                <Sparkles className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
                <span>Daily Target</span>
              </span>
              <p className="mt-1.5 text-[24px] font-light text-black dark:text-white">
                ~{plan.defaultDailyTarget} / day
              </p>
            </div>
            <div className="rounded-[18px] border border-black/[0.06] bg-white/70 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]">
              <span className="flex items-center gap-1.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                <Calendar className="h-3.5 w-3.5 text-[#888888] dark:text-[#9CA3AF]" />
                <span>Pacing Mode</span>
              </span>
              <p className="mt-1.5 text-[18px] font-normal text-black dark:text-white">
                {plan.allowSelfPaced ? "Self-Paced" : "Fixed Target"}
              </p>
            </div>
          </div>

          {/* Multi-Step Plan Wizard Card */}
          <div className="mt-7 rounded-[22px] border border-black/[0.06] bg-white/60 p-5 backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-[16px] font-medium text-black dark:text-white">
                  <Sliders className="h-4 w-4 text-[#82ADD4]" />
                  <span>Start Plan Wizard</span>
                </h3>
                <p className="mt-0.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                  Configure your starting date, schedule buffer, and active
                  tracker association.
                </p>
              </div>
              <Link
                href={`/plans/${plan.id}-instance`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 sm:mt-0 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <span>Create & Start Plan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[14px] border border-white/80 bg-white/80 p-3.5 shadow-2xs dark:border-white/10 dark:bg-white/[0.05]">
                <span className="text-[11px] font-medium text-[#888888] dark:text-[#9CA3AF]">
                  Step 1
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-black dark:text-white">
                  Select Active Tracker
                </p>
              </div>
              <div className="rounded-[14px] border border-white/80 bg-white/80 p-3.5 shadow-2xs dark:border-white/10 dark:bg-white/[0.05]">
                <span className="text-[11px] font-medium text-[#888888] dark:text-[#9CA3AF]">
                  Step 2
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-black dark:text-white">
                  Set Schedule & Rest Days
                </p>
              </div>
              <div className="rounded-[14px] border border-white/80 bg-white/80 p-3.5 shadow-2xs dark:border-white/10 dark:bg-white/[0.05]">
                <span className="text-[11px] font-medium text-[#888888] dark:text-[#9CA3AF]">
                  Step 3
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-black dark:text-white">
                  Confirm Blueprint Instance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Curriculum & Reading Breakdown */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-black/[0.04] pb-4 dark:border-white/[0.06]">
            <div>
              <h2 className="text-[18px] font-normal tracking-tight text-black dark:text-white">
                Curriculum & Reading Breakdown
              </h2>
              <p className="mt-0.5 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
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
                  className="flex items-center justify-between rounded-[16px] border border-black/[0.06] bg-white/70 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.07]"
                >
                  <div>
                    <h4 className="text-[14px] font-medium text-black dark:text-white">
                      {section.title}
                    </h4>
                    {section.subtitle && (
                      <p className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                        {section.subtitle}
                      </p>
                    )}
                    {section.booksDescription && (
                      <p className="mt-0.5 text-[12px] text-[#6894BC] dark:text-[#82ADD4]">
                        {section.booksDescription}
                      </p>
                    )}
                  </div>
                  <span className="rounded-[6px] bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                    {section.chaptersCount} chapters
                  </span>
                </div>
              ))
            ) : (
              <div className="space-y-2">
                {plan.readings.slice(0, 10).map((reading, idx) => (
                  <div
                    key={reading.id || idx}
                    className="flex items-center justify-between rounded-[14px] border border-black/[0.05] bg-white/70 px-4 py-2.5 text-[12px] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.04]"
                  >
                    <span className="font-medium text-black dark:text-white">
                      {reading.bookName || reading.bookId} {reading.chapter}
                      {reading.versesLabel ? ` (${reading.versesLabel})` : ""}
                    </span>
                    <span className="text-[#888888] dark:text-[#A1A1AA]">
                      Assignment #{reading.order || idx + 1}
                    </span>
                  </div>
                ))}
                {plan.readings.length > 10 && (
                  <p className="pt-2 text-center text-[12px] text-[#777777] dark:text-[#A1A1AA]">
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
        <div className="mx-auto max-w-[1400px] p-8 text-center text-[13px] text-[#777777]">
          Loading plan blueprint...
        </div>
      }
    >
      <PlanTemplateDetailContent params={params} />
    </Suspense>
  );
}
