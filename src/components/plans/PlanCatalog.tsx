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
  CheckCircle2,
  X,
  Play,
  Lock,
  LogIn,
} from "lucide-react";
import {
  READING_PLANS,
  type ReadingPlanTemplate,
  type PlanFilterType,
  PLAN_FILTERS,
  isPlanMatchingFilter,
} from "@/data/readingPlans";
import { useSession } from "@/lib/auth-client";

type PlanCardProps = {
  plan: ReadingPlanTemplate;
};

function PlanCard({ plan }: PlanCardProps) {
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

type ActivePlanInstance = {
  id: string;
  templateId: string;
  title: string;
  currentPassage: string;
  dayText: string;
  progressPercent: number;
  readChapters: number;
  totalChapters: number;
  status: "On Track" | "Rest Buffer" | "Flexible";
  statusColor: string;
};

// Initial state has zero sample finished progress
const EMPTY_PLAN_INSTANCES: ReadonlyArray<ActivePlanInstance> = [];

type PlanCatalogProps = {
  initialTab?: "catalog" | "my_plans";
};

export function PlanCatalog({ initialTab = "catalog" }: PlanCatalogProps) {
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
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!session ? (
          /* Public Unauthenticated Catalog Discovery Banner */
          <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                  <Bookmark className="h-3.5 w-3.5 text-[#82ADD4]" />
                  <span>Bible Plans Catalog • Curated Journeys</span>
                </span>
                <span className="rounded-[4px] bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#497aa1] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
                  {READING_PLANS.length} Curated Plans
                </span>
              </div>

              <div className="mt-4">
                <h2 className="text-[22px] font-normal tracking-tight text-black sm:text-[24px] dark:text-white">
                  Explore Structured Scripture Plans
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
                  From 7-day topical deep-dives to comprehensive year-long
                  canonical schedules across 4 Christian traditions. Preview
                  reading outlines freely or sign in to begin your journey.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.04] pt-3 text-[13px] dark:border-white/[0.06]">
              <span className="text-[#777777] dark:text-[#A1A1AA]">
                Sign in to activate plans & track daily checkoffs
              </span>
              <Link
                href="/login?redirect=/plans"
                className="flex items-center gap-1.5 rounded-[12px] bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/80 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In to Start Plan</span>
              </Link>
            </div>
          </div>
        ) : activePlanInstances.length > 0 ? (
          /* Active Plan in Progress Banner for User with Active Plans */
          <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                  <Bookmark className="h-3.5 w-3.5 text-[#82ADD4]" />
                  <span>Bible Plans • Active Reading</span>
                </span>
                <span className="rounded-[4px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
                  {activePlanInstances[0]?.progressPercent}% Complete
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h3 className="text-[22px] font-light tracking-tight text-black sm:text-[24px] dark:text-white">
                    {activePlanInstances[0]?.title}
                  </h3>
                  <p className="text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                    Today:{" "}
                    <span className="font-medium text-black dark:text-white">
                      {activePlanInstances[0]?.currentPassage}
                    </span>{" "}
                    • {activePlanInstances[0]?.dayText}
                  </p>
                </div>
                <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                  {activePlanInstances[0]?.readChapters} /{" "}
                  {activePlanInstances[0]?.totalChapters} chapters read
                </span>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                <div
                  style={{
                    width: `${activePlanInstances[0]?.progressPercent}%`,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#DDFD2C]"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[13px] dark:border-white/[0.06]">
              <span className="text-[#777777] dark:text-[#A1A1AA]">
                {activePlanInstances[0]?.status}
              </span>
              <Link
                href={`/plans/${activePlanInstances[0]?.id}`}
                className="flex items-center gap-1.5 rounded-[12px] bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/80 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Resume Reading</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Authenticated User without Active Plans */
          <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6 sm:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                  <Bookmark className="h-3.5 w-3.5 text-[#82ADD4]" />
                  <span>Bible Plans • Personal Reading</span>
                </span>
                <span className="rounded-[4px] bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-[#666666] dark:bg-white/[0.08] dark:text-[#A1A1AA]">
                  Ready to Start
                </span>
              </div>

              <div className="mt-4">
                <h2 className="text-[22px] font-normal tracking-tight text-black sm:text-[24px] dark:text-white">
                  Start Your First Reading Plan
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
                  You don&apos;t have any active plans running yet. Select any
                  curriculum from the catalog below and click &ldquo;Create &
                  Start Plan&rdquo; to begin your daily scheduled readings.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[13px] dark:border-white/[0.06]">
              <span className="text-[#777777] dark:text-[#A1A1AA]">
                {READING_PLANS.length} curated blueprints available
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className="flex items-center gap-1.5 rounded-[12px] bg-black px-4 py-1.5 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/80 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Browse Catalog</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Plans Stats Card */}
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#555555] dark:text-[#9CA3AF]">
                Plans Overview
              </span>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
                {activePlanInstances.length} Active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#666666] dark:text-[#9CA3AF]">
                  Total Catalog Templates
                </span>
                <span className="text-[18px] font-light text-black dark:text-white">
                  {READING_PLANS.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#666666] dark:text-[#9CA3AF]">
                  Christian Traditions
                </span>
                <span className="text-[18px] font-light text-black dark:text-white">
                  4 Canons
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#666666] dark:text-[#9CA3AF]">
                  Pacing Flexibility
                </span>
                <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#497aa1] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
                  Fixed & Self-Paced
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-black/[0.04] pt-3 text-[12px] text-[#777777] dark:border-white/[0.06] dark:text-[#A1A1AA]">
            <span>Click any plan below to inspect blueprint</span>
          </div>
        </div>
      </section>

      {/* Main Catalog & My Plans Section */}
      <section className="glass-panel rounded-[28px] p-6 sm:p-7">
        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col gap-4 border-b border-black/[0.04] pb-5 md:flex-row md:items-center md:justify-between dark:border-white/[0.06]">
          {/* Tab Switcher - Luma soft-rectangular tiles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-2 rounded-[14px] px-5 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "catalog"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Plan Catalog ({READING_PLANS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("my_plans")}
              className={`flex items-center gap-2 rounded-[14px] px-5 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "my_plans"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>My Plans ({session ? activePlanInstances.length : 0})</span>
            </button>
          </div>

          {/* Search Input */}
          {activeTab === "catalog" && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[12px] border border-white/80 bg-white/50 py-2 pr-3.5 pl-9 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-white focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#888888] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "catalog" ? (
          <div>
            {/* Category Filter Pills (matching Books page) */}
            <div className="mt-4 flex flex-wrap gap-2">
              {PLAN_FILTERS.map((f) => {
                const isSelected = selectedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFilter(f.id)}
                    className={`rounded-[12px] px-3.5 py-1.5 text-[12px] backdrop-blur-md transition-all ${
                      isSelected
                        ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                        : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

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
                  className="mt-3 rounded-[12px] border border-white/80 bg-white/80 px-4 py-1.5 text-[13px] font-medium text-black shadow-2xs hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : !session ? (
          /* Unauthenticated Prompt in My Plans Tab */
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-black/[0.04] text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
              <Lock className="h-6 w-6" />
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
              className="mt-5 inline-flex items-center gap-1.5 rounded-[12px] bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In to Scripture</span>
            </Link>
          </div>
        ) : activePlanInstances.length === 0 ? (
          /* Authenticated User without Started Plans */
          <div className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
              No active plans started yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Browse the catalog and click &ldquo;Create & Start Plan&rdquo; on
              any plan to begin your daily scheduled readings.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className="mt-5 inline-flex items-center gap-1.5 rounded-[12px] bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Browse Plan Catalog</span>
            </button>
          </div>
        ) : (
          /* Render Active User Plans if Any Exist */
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {activePlanInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="isolate flex flex-col justify-between rounded-[20px] border border-black/[0.08] bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/[0.18] hover:bg-white hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:hover:border-white/[0.18] dark:hover:bg-white/[0.08]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-[6px] px-2 py-0.5 text-[11px] font-medium ${instance.statusColor}`}
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
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                        <div
                          style={{ width: `${instance.progressPercent}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#DDFD2C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/[0.05] pt-4 dark:border-white/[0.06]">
                    <span className="flex items-center gap-1 text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#82ADD4]" />
                      <span>Active Tracker</span>
                    </span>
                    <Link
                      href={`/plans/${instance.id}`}
                      className="flex items-center gap-1.5 rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      <span>Checkoff Sections</span>
                      <ArrowRight className="h-3.5 w-3.5" />
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
