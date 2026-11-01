"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Compass,
  Search,
  ArrowRight,
  CheckCircle2,
  X,
  Lock,
  LogIn,
} from "lucide-react";
import {
  READING_PLANS,
  type PlanFilterType,
  isPlanMatchingFilter,
} from "@/data/readingPlans";
import { useSession } from "@/lib/auth-client";
import { PlanCard } from "./plan-card";
import { PlanFilterPills } from "./plan-filter-pills";
import {
  PlanActiveBanner,
  type ActivePlanInstance,
} from "./plan-active-banner";

const EMPTY_PLAN_INSTANCES: ReadonlyArray<ActivePlanInstance> = [];

type Props = {
  initialTab?: "catalog" | "my_plans";
};

export function PlanCatalog({ initialTab = "catalog" }: Props) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"catalog" | "my_plans">(
    initialTab
  );
  const [selectedFilter, setSelectedFilter] = useState<PlanFilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const activePlanInstances = EMPTY_PLAN_INSTANCES;

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
    <div className="space-y-4">
      {/* Top Highlights Row */}
      <PlanActiveBanner
        session={session}
        activePlanInstances={activePlanInstances}
        onBrowseCatalog={() => setActiveTab("catalog")}
      />

      {/* Main Catalog & My Plans Section */}
      <section className="glass-panel rounded-[28px] p-6 sm:p-7">
        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col gap-4 border-b border-black/4 pb-5 md:flex-row md:items-center md:justify-between dark:border-white/6">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-2 rounded-[14px] px-5 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "catalog"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <Compass className="size-3.5" />
              <span>Plan Catalog ({READING_PLANS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("my_plans")}
              className={`flex items-center gap-2 rounded-[14px] px-5 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "my_plans"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <Calendar className="size-3.5" />
              <span>My Plans ({session ? activePlanInstances.length : 0})</span>
            </button>
          </div>

          {/* Search Input */}
          {activeTab === "catalog" && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-3.5 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/50 py-2 pr-3.5 pl-9 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-white focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#888888] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "catalog" ? (
          <div>
            <PlanFilterPills
              selectedFilter={selectedFilter}
              onSelectFilter={({ filter }) => setSelectedFilter(filter)}
            />

            {/* Catalog Grid */}
            {filteredPlans.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[#777777] dark:text-[#A1A1AA]">
                <p className="text-[15px] font-normal">
                  No reading plans match &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilter("All");
                  }}
                  className="mt-3 rounded-xl border border-white/80 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-black shadow-2xs hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : !session ? (
          /* Unauthenticated Prompt in My Plans Tab */
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-black/4 text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
              <Lock className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
              Sign in to view your plans
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Active schedules, daily checklists, and section checkoffs are
              saved to your account.
            </p>
            <Link
              href="/login?redirect=/plans"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <LogIn className="size-4" />
              <span>Sign In to Scripture</span>
            </Link>
          </div>
        ) : activePlanInstances.length === 0 ? (
          /* Authenticated User without Started Plans */
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              <Calendar className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
              No active plans started yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Browse the catalog to preview reading blueprints and schedules.
              Full plan enrollment is coming soon.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Compass className="size-3.5" />
              <span>Browse Plan Catalog</span>
            </button>
          </div>
        ) : (
          /* Render Active User Plans */
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {activePlanInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="isolate flex flex-col justify-between rounded-[20px] border border-black/8 bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/18 hover:bg-white hover:shadow-md dark:border-white/8 dark:bg-white/4 dark:shadow-none dark:hover:border-white/18 dark:hover:bg-white/8"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${instance.statusColor}`}
                      >
                        {instance.status}
                      </span>
                      <span className="text-[12px] font-medium text-black dark:text-white">
                        {instance.progressPercent}%
                      </span>
                    </div>

                    <h3 className="mt-3 text-[18px] font-medium tracking-tight text-black dark:text-white">
                      {instance.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                      Passage:{" "}
                      <strong className="font-medium text-black dark:text-white">
                        {instance.currentPassage}
                      </strong>
                    </p>
                    <p className="text-[12px] text-[#888888] dark:text-[#A1A1AA]">
                      {instance.dayText}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                        <span>
                          {instance.readChapters} / {instance.totalChapters}{" "}
                          chapters
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/6">
                        <div
                          style={{ width: `${instance.progressPercent}%` }}
                          className="h-full rounded-full bg-linear-to-r from-[#82ADD4] to-[#DDFD2C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/6">
                    <span className="flex items-center gap-1 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                      <CheckCircle2 className="size-3.5 text-[#82ADD4]" />
                      <span>Active Tracker</span>
                    </span>
                    <Link
                      href={`/plans/${instance.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      <span>Checkoff Sections</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
