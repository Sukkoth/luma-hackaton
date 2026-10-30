import { BarChart3, Flame, Trophy, TrendingUp } from "lucide-react";

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Insights & Analytics
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          In-depth reading statistics, velocity, streaks, and Bible coverage
          breakdown.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-amber-600">
            <Flame className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase">
              Current Streak
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">0 Days</p>
          <span className="text-xs text-zinc-500">Longest: 0 days</span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase">
              Bible Completion
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">0%</p>
          <span className="text-xs text-zinc-500">0 of 1,189 chapters</span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-emerald-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase">Total Reads</span>
          </div>
          <p className="mt-2 text-2xl font-bold">0</p>
          <span className="text-xs text-zinc-500">Logged chapter sessions</span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-purple-600">
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase">
              Achievements
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold">0 / 24</p>
          <span className="text-xs text-zinc-500">Badges unlocked</span>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">
          Reading Heatmap & Testament Breakdown
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Detailed visual graphs, reading streaks, and genre breakdown charts
          will be rendered here.
        </p>
      </div>
    </div>
  );
}
