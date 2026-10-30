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
} from "lucide-react";
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/plans"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Catalog</span>
      </Link>

      {/* Hero Header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {plan.category}
          </span>
          {plan.canonCompatibility &&
            plan.canonCompatibility !== "protestant" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <Bookmark className="h-3 w-3" />
                <span>{plan.canonCompatibility.replace("_", " ")}</span>
              </span>
            )}
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
          {plan.title}
        </h1>
        {plan.subtitle && (
          <p className="mt-1 text-base font-medium text-zinc-600 dark:text-zinc-400">
            {plan.subtitle}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {plan.description}
        </p>

        {/* Quick Specs */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-4 dark:border-zinc-800">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Chapters</span>
            </span>
            <p className="mt-1 text-lg font-bold">{plan.totalChapters}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Recommended</span>
            </span>
            <p className="mt-1 text-lg font-bold">
              {plan.recommendedDays} days
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Daily Target</span>
            </span>
            <p className="mt-1 text-lg font-bold">
              ~{plan.defaultDailyTarget} / day
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Pacing Mode</span>
            </span>
            <p className="mt-1 text-sm font-semibold">
              {plan.allowSelfPaced ? "Flexible" : "Fixed"}
            </p>
          </div>
        </div>

        {/* Wizard Start Form Placeholder */}
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Multi-Step Plan Wizard</span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Configure tracker association, starting date, and pacing mode.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500">Step 1</span>
              <p className="mt-1 font-semibold">Select Tracker</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500">Step 2</span>
              <p className="mt-1 font-semibold">Schedule & Days</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <span className="text-xs font-medium text-zinc-500">Step 3</span>
              <p className="mt-1 font-semibold">Confirm & Start</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href={`/plans/${plan.id}-instance`}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-500"
            >
              Start Plan Now
            </Link>
          </div>
        </div>
      </div>

      {/* Curriculum / Sections breakdown */}
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">Curriculum & Reading Breakdown</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {plan.sections?.length > 0
            ? `${plan.sections.length} thematic sections`
            : `${plan.readings.length} reading assignments`}
        </p>

        <div className="mt-4 space-y-3">
          {plan.sections && plan.sections.length > 0 ? (
            plan.sections.map((section, idx) => (
              <div
                key={section.title || idx}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-3.5 dark:border-zinc-800/60"
              >
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {section.title}
                  </h4>
                  {section.subtitle && (
                    <p className="text-xs text-zinc-500">{section.subtitle}</p>
                  )}
                  {section.booksDescription && (
                    <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                      {section.booksDescription}
                    </p>
                  )}
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  {section.chaptersCount} ch
                </span>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {plan.readings.slice(0, 10).map((reading, idx) => (
                <div
                  key={reading.id || idx}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3.5 py-2.5 text-xs dark:bg-zinc-800/40"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {reading.bookName || reading.bookId} {reading.chapter}
                    {reading.versesLabel ? ` (${reading.versesLabel})` : ""}
                  </span>
                  <span className="text-zinc-400">
                    Assignment #{reading.order || idx + 1}
                  </span>
                </div>
              ))}
              {plan.readings.length > 10 && (
                <p className="pt-2 text-center text-xs text-zinc-500">
                  + {plan.readings.length - 10} more reading assignments
                </p>
              )}
            </div>
          )}
        </div>
      </div>
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
        <div className="mx-auto max-w-4xl p-8 text-center text-sm text-zinc-500">
          Loading plan blueprint...
        </div>
      }
    >
      <PlanTemplateDetailContent params={params} />
    </Suspense>
  );
}
