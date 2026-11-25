"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  Plus,
  Minus,
  Search,
} from "lucide-react";
import * as v from "valibot";
import { READING_PLANS, isPlanCanonCompatible } from "@/data/readingPlans";
import { computeGroupPlanEndDate } from "@/lib/plans/group-plan-schedule";
import type { BibleCanon } from "@/data/bibleData";
import { ScheduleGroupPlanSchema } from "@/lib/schemas/groups";
import {
  scheduleGroupPlanAction,
  type GroupPlanSummary,
} from "@/actions/groups";
import type { GroupLateJoinPolicy } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseLocalDate } from "@/lib/timezone";

export type GroupSchedulePlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onPlanScheduled?: (plan: GroupPlanSummary) => void;
};

type WizardStep = "template" | "pacing" | "policy" | "review";

const WIZARD_STEPS: ReadonlyArray<{
  id: WizardStep;
  num: string;
  label: string;
}> = [
  { id: "template", num: "01", label: "Template" },
  { id: "pacing", num: "02", label: "Schedule" },
  { id: "policy", num: "03", label: "Cohort Policy" },
  { id: "review", num: "04", label: "Review" },
];

const WEEKDAYS = [
  { index: 0, label: "Mon" },
  { index: 1, label: "Tue" },
  { index: 2, label: "Wed" },
  { index: 3, label: "Thu" },
  { index: 4, label: "Fri" },
  { index: 5, label: "Sat" },
  { index: 6, label: "Sun" },
];

