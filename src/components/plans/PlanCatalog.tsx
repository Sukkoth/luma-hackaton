"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Compass,
  Search,
  ArrowRight,
  CheckCircle2,
  X,
  Lock,
  LogIn,
  Pause,
  Play,
  Trophy,
  Sparkles,
  Coffee,
} from "lucide-react";
import {
  READING_PLANS,
  type PlanFilterType,
  isPlanMatchingFilter,
  isPlanCanonCompatible,
} from "@/data/readingPlans";
import { BIBLE_CANONS_CONFIG, type BibleCanon } from "@/data/bibleData";
import { useSession } from "@/lib/auth-client";
import { PlanCard } from "./plan-card";
import { PlanFilterPills } from "./plan-filter-pills";
import {
  PlanActiveBanner,
  type ActivePlanInstance,
} from "./plan-active-banner";
import { PlanSetupModal } from "./plan-setup-modal";
import type { ReadingPlanTemplate } from "@/data/readingPlans";
import { celebratePlanCompletion } from "@/lib/confetti";
import { updatePlanSettingsAction } from "@/actions/plans";

const EMPTY_PLAN_INSTANCES: ReadonlyArray<ActivePlanInstance> = [];

export type CatalogTab = "catalog" | "active" | "paused" | "finished";

type Props = {
  initialTab?: "catalog" | "active" | "paused" | "finished" | "my_plans";
  activePlanInstances?: ReadonlyArray<ActivePlanInstance>;
  pausedPlanInstances?: ReadonlyArray<ActivePlanInstance>;
  finishedPlanInstances?: ReadonlyArray<ActivePlanInstance>;
  activeTrackerId?: string;
  trackerName?: string;
  trackerCanon?: BibleCanon;
};

