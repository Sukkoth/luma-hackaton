"use client";

import { useState, useTransition, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
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
  Plus,
  Upload,
} from "lucide-react";
import {
  READING_PLANS,
  type PlanFilterType,
  isPlanMatchingFilter,
  isPlanCanonCompatible,
} from "@/data/readingPlans";
import type { BibleCanon } from "@/data/bibleData";
import { useSession } from "@/lib/auth-client";
import { PlanCard } from "./plan-card";
import { PlanFilterPills } from "./plan-filter-pills";
import {
  PlanActiveBanner,
  type ActivePlanInstance,
} from "./plan-active-banner";
import { PlanSetupModal } from "./plan-setup-modal";
import { CustomPlanWizardModal } from "./custom-plan-wizard-modal";
import { ImportPlanModal } from "./import-plan-modal";
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
  customPlans?: ReadonlyArray<ReadingPlanTemplate>;
  activeTrackerId?: string;
  trackerName?: string;
  trackerCanon?: BibleCanon;
};

export function PlanCatalog({
  initialTab = "catalog",
  activePlanInstances = EMPTY_PLAN_INSTANCES,
  pausedPlanInstances = EMPTY_PLAN_INSTANCES,
  finishedPlanInstances = EMPTY_PLAN_INSTANCES,
  customPlans = [],
  activeTrackerId,
  trackerName,
  trackerCanon = "protestant",
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [allCustomPlans, setAllCustomPlans] = useState<ReadingPlanTemplate[]>(
    () => [...(customPlans || [])]
  );
  const [isCustomWizardOpen, setIsCustomWizardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral([
      "catalog",
      "active",
      "paused",
      "finished",
    ] as const).withDefault(
      initialTab === "my_plans" || initialTab === "active"
        ? "active"
        : initialTab === "paused"
          ? "paused"
          : initialTab === "finished"
            ? "finished"
            : "catalog"
    )
  );
  const [selectedFilter, setSelectedFilter] = useQueryState<PlanFilterType>(
    "filter",
    parseAsStringLiteral([
      "All",
      "Custom",
      "Fixed",
      "Customizable",
      "Old",
      "New",
      "Gospels",
      "Epistles",
      "Short",
      "Long",
      "Whole",
    ] as const).withDefault("All")
  );
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [selectedPlanForEnrollment, setSelectedPlanForEnrollment] =
    useState<ReadingPlanTemplate | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  const allTemplates: ReadingPlanTemplate[] = useMemo(
    () => [...allCustomPlans, ...READING_PLANS],
    [allCustomPlans]
  );

  const availablePlans = allTemplates.filter((plan) => {
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
      <section className="ui-card rounded-[22px] p-5 sm:p-6">
        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 md:flex-row md:items-center md:justify-between">
          {/* Tab Switcher - Segmented control */}
          <div
            data-testid="plan-catalog-tabs"
            className="flex items-center gap-1 rounded-[16px] border border-border bg-surface-elevated p-1 overflow-x-auto scrollbar-none"
          >
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setActiveTab("catalog")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Compass className="size-3.5" />
              <span>Plan Catalog ({availablePlans.length})</span>
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setActiveTab("active")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Calendar className="size-3.5" />
              <span>
                Active Plans ({session ? activePlanInstances.length : 0})
              </span>
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setActiveTab("paused")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "paused"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Pause className="size-3.5" />
              <span>
                Paused Plans ({session ? pausedPlanInstances.length : 0})
              </span>
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setActiveTab("finished")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "finished"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Trophy className="size-3.5" />
              <span>
                Finished Plans ({session ? finishedPlanInstances.length : 0})
              </span>
            </button>
          </div>

          {/* Search Input */}
          {activeTab === "catalog" && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-foreground-dim" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-[12px] border border-border bg-surface-elevated pr-8 pl-8.5 text-[12.5px] text-foreground placeholder:text-foreground-dim transition-all focus:border-border-strong focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-foreground-dim hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
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
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  disabled={!mounted}
                  onClick={() => setIsCustomWizardOpen(true)}
                  data-testid="open-custom-plan-wizard-btn"
                  className="ui-btn-primary ui-btn-sm gap-1.5 cursor-pointer disabled:pointer-events-none"
                >
                  <Plus className="size-3.5" />
                  <span>Create Custom</span>
                </button>
                <button
                  type="button"
                  disabled={!mounted}
                  onClick={() => setIsImportModalOpen(true)}
                  data-testid="open-import-plan-modal-btn"
                  className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer disabled:pointer-events-none"
                >
                  <Upload className="size-3.5" />
                  <span>Import</span>
                </button>
              </div>
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
              <div className="py-16 text-center text-foreground-secondary">
                <p className="text-[15px] font-normal">
                  No reading plans match &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedFilter("All");
                  }}
                  className="ui-btn-secondary ui-btn-sm mt-3"
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
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground-dim">
                <Lock className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-foreground">
                Sign in to view your plans
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground-secondary">
                Active schedules, daily checklists, and section checkoffs are
                saved to your account.
              </p>
              <Link
                href="/login?redirect=/plans"
                className="ui-btn-primary ui-btn-sm mt-5 gap-1.5"
              >
                <LogIn className="size-4" />
                <span>Sign In to Scripture</span>
              </Link>
            </div>
          ) : activePlanInstances.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground-secondary">
                <Calendar className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-foreground">
                No active plans started yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground-secondary">
                Browse the catalog to select a reading blueprint. Enroll in any
                plan to begin your daily scheduled readings.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("catalog")}
                className="ui-btn-primary ui-btn-sm mt-5 gap-1.5 cursor-pointer"
              >
                <Compass className="size-3.5" />
                <span>Browse Plan Catalog</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 w-full">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activePlanInstances.map((instance) => (
                  <div
                    key={instance.id}
                    className="ui-card flex flex-col justify-between p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${instance.statusColor}`}
                        >
                          {instance.status}
                        </span>
                        <span className="text-[12px] font-medium text-foreground">
                          {instance.progressPercent}%
                        </span>
                      </div>

                      <h3 className="mt-3 text-[18px] font-medium tracking-tight text-foreground">
                        {instance.title}
                      </h3>
                      <p className="mt-1 text-[13px] text-foreground-secondary">
                        Passage:{" "}
                        <strong className="font-medium text-foreground">
                          {instance.currentPassage}
                        </strong>
                      </p>
                      <p className="text-[12px] text-foreground-dim">
                        {instance.dayText}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] text-foreground-secondary">
                          <span>
                            {instance.readChapters} / {instance.totalChapters}{" "}
                            chapters
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                          <div
                            style={{ width: `${instance.progressPercent}%` }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
                      <span className="flex items-center gap-1 text-[12px] text-foreground-secondary">
                        <CheckCircle2 className="size-3.5 text-foreground-dim" />
                        <span>Active Tracker</span>
                      </span>
                      <Link
                        href={`/plans/${instance.id}`}
                        className="ui-btn-secondary px-3.5 py-1.5 text-[12px] gap-1.5"
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
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground-dim">
                <Lock className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-foreground">
                Sign in to view paused plans
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground-secondary">
                Paused reading plans are synced to your account so you can
                resume whenever ready.
              </p>
              <Link
                href="/login?redirect=/plans"
                className="ui-btn-primary ui-btn-sm mt-5 gap-1.5"
              >
                <LogIn className="size-4" />
                <span>Sign In to Scripture</span>
              </Link>
            </div>
          ) : pausedPlanInstances.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground-secondary">
                <Coffee className="size-6" />
              </div>
              <h3 className="mt-4 text-[18px] font-medium text-foreground">
                No paused plans
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground-secondary">
                You have no paused plans. If you need to step away from reading
                without breaking your pace, pause any active plan from its
                settings.
              </p>
            </div>
          ) : (
            <div className="mt-6 w-full">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pausedPlanInstances.map((instance) => (
                  <div
                    key={instance.id}
                    className="ui-card flex flex-col justify-between p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${instance.statusColor}`}
                        >
                          {instance.status}
                        </span>
                        <span className="text-[12px] font-medium text-foreground">
                          {instance.progressPercent}%
                        </span>
                      </div>

                      <h3 className="mt-3 text-[18px] font-medium tracking-tight text-foreground">
                        {instance.title}
                      </h3>
                      <p className="mt-1 text-[13px] text-foreground-secondary">
                        Passage:{" "}
                        <strong className="font-medium text-foreground">
                          {instance.currentPassage}
                        </strong>
                      </p>
                      <p className="text-[12px] text-foreground-dim">
                        {instance.dayText}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] text-foreground-secondary">
                          <span>
                            {instance.readChapters} / {instance.totalChapters}{" "}
                            chapters
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                          <div
                            style={{ width: `${instance.progressPercent}%` }}
                            className="h-full rounded-full bg-foreground-dim"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleResumePlan(instance.id)}
                        className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="size-3 fill-current" />
                        <span>Resume Plan</span>
                      </button>
                      <Link
                        href={`/plans/${instance.id}`}
                        className="ui-btn-secondary ui-btn-sm gap-1.5"
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
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground-dim">
              <Lock className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-foreground">
              Sign in to view completed plans
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground-secondary">
              Your finished plans and reading history are recorded with your
              user profile.
            </p>
            <Link
              href="/login?redirect=/plans"
              className="ui-btn-primary ui-btn-sm mt-5 gap-1.5"
            >
              <LogIn className="size-4" />
              <span>Sign In to Scripture</span>
            </Link>
          </div>
        ) : finishedPlanInstances.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-subtle text-foreground-secondary">
              <Trophy className="size-6" />
            </div>
            <h3 className="mt-4 text-[18px] font-medium text-foreground">
              No finished plans yet
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-foreground-secondary">
              Complete all reading sessions of a plan to celebrate reaching 100%
              and record your achievement here!
            </p>
          </div>
        ) : (
          <div className="mt-6 w-full">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {finishedPlanInstances.map((instance) => (
                <div
                  key={instance.id}
                  className="ui-card flex flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="ui-pill text-[11px] gap-1">
                        <Trophy className="size-3" />
                        <span>Finished</span>
                      </span>
                      <span className="text-[12px] font-semibold text-foreground">
                        100%
                      </span>
                    </div>

                    <h3 className="mt-3 text-[18px] font-medium tracking-tight text-foreground">
                      {instance.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-foreground-secondary">
                      {instance.dayText}
                    </p>
                    <p className="text-[12px] text-foreground-dim">
                      All {instance.totalChapters} chapters completed
                    </p>

                    {/* Full Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-foreground-secondary">
                        <span>Journey Complete</span>
                        <span className="font-medium text-foreground">
                          {instance.totalChapters} / {instance.totalChapters}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
                        <div
                          style={{ width: "100%" }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
                    <button
                      type="button"
                      onClick={() => celebratePlanCompletion()}
                      className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Celebrate 🎉</span>
                    </button>
                    <Link
                      href={`/plans/${instance.id}`}
                      className="ui-btn-secondary ui-btn-sm gap-1.5"
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

      {/* Custom Plan Wizard Modal */}
      {isCustomWizardOpen && (
        <CustomPlanWizardModal
          isOpen={isCustomWizardOpen}
          onCloseAction={() => setIsCustomWizardOpen(false)}
          activeTrackerCanon={trackerCanon}
          onPlanCreatedAction={(plan) => {
            setAllCustomPlans((prev) => [
              plan,
              ...prev.filter((p) => p.id !== plan.id),
            ]);
          }}
          onPlanCreatedAndStartAction={(plan) => {
            setAllCustomPlans((prev) => [
              plan,
              ...prev.filter((p) => p.id !== plan.id),
            ]);
            setSelectedPlanForEnrollment(plan);
          }}
        />
      )}

      {/* Import Plan Modal */}
      {isImportModalOpen && (
        <ImportPlanModal
          isOpen={isImportModalOpen}
          onCloseAction={() => setIsImportModalOpen(false)}
          onPlanImportedAction={(plan) => {
            setAllCustomPlans((prev) => [
              plan,
              ...prev.filter((p) => p.id !== plan.id),
            ]);
          }}
          onPlanImportedAndStartAction={(plan) => {
            setAllCustomPlans((prev) => [
              plan,
              ...prev.filter((p) => p.id !== plan.id),
            ]);
            setSelectedPlanForEnrollment(plan);
          }}
        />
      )}
    </div>
  );
}
