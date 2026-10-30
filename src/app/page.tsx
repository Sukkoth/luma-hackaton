import Link from "next/link";
import { Sparkles, Calendar } from "lucide-react";

export default function BooksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Books</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Track read chapters across all 66 books and review today&apos;s
          reading.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Verse of the day card placeholder */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs md:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>Verse of the Day</span>
          </div>
          <blockquote className="mt-3 text-lg font-medium text-zinc-800 italic dark:text-zinc-200">
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
          </blockquote>
          <p className="mt-2 text-sm text-zinc-500">Psalm 119:105</p>
        </div>

        {/* Today's Reading Plan Overview */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Today&apos;s Plans</span>
            </div>
            <Link
              href="/plans"
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
            No active plan scheduled for today. Start one in the catalog!
          </div>
        </div>
      </div>

      {/* 66 Books Placeholder with Category Filters */}
      <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Bible Books (66)</h2>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {[
              "All",
              "Old Testament",
              "New Testament",
              "Prophets",
              "Gospels",
              "Epistles",
            ].map((filter, i) => (
              <span
                key={filter}
                className={`rounded-full px-3 py-1 ${
                  i === 0
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Interactive 66-book grid with chapter bottom sheet will be rendered
          here.
        </p>
      </div>
    </div>
  );
}