export function PlanCatalog({
  initialTab = "catalog",
  activePlanInstances = EMPTY_PLAN_INSTANCES,
  pausedPlanInstances = EMPTY_PLAN_INSTANCES,
  finishedPlanInstances = EMPTY_PLAN_INSTANCES,
  activeTrackerId,
  trackerName,
  trackerCanon = "protestant",
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<CatalogTab>(() => {
    if (initialTab === "my_plans" || initialTab === "active") return "active";
    if (initialTab === "paused") return "paused";
    if (initialTab === "finished") return "finished";
    return "catalog";
  });
  const [selectedFilter, setSelectedFilter] = useState<PlanFilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanForEnrollment, setSelectedPlanForEnrollment] =
    useState<ReadingPlanTemplate | null>(null);

  const enrolledTemplateIds = new Set([
    ...activePlanInstances.map((p) => p.templateId),
    ...pausedPlanInstances.map((p) => p.templateId),
  ]);

  const handleResumePlan = (instanceId: string) => {
    startTransition(async () => {
      await updatePlanSettingsAction({
        instanceId,
        status: "active",
      });
      router.refresh();
    });
  };

  const availablePlans = READING_PLANS.filter((plan) => {
    // 1. Hide templates that already have an active or paused instance in this tracker
    if (enrolledTemplateIds.has(plan.id)) {
      return false;
    }

    // 2. Hide templates incompatible with active tracker's canon
    if (trackerCanon && !isPlanCanonCompatible({ plan, trackerCanon })) {
      return false;
    }

    return true;
  });

  const filteredPlans = availablePlans.filter((plan) => {
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
      />

      {/* Main Catalog & My Plans Section */}
      <section className="glass-panel rounded-[28px] p-6 sm:p-7">
        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col gap-4 border-b border-black/4 pb-5 md:flex-row md:items-center md:justify-between dark:border-white/6">
          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "catalog"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <Compass className="size-3.5" />
              <span>Plan Catalog ({availablePlans.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "active"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <Calendar className="size-3.5" />
              <span>
                Active Plans ({session ? activePlanInstances.length : 0})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paused")}
              className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "paused"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <Pause className="size-3.5" />
              <span>
                Paused Plans ({session ? pausedPlanInstances.length : 0})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("finished")}
              className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] backdrop-blur-md transition-all ${
                activeTab === "finished"
                  ? "border border-white/90 bg-white font-medium text-black shadow-xs dark:border-white/15 dark:bg-white/10 dark:text-white"
                  : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black dark:border-white/6 dark:bg-white/3 dark:text-[#A1A1AA] dark:hover:border-white/15 dark:hover:bg-white/8 dark:hover:text-white"
              }`}
            >
              <Trophy className="size-3.5 text-[#82ADD4]" />
              <span>
                Finished Plans ({session ? finishedPlanInstances.length : 0})
              </span>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <PlanFilterPills
                selectedFilter={selectedFilter}
                onSelectFilter={({ filter }) => setSelectedFilter(filter)}
              />
              {trackerCanon && BIBLE_CANONS_CONFIG[trackerCanon] && (
                <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-black/5 bg-black/[0.03] px-3 py-1 text-[11px] text-[#666666] sm:self-auto dark:border-white/10 dark:bg-white/[0.04] dark:text-[#A1A1AA]">
                  <span className="size-1.5 rounded-full bg-[#82ADD4]" />
                  <span>
                    Canon: {BIBLE_CANONS_CONFIG[trackerCanon].shortName}
                  </span>
                </div>
              )}
            </div>

            {/* Catalog Grid */}
            {filteredPlans.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isEnrolled={enrolledTemplateIds.has(plan.id)}
                    onStartPlanAction={(p) => setSelectedPlanForEnrollment(p)}
                  />
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
        ) : activeTab === "active" ? (
          /* Active Plans Tab */
          !session ? (
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
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                <Calendar className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
                No active plans started yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                Browse the catalog to select a reading blueprint. Enroll in any
                plan to begin your daily scheduled readings.
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
                        <span>View Plan</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : activeTab === "paused" ? (
          /* Paused Plans Tab */
          !session ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-black/4 text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                <Lock className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
                Sign in to view paused plans
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                Paused reading plans are synced to your account so you can
                resume whenever ready.
              </p>
              <Link
                href="/login?redirect=/plans"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <LogIn className="size-4" />
                <span>Sign In to Scripture</span>
              </Link>
            </div>
          ) : pausedPlanInstances.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Coffee className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
                No paused plans
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                You have no paused plans. If you need to step away from reading
                without breaking your pace, pause any active plan from its
                settings.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {pausedPlanInstances.map((instance) => (
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
                            className="h-full rounded-full bg-linear-to-r from-amber-500/70 to-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/6">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleResumePlan(instance.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-black/5 px-3.5 py-1.5 text-[12px] font-medium text-black transition-all hover:bg-black/10 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                      >
                        <Play className="size-3 fill-current" />
                        <span>Resume Plan</span>
                      </button>
                      <Link
                        href={`/plans/${instance.id}`}
                        className="flex items-center gap-1.5 rounded-xl border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
                      >
                        <span>View Plan</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : /* Finished Plans Tab */
        !session ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-black/4 text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
              <Lock className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
              Sign in to view completed plans
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Your finished plans and reading history are recorded with your
              user profile.
            </p>
            <Link
              href="/login?redirect=/plans"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <LogIn className="size-4" />
              <span>Sign In to Scripture</span>
            </Link>
          </div>
        ) : finishedPlanInstances.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              <Trophy className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-black dark:text-white">
              No finished plans yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Complete all reading sessions of a plan to celebrate reaching 100%
              and record your achievement here!
            </p>
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {finishedPlanInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="isolate flex flex-col justify-between rounded-[20px] border border-black/8 bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/18 hover:bg-white hover:shadow-md dark:border-white/8 dark:bg-white/4 dark:shadow-none dark:hover:border-white/18 dark:hover:bg-white/8"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                        <Trophy className="size-3" />
                        <span>Finished</span>
                      </span>
                      <span className="text-[12px] font-semibold text-black dark:text-white">
                        100%
                      </span>
                    </div>

                    <h3 className="mt-3 text-[18px] font-medium tracking-tight text-black dark:text-white">
                      {instance.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                      {instance.dayText}
                    </p>
                    <p className="text-[12px] text-[#888888] dark:text-[#A1A1AA]">
                      All {instance.totalChapters} chapters completed
                    </p>

                    {/* Full Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                        <span>Journey Complete</span>
                        <span className="font-medium text-black dark:text-white">
                          {instance.totalChapters} / {instance.totalChapters}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/6">
                        <div
                          style={{ width: "100%" }}
                          className="h-full rounded-full bg-linear-to-r from-[#82ADD4] to-[#DDFD2C]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/6">
                    <button
                      type="button"
                      onClick={() => celebratePlanCompletion()}
                      className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-black/5 px-3 py-1.5 text-[12px] font-medium text-black transition-all hover:bg-black/10 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Celebrate 🎉</span>
                    </button>
                    <Link
                      href={`/plans/${instance.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      <span>Review Plan</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Plan Enrollment Wizard Modal */}
      {selectedPlanForEnrollment && (
        <PlanSetupModal
          isOpen={Boolean(selectedPlanForEnrollment)}
          onCloseAction={() => setSelectedPlanForEnrollment(null)}
          plan={selectedPlanForEnrollment}
          activeTrackerId={activeTrackerId || ""}
          trackerName={trackerName}
        />
      )}
    </div>
  );
}
