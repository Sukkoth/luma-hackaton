"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Compass,
  Search,
  BookOpen,
  ArrowRight,
  Bookmark,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  READING_PLANS,
  type ReadingPlanTemplate,
  type PlanFilterType,
  PLAN_FILTERS,
  isPlanMatchingFilter,
} from "@/data/readingPlans";

type PlanCardProps = {
  plan: ReadingPlanTemplate;
};

function PlanCard({ plan }: PlanCardProps) {
  const isCustom =
    plan.id.startsWith("custom_") || plan.id.startsWith("imported_");

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700">
      <div>
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {plan.category}
          </span>
          {plan.canonCompatibility &&
            plan.canonCompatibility !== "protestant" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <Bookmark className="h-3 w-3" />
                <span>{plan.canonCompatibility.replace("_", " ")}</span>
              </span>
            )}
          {isCustom && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              Custom
            </span>
          )}
        </div>

        {/* Title & description */}
        <h3 className="mt-3 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {plan.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {plan.subtitle || plan.description}
        </p>

        {/* Plan stats */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            <span>{plan.totalChapters} chapters</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{plan.recommendedDays} days</span>
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
            <span>~{plan.defaultDailyTarget} ch/day</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-500">
          {plan.allowSelfPaced ? "Self-Paced allowed" : "Fixed schedule"}
        </span>
        <Link
          href={`/plans/templates/${plan.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-600 hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
        >
          <span>Set Up Plan</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

type PlanCatalogProps = {
  initialTab?: "my_plans" | "catalog";
};

export function PlanCatalog({ initialTab = "catalog" }: PlanCatalogProps) {
  const [activeTab, setActiveTab] = useState<"my_plans" | "catalog">(
    initialTab
  );
  const [selectedFilter, setSelectedFilter] = useState<PlanFilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlans = READING_PLANS.filter((plan) => {
    const matchesFilter = isPlanMatchingFilter(plan, selectedFilter);
    const matchesQuery =
      searchQuery.trim() === "" ||
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div>
      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${
            activeTab === "catalog"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Plan Catalog ({READING_PLANS.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("my_plans")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${
            activeTab === "my_plans"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>My Plans (0)</span>
        </button>
      </div>

      {activeTab === "catalog" ? (
        <div className="mt-6 space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search plans by title or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-4 pl-9 text-sm transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div className="text-xs text-zinc-500">
              Showing {filteredPlans.length} of {READING_PLANS.length} plans
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {PLAN_FILTERS.map((f) => {
              const isSelected = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Catalog Grid */}
          {filteredPlans.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
              No plans match your current search or category filter.
            </div>
          )}
        </div>
      ) : (
        /* My Plans Tab */
        <div className="mt-8 rounded-xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
          <Calendar className="mx-auto h-10 w-10 text-zinc-400" />
          <h3 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            No active reading plans
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Select a plan from the catalog to start tracking your daily reading
            schedule.
          </p>
          <button
            onClick={() => setActiveTab("catalog")}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500"
          >
            Explore Catalog
          </button>
        </div>
      )}
    </div>
  );
}
