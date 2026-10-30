import Link from "next/link";
import { Calendar, Compass, ArrowRight } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bible Plans</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Browse curated reading plans or resume your active plans.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
        <button className="flex items-center gap-2 border-b-2 border-blue-600 pb-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <Calendar className="h-4 w-4" />
          <span>My Plans</span>
        </button>
        <button className="flex items-center gap-2 pb-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          <Compass className="h-4 w-4" />
          <span>Plan Catalog</span>
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sample card leading to template detail */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              New Testament
            </span>
            <h3 className="mt-3 text-lg font-semibold">Gospels in 30 Days</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Walk through Matthew, Mark, Luke, and John with daily readings.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">30 days • 89 chapters</span>
            <Link
              href="/plans/templates/gospels-30"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              <span>View details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