export function GroupSchedulePlanModal({
  isOpen,
  onClose,
  groupId,
  onPlanScheduled,
}: GroupSchedulePlanModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("template");
  const [maxStepReached, setMaxStepReached] = useState(0);

  // Form State
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    READING_PLANS[0]?.id || ""
  );
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dailyTarget, setDailyTarget] = useState<number>(3);
  const [activeWeekdays, setActiveWeekdays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [lateJoinPolicy, setLateJoinPolicy] = useState<
    "strict_locked" | "skip_ahead" | "backfill"
  >("skip_ahead");

  // Step 1 Search & Category Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCanon, setSelectedCanon] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPlans = useMemo(() => {
    return READING_PLANS.filter((plan) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = plan.title.toLowerCase().includes(q);
        const matchesSubtitle = plan.subtitle?.toLowerCase().includes(q);
        const matchesDesc = plan.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubtitle && !matchesDesc) return false;
      }

      // 2. Canon Compatibility Filter
      if (selectedCanon !== "all") {
        const isCompat = isPlanCanonCompatible({
          plan,
          trackerCanon: selectedCanon as BibleCanon,
        });
        if (!isCompat) return false;
      }

      // 3. Bible Section / Category Filter
      if (selectedSection !== "all") {
        if (plan.category !== selectedSection) return false;
      }

      return true;
    });
  }, [searchQuery, selectedCanon, selectedSection]);

  if (!isOpen) return null;

  const selectedPlan =
    READING_PLANS.find((p) => p.id === selectedPlanId) || READING_PLANS[0];

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === step);

  function goToStep(nextStep: WizardStep) {
    const nextIdx = WIZARD_STEPS.findIndex((s) => s.id === nextStep);
    setMaxStepReached((prev) => Math.max(prev, nextIdx));
    setStep(nextStep);
    setError(null);
  }

  function toggleWeekday(idx: number) {
    const updated = [...activeWeekdays];
    updated[idx] = !updated[idx];
    if (updated.some(Boolean)) {
      setActiveWeekdays(updated);
    }
  }

  async function handleConfirmSchedule() {
    setError(null);
    setIsSubmitting(true);

    const mask = activeWeekdays.map((b) => (b ? "1" : "0")).join("");

    const parsed = v.safeParse(ScheduleGroupPlanSchema, {
      groupId,
      planTemplateId: selectedPlanId,
      scheduledStartDate: startDate,
      dailyChapterTarget: dailyTarget,
      activeWeekdaysMask: mask,
      lateJoinPolicy,
    });

    if (!parsed.success) {
      setError(parsed.issues[0]?.message || "Invalid schedule parameters.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await scheduleGroupPlanAction({
        groupId,
        planTemplateId: parsed.output.planTemplateId,
        scheduledStartDate: parsed.output.scheduledStartDate,
        dailyChapterTarget: parsed.output.dailyChapterTarget,
        activeWeekdaysMask: parsed.output.activeWeekdaysMask,
        lateJoinPolicy: parsed.output.lateJoinPolicy,
      });

      if (!res.success) {
        setError(res.error || "Failed to schedule group plan.");
        setIsSubmitting(false);
        return;
      }

      const planTemplate = READING_PLANS.find(
        (p) => p.id === parsed.output.planTemplateId
      );

      onPlanScheduled?.({
        id: res.groupPlanId || crypto.randomUUID(),
        planTemplateId: parsed.output.planTemplateId,
        templateTitle: planTemplate?.title || "Reading Plan",
        scheduledStartDate: new Date(parsed.output.scheduledStartDate),
        status: "active",
        lateJoinPolicy: parsed.output.lateJoinPolicy as GroupLateJoinPolicy,
        dailyChapterTarget: parsed.output.dailyChapterTarget,
        activeWeekdaysMask: parsed.output.activeWeekdaysMask,
        totalChapters: planTemplate?.totalChapters || 0,
        userEnrolledInstanceId: null,
        enrolledMembersCount: 0,
        expectedEndDate: computeGroupPlanEndDate({
          scheduledStartDate: new Date(parsed.output.scheduledStartDate),
          totalChapters: planTemplate?.totalChapters || 0,
          dailyChapterTarget: parsed.output.dailyChapterTarget,
          activeWeekdaysMask: parsed.output.activeWeekdaysMask,
        }),
        createdAt: new Date(),
      });
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule plan.");
      setIsSubmitting(false);
    }
  }

  // Estimated days calculation
  const activeDaysPerWeek = activeWeekdays.filter(Boolean).length || 7;
  const chaptersPerWeek = activeDaysPerWeek * dailyTarget;
  const estimatedWeeks = Math.ceil(
    selectedPlan.totalChapters / chaptersPerWeek
  );
  const estimatedDays = Math.ceil(
    (selectedPlan.totalChapters / dailyTarget) * (7 / activeDaysPerWeek)
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="ui-card relative w-full max-w-2xl flex flex-col max-h-[92vh] shadow-2xl transition-all overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-wizard-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-surface-elevated text-foreground border border-border">
              <Calendar className="size-5 text-foreground" />
            </div>
            <div>
              <h2
                id="schedule-wizard-title"
                className="text-base font-bold tracking-tight text-foreground"
              >
                Schedule Fellowship Reading Plan
              </h2>
              <p className="text-xs text-foreground-dim">
                Multi-step curriculum setup for your community cohort.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-foreground-dim hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Wizard Steps Navigation Bar - Matching PlanSetupModal */}
        <div className="bg-surface-elevated/50 px-6 py-2.5 border-b border-border-subtle overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 w-max">
            {WIZARD_STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isPassed = idx < currentStepIndex || idx <= maxStepReached;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isPassed}
                  onClick={() => goToStep(s.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : isPassed
                        ? "bg-surface text-foreground hover:bg-surface-elevated font-medium"
                        : "opacity-40 text-foreground-dim cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-foreground-dim"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 min-h-0 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: TEMPLATE SELECTION */}
          {step === "template" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Select a Plan Template
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {filteredPlans.length} of {READING_PLANS.length}{" "}
                  curated biblical reading curricula.
                </p>
              </div>

              {/* Search Bar & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="size-3.5 text-foreground-dim absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates by title or keyword..."
                    className="w-full h-9 pl-8.5 pr-8 text-xs rounded-xl border border-border bg-surface-elevated text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-foreground transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-dim hover:text-foreground cursor-pointer"
                      aria-label="Clear search query"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Canon Filter */}
                <div className="relative shrink-0">
                  <Select
                    value={selectedCanon}
                    onValueChange={setSelectedCanon}
                  >
                    <SelectTrigger
                      aria-label="Filter by Bible Canon"
                      className="h-9 w-[150px] text-xs"
                    >
                      <SelectValue placeholder="All Canons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Canons</SelectItem>
                      <SelectItem value="protestant">
                        Protestant (66)
                      </SelectItem>
                      <SelectItem value="catholic">Catholic (73)</SelectItem>
                      <SelectItem value="eastern_orthodox">
                        Eastern Orthodox
                      </SelectItem>
                      <SelectItem value="ethiopian_orthodox">
                        Ethiopian Orthodox
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bible Section Filter */}
                <div className="relative shrink-0">
                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                  >
                    <SelectTrigger
                      aria-label="Filter by Bible Section"
                      className="h-9 w-[150px] text-xs"
                    >
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      <SelectItem value="Gospels">Gospels</SelectItem>
                      <SelectItem value="Epistles">Epistles</SelectItem>
                      <SelectItem value="Wisdom & Poetry">
                        Wisdom &amp; Poetry
                      </SelectItem>
                      <SelectItem value="Old Testament">
                        Old Testament
                      </SelectItem>
                      <SelectItem value="New Testament">
                        New Testament
                      </SelectItem>
                      <SelectItem value="Whole Bible">Whole Bible</SelectItem>
                      <SelectItem value="Chronological">
                        Chronological
                      </SelectItem>
                      <SelectItem value="Multi-Track">Multi-Track</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scrollable Templates Grid with Padded Bounds to Prevent Border Cutting */}
              <div className="max-h-[380px] overflow-y-auto p-1.5 sm:p-2 rounded-2xl border border-border/60 bg-surface-elevated/20 overscroll-contain">
                {filteredPlans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Search className="size-8 text-foreground-dim mb-2" />
                    <p className="text-sm font-semibold text-foreground">
                      No matching plans found
                    </p>
                    <p className="text-xs text-foreground-dim mt-1 max-w-xs leading-relaxed">
                      Try clearing or adjusting your search keywords, canon, or
                      section filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCanon("all");
                        setSelectedSection("all");
                      }}
                      className="mt-4 px-3.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredPlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;

                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`ui-card group relative isolate flex flex-col justify-between p-4 text-left transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-inset ring-primary/40 shadow-xs"
                              : "hover:border-border-strong hover:bg-muted/40"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                {plan.category}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {plan.totalChapters} chapters
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                              {plan.title}
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {plan.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                            <span>~{plan.recommendedDays} days standard</span>
                            {isSelected && (
                              <span className="flex items-center gap-1 font-semibold text-primary">
                                <Check className="size-3.5 stroke-[3]" />{" "}
                                Selected
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PACING & SCHEDULE */}
          {step === "pacing" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Schedule Pacing &amp; Active Days
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set start date and reading rhythm for {selectedPlan.title}.
                </p>
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="group-plan-start"
                  className="block text-[13px] font-semibold text-foreground mb-1.5"
                >
                  Cohort Start Date
                </label>
                <DatePicker
                  id="group-plan-start"
                  date={startDate}
                  onDateChange={(_, dateStr) => setStartDate(dateStr)}
                  className="w-full h-11"
                />
                <p className="mt-1 text-[11.5px] text-foreground-dim">
                  All members will see day-by-day readings synchronized from
                  this start date.
                </p>
              </div>

              {/* Daily Chapter Target Stepper - Centered */}
              <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                <div className="text-center">
                  <label className="text-[13px] font-semibold text-foreground block">
                    Daily Chapter Goal
                  </label>
                  <p className="text-[11.5px] text-foreground-dim mt-0.5">
                    Chapters to read on each active cohort reading day
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDailyTarget((prev) => Math.max(1, prev - 1))
                    }
                    disabled={dailyTarget <= 1}
                    aria-label="Decrease daily chapter goal"
                    className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <Minus className="size-4" />
                  </button>

                  <div className="h-11 px-6 min-w-[120px] rounded-xl border border-border bg-surface-elevated flex items-center justify-center text-base font-bold text-foreground shadow-2xs">
                    {dailyTarget} {dailyTarget === 1 ? "ch/day" : "ch/day"}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDailyTarget((prev) => Math.min(30, prev + 1))
                    }
                    disabled={dailyTarget >= 30}
                    aria-label="Increase daily chapter goal"
                    className="flex size-11 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground hover:bg-surface transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                <p className="text-center text-xs text-foreground-dim">
                  Estimated duration: ~{estimatedDays} days ({estimatedWeeks}{" "}
                  {estimatedWeeks === 1 ? "week" : "weeks"})
                </p>
              </div>

              {/* Reading Days Mask Pills - Centered */}
              <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
                <div className="text-center">
                  <label className="text-[13px] font-semibold text-foreground block">
                    Active Reading Days
                  </label>
                  <p className="text-[11.5px] text-foreground-dim mt-0.5">
                    {activeDaysPerWeek} active{" "}
                    {activeDaysPerWeek === 1 ? "day" : "days"} /{" "}
                    {7 - activeDaysPerWeek} rest
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {WEEKDAYS.map((day) => {
                    const isActive = activeWeekdays[day.index];
                    return (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => toggleWeekday(day.index)}
                        className={`flex size-10 sm:size-11 items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isActive
                            ? "bg-foreground text-background border-foreground shadow-xs font-bold"
                            : "bg-surface-elevated text-foreground-dim border-border hover:text-foreground hover:border-border-strong"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-[11.5px] text-foreground-dim">
                  Days turned off will be scheduled as rest/catch-up days.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: LATE-JOIN POLICY */}
          {step === "policy" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Late-Join Cohort Policy
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How should the schedule handle members who join after the plan
                  has already started?
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setLateJoinPolicy("skip_ahead")}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    lateJoinPolicy === "skip_ahead"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-surface-elevated/40 text-foreground-dim hover:text-foreground"
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-foreground mt-0.5">
                    <Sparkles className="size-4 text-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Skip Ahead (Recommended)
                    </span>
                    <p className="text-xs text-foreground-secondary leading-relaxed mt-0.5">
                      New members start directly on today&apos;s active session.
                      Past readings are omitted from their plan instance so they
                      read together with the fellowship without an overwhelming
                      backlog.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLateJoinPolicy("backfill")}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    lateJoinPolicy === "backfill"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-surface-elevated/40 text-foreground-dim hover:text-foreground"
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-foreground mt-0.5">
                    <Clock className="size-4 text-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Backfill from Day 1
                    </span>
                    <p className="text-xs text-foreground-secondary leading-relaxed mt-0.5">
                      Members receive the complete plan from Day 1 and start in
                      a &quot;behind&quot; status. They can use the catch-up
                      rebalancer to read previous chapters at their own pace.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLateJoinPolicy("strict_locked")}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    lateJoinPolicy === "strict_locked"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-surface-elevated/40 text-foreground-dim hover:text-foreground"
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-foreground mt-0.5">
                    <Shield className="size-4 text-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Strict Locked
                    </span>
                    <p className="text-xs text-foreground-secondary leading-relaxed mt-0.5">
                      Enrollment is permanently locked once the scheduled start
                      date arrives. Members who didn&apos;t enroll in time must
                      wait for the next scheduled plan.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === "review" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Review &amp; Schedule Plan
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm the parameters before publishing to the fellowship.
                </p>
              </div>

              <div className="ui-card p-5 space-y-4 rounded-2xl">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs text-foreground-dim">
                    Plan Template
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {selectedPlan.title}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs text-foreground-dim">
                    Total Chapters
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {selectedPlan.totalChapters} chapters
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs text-foreground-dim">
                    Cohort Start Date
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {parseLocalDate({ date: startDate }).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs text-foreground-dim">
                    Pacing Goal
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {dailyTarget} chapters / active day
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="text-xs text-foreground-dim">
                    Active Reading Days
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {activeWeekdays.filter(Boolean).length === 7
                      ? "Every day (7 days/week)"
                      : `${activeWeekdays.filter(Boolean).length} days / week`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground-dim">
                    Late-Join Policy
                  </span>
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {lateJoinPolicy.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
          <div>
            {currentStepIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSubmitting}
                onClick={() => goToStep(WIZARD_STEPS[currentStepIndex - 1].id)}
                leftIcon={<ChevronLeft className="size-4" />}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>

          <div>
            {currentStepIndex < WIZARD_STEPS.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => goToStep(WIZARD_STEPS[currentStepIndex + 1].id)}
                rightIcon={<ChevronRight className="size-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                onClick={handleConfirmSchedule}
                leftIcon={<Calendar className="size-4" />}
              >
                Publish Fellowship Plan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
