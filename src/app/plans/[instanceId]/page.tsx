import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Circle, Clock, FileText } from "lucide-react";

async function PlanInstanceContent({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/plans"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Plans</span>
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
              Active Plan Instance
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Plan Progress: {instanceId}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            <span>Pace: On Track</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span>Overall Progress</span>
            <span>25%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-2.5 w-1/4 rounded-full bg-blue-600" />
          </div>
        </div>

        {/* Section Reading Items Checklist & Notes */}
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">
            Today&apos;s Sections & Checklist
          </h2>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Circle className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    Hebrews 1–2
                  </p>
                  <p className="text-xs text-zinc-500">Day 1 • Section 1</p>
                </div>
              </div>
              <Link
                href="/notes"
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Notes (0)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanInstancePage(props: {
  params: Promise<{ instanceId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl p-8 text-center text-sm text-zinc-500">
          Loading plan...
        </div>
      }
    >
      <PlanInstanceContent params={props.params} />
    </Suspense>
  );
}
