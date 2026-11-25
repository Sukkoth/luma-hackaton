"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  ArrowRight,
  UserCheck,
  Plus,
  BookOpen,
  Calendar,
  LogOut,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Trash2,
  Archive,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import type { GroupPlanSummary, LeaderboardEntry } from "@/actions/groups";
import {
  leaveGroupPlanAction,
  updateGroupPlanStatusAction,
  deleteGroupPlanAction,
} from "@/actions/groups";
import type { UserTrackerSummary } from "@/actions/trackers";
import { Button } from "@/components/ui/button";
import { PlanLeaderboardPanel } from "@/components/groups/plan-leaderboard-panel";
import { GROUP_PLAN_GRACE_MS } from "@/lib/plans/group-plan-schedule";
import { toast } from "@/components/ui/sonner";
import { parseLocalDate } from "@/lib/timezone";

const GroupPlanEnrollModal = dynamic(
  () =>
    import("@/components/groups/group-plan-enroll-modal").then(
      (mod) => mod.GroupPlanEnrollModal
    ),
  { ssr: false }
);

type LifecycleFilter = "all" | "active" | "scheduled" | "archive";

function PlanLifecycleStepper({
  status,
}: {
  status: GroupPlanSummary["status"];
}) {
  const isCancelled = status === "cancelled";
  const steps: ReadonlyArray<{
    key: "scheduled" | "active" | "completed";
    label: string;
  }> = [
    { key: "scheduled", label: "Scheduled" },
    { key: "active", label: "Active" },
    { key: "completed", label: isCancelled ? "Cancelled" : "Completed" },
  ];
  const currentIdx = status === "scheduled" ? 0 : status === "active" ? 1 : 2;

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 border border-border/60 px-2.5 py-1 text-[11px]"
      aria-label={`Plan lifecycle status: ${status}`}
    >
      {steps.map((step, idx) => {
        const isCurrent = idx === currentIdx;
        const isDone = idx < currentIdx && !isCancelled;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            {idx > 0 ? (
              <span className="text-muted-foreground/50" aria-hidden="true">
                →
              </span>
            ) : null}
            <span
              className={
                isCurrent
                  ? isCancelled
                    ? "font-semibold text-destructive"
                    : "font-semibold text-primary"
                  : isDone
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/70"
              }
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type GroupPlansTabProps = {
  groupId: string;
  activePlans: ReadonlyArray<GroupPlanSummary>;
  scheduledPlans: ReadonlyArray<GroupPlanSummary>;
  completedPlans?: ReadonlyArray<GroupPlanSummary>;
  leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>>;
  currentUserHideProgress: boolean;
  currentUserPrivacyUpdatedAt?: string | null;
  trackers: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string;
  isAdmin: boolean;
  isMember?: boolean;
  onOpenScheduleModal: () => void;
  selectedPlanForEnroll?: GroupPlanSummary | null;
  onSelectPlanForEnroll?: (plan: GroupPlanSummary | null) => void;
  onJoinGroupClick?: () => void;
};

export function GroupPlansTab({
  groupId,
  activePlans,
  scheduledPlans,
  completedPlans = [],
  leaderboardsByPlanId,
  currentUserHideProgress,
  currentUserPrivacyUpdatedAt,
  trackers,
  activeTrackerId,
  isAdmin,
  isMember = true,
  onOpenScheduleModal,
  selectedPlanForEnroll: externalSelectedPlan,
  onSelectPlanForEnroll: externalSetSelectedPlan,
  onJoinGroupClick,
}: GroupPlansTabProps) {
  const router = useRouter();
  const [lifecycleFilter, setLifecycleFilter] =
    useState<LifecycleFilter>("all");
  const [mountTimestamp] = useState(() => Date.now());
  const [internalSelectedPlan, setInternalSelectedPlan] =
    useState<GroupPlanSummary | null>(null);
  const [planToLeave, setPlanToLeave] = useState<GroupPlanSummary | null>(null);
  const [isLeavingPlan, setIsLeavingPlan] = useState(false);

  // Group Plan Lifecycle state
  const [planToComplete, setPlanToComplete] = useState<GroupPlanSummary | null>(
    null
  );
  const [planToCancel, setPlanToCancel] = useState<GroupPlanSummary | null>(
    null
  );
  const [planToDelete, setPlanToDelete] = useState<GroupPlanSummary | null>(
    null
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const selectedPlanForEnroll =
    externalSelectedPlan !== undefined
      ? externalSelectedPlan
      : internalSelectedPlan;
  const setSelectedPlanForEnroll =
    externalSetSelectedPlan || setInternalSelectedPlan;

  async function handleConfirmLeavePlan() {
    if (!planToLeave) return;
    setIsLeavingPlan(true);
    try {
      const res = await leaveGroupPlanAction({ groupPlanId: planToLeave.id });
      if (res.success) {
        setPlanToLeave(null);
        toast.success("Left group plan.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to leave group plan.");
      }
    } finally {
      setIsLeavingPlan(false);
    }
  }

  async function handleStartPlanNow(plan: GroupPlanSummary) {
    setIsUpdatingStatus(true);
    try {
      const res = await updateGroupPlanStatusAction({
        groupPlanId: plan.id,
        status: "active",
      });
      if (res.success) {
        toast.success("Plan started.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to start plan.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleConfirmCompletePlan() {
    if (!planToComplete) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateGroupPlanStatusAction({
        groupPlanId: planToComplete.id,
        status: "completed",
      });
      if (res.success) {
        setPlanToComplete(null);
        toast.success("Plan marked as completed.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to complete plan.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleConfirmCancelPlan() {
    if (!planToCancel) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateGroupPlanStatusAction({
        groupPlanId: planToCancel.id,
        status: "cancelled",
      });
      if (res.success) {
        setPlanToCancel(null);
        toast.success("Plan cancelled.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to cancel plan.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleReopenPlan(plan: GroupPlanSummary) {
    setIsUpdatingStatus(true);
    try {
      const res = await updateGroupPlanStatusAction({
        groupPlanId: plan.id,
        status: "active",
      });
      if (res.success) {
        toast.success("Plan reopened.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to reopen plan.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleConfirmDeletePlan() {
    if (!planToDelete) return;
    setIsUpdatingStatus(true);
    try {
      const res = await deleteGroupPlanAction({
        groupPlanId: planToDelete.id,
      });
      if (res.success) {
        setPlanToDelete(null);
        toast.success("Plan deleted.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete plan.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const totalPlansCount =
    activePlans.length + scheduledPlans.length + completedPlans.length;
  const showActive = lifecycleFilter === "all" || lifecycleFilter === "active";
  const showScheduled =
    lifecycleFilter === "all" || lifecycleFilter === "scheduled";
  const showArchive =
    lifecycleFilter === "all" || lifecycleFilter === "archive";

  return (
    <div className="space-y-8">
      {/* ── Plan Lifecycle Filter & Schedule Header ── */}
      {totalPlansCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter plans by lifecycle stage"
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 overflow-x-auto max-w-full"
          >
            {(
              [
                { key: "all", label: `All (${totalPlansCount})` },
                { key: "active", label: `Active (${activePlans.length})` },
                {
                  key: "scheduled",
                  label: `Scheduled (${scheduledPlans.length})`,
                },
                {
                  key: "archive",
                  label: `Archive (${completedPlans.length})`,
                },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={lifecycleFilter === item.key}
                onClick={() => setLifecycleFilter(item.key)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  lifecycleFilter === item.key
                    ? "bg-card text-foreground shadow-2xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenScheduleModal}
              leftIcon={<Plus className="size-3.5" />}
              className="self-start sm:self-auto shrink-0 whitespace-nowrap"
            >
              Add Plan
            </Button>
          )}
        </div>
      )}

      {/* ── Active Plans Section ── */}
      {showActive && activePlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3 shadow-2xs">
            <BookOpen className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            No Active Fellowship Plan
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
            {isAdmin
              ? "Schedule your fellowship's reading plan so members can read scripture together on a shared cadence."
              : "No plan is currently active. Check back when cohort leaders schedule a curriculum."}
          </p>
          {isAdmin && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onOpenScheduleModal}
              leftIcon={<Plus className="size-3.5" />}
            >
              Schedule Plan
            </Button>
          )}
        </div>
      ) : showActive && activePlans.length > 0 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              Active Reading Plans ({activePlans.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              Curricula currently active with dedicated cohort leaderboards.
            </p>
          </div>

          <div className="space-y-5">
            {activePlans.map((plan) => {
              const isEnrolled = Boolean(plan.userEnrolledInstanceId);
              const planEntries = leaderboardsByPlanId[plan.id] || [];

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 shadow-xs relative overflow-hidden transition-all hover:border-border-strong"
                >
                  {/* Top Bar: Lifecycle & Cadence */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                        <BookOpen className="size-3.5" />
                        <span>Active Curriculum</span>
                      </span>
                      <PlanLifecycleStepper status={plan.status} />
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold text-foreground border border-border/70 shadow-2xs">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>
                          {plan.dailyChapterTarget}{" "}
                          {plan.dailyChapterTarget === 1
                            ? "chapter"
                            : "chapters"}{" "}
                          / day
                        </span>
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPlanToComplete(plan)}
                            className="text-xs h-8 px-2.5 rounded-lg"
                            leftIcon={
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            }
                          >
                            Complete
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPlanToCancel(plan)}
                            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5 rounded-lg"
                            leftIcon={<XCircle className="size-3.5" />}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Title & Narrative */}
                  <div className="space-y-1.5">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {plan.templateTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      A structured curriculum of {plan.totalChapters} chapters
                      synchronized daily across all cohort readers.
                    </p>
                  </div>

                  {/* Fluid Metric Horizon Strip (Airy, non-boxed cadence metrics) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Daily Pace
                      </span>
                      <div className="text-sm sm:text-base font-bold text-foreground flex items-baseline gap-1">
                        <span>{plan.dailyChapterTarget}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          ch / day
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Total Scope
                      </span>
                      <div className="text-sm sm:text-base font-bold text-foreground flex items-baseline gap-1">
                        <span>{plan.totalChapters}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          chapters
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Cohort Readers
                      </span>
                      <div className="text-sm sm:text-base font-bold text-primary flex items-baseline gap-1">
                        <span>{plan.enrolledMembersCount}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {plan.enrolledMembersCount === 1
                            ? "reader"
                            : "readers"}{" "}
                          in sync
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Target End Date
                      </span>
                      <div className="text-sm sm:text-base font-bold text-foreground">
                        {new Date(plan.expectedEndDate).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Wrap-up / Grace Period Notice when schedule end date has passed */}
                  {(() => {
                    const endTime = new Date(plan.expectedEndDate).getTime();
                    if (mountTimestamp <= endTime) return null;
                    const daysLeft = Math.max(
                      1,
                      Math.ceil(
                        (endTime + GROUP_PLAN_GRACE_MS - mountTimestamp) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-xs">
                        <div className="flex items-center gap-2 text-foreground">
                          <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>
                            Scheduled reading ended • Auto-completes in{" "}
                            <strong>
                              {daysLeft} {daysLeft === 1 ? "day" : "days"}
                            </strong>
                            {isAdmin
                              ? ", or mark complete now."
                              : " (grace window open for finishing chapters)."}
                          </span>
                        </div>
                        {isAdmin ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPlanToComplete(plan)}
                            leftIcon={
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            }
                            className="h-8 text-xs shrink-0 self-start sm:self-auto"
                          >
                            Mark Complete
                          </Button>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Reading Status & Action Area */}
                  {isEnrolled ? (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-t border-border/60">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />
                        <span>
                          You are enrolled in this plan with fellowship notes
                          &amp; reflections enabled.
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPlanToLeave(plan)}
                          className="text-muted-foreground hover:text-destructive text-xs shrink-0 whitespace-nowrap rounded-xl"
                          leftIcon={<LogOut className="size-3.5" />}
                        >
                          Leave Plan
                        </Button>

                        <Link
                          href={`/plans/${plan.userEnrolledInstanceId}`}
                          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-xs transition-all flex-1 sm:flex-none whitespace-nowrap cursor-pointer"
                        >
                          <span>Continue Reading</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : isMember ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          Join Fellowship Reading Journey
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                          Synchronize your personal reader with this cohort to
                          share daily milestones, study notes, and reflections.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="w-full sm:w-auto shrink-0 rounded-xl font-semibold shadow-xs"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                        leftIcon={<UserCheck className="size-3.5" />}
                      >
                        Enroll &amp; Read With Fellowship
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-4.5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          Curriculum Open to Fellowship Members
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                          Join this fellowship to follow this reading plan, sync
                          your chapter progress, and read together with the
                          community.
                        </p>
                      </div>

                      {onJoinGroupClick && (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={onJoinGroupClick}
                          leftIcon={<UserPlus className="size-3.5" />}
                          className="w-full sm:w-auto shrink-0 font-semibold shadow-xs rounded-xl"
                        >
                          Join Fellowship to Read
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Per-Plan Leaderboard */}
                  <PlanLeaderboardPanel
                    groupId={groupId}
                    planTitle={plan.templateTitle}
                    entries={planEntries}
                    currentUserHideProgress={currentUserHideProgress}
                    currentUserPrivacyUpdatedAt={currentUserPrivacyUpdatedAt}
                    isMember={isMember}
                    defaultExpanded={activePlans.length === 1}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── Upcoming Scheduled Plans ("Cohort Horizon") ── */}
      {showScheduled && scheduledPlans.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Upcoming Scheduled Plans ({scheduledPlans.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Curricula scheduled to launch on synchronized start dates for this
              fellowship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scheduledPlans.map((plan) => {
              const startDateObj = parseLocalDate({
                date: plan.scheduledStartDate,
              });
              const startDateStr = startDateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const nowMidnight = new Date();
              nowMidnight.setHours(0, 0, 0, 0);
              const diffDays = Math.round(
                (startDateObj.getTime() - nowMidnight.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const countdownLabel =
                diffDays <= 0
                  ? "Starts Today"
                  : diffDays === 1
                    ? "Starts Tomorrow"
                    : `In ${diffDays} days`;

              return (
                <div
                  key={plan.id}
                  className="ui-card p-4 sm:p-5 flex flex-col justify-between gap-4 hover:border-border-strong transition-all shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Calendar className="size-3.5" />
                        <span>Starts {startDateStr}</span>
                      </span>
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                        {countdownLabel}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {plan.templateTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.totalChapters} chapters •{" "}
                        {plan.dailyChapterTarget} ch / day
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground font-medium">
                      {plan.enrolledMembersCount}{" "}
                      {plan.enrolledMembersCount === 1
                        ? "reader waiting"
                        : "readers waiting"}
                    </span>

                    {plan.userEnrolledInstanceId ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-muted border border-border px-2 py-0.5 text-xs font-semibold text-foreground">
                          <Check className="size-3 text-primary" />
                          Pre-enrolled
                        </span>
                        <Link
                          href={`/plans/${plan.userEnrolledInstanceId}`}
                          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors inline-flex items-center gap-0.5"
                        >
                          <span>Preview</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    ) : isMember ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                      >
                        Pre-enroll
                      </Button>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Scheduled
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-2.5 border-t border-border/40">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStartPlanNow(plan)}
                        leftIcon={
                          <Play className="size-3 text-emerald-600 dark:text-emerald-400" />
                        }
                        className="text-xs h-8 px-3 flex-1"
                      >
                        Start Now
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => setPlanToCancel(plan)}
                        leftIcon={<XCircle className="size-3.5" />}
                        className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Completed & Archived Plans ── */}
      {showArchive && completedPlans.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Completed &amp; Archived Plans ({completedPlans.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Previous curricula that were concluded or archived for this
              fellowship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedPlans.map((plan) => {
              const isCompleted = plan.status === "completed";
              return (
                <div
                  key={plan.id}
                  className="ui-card p-4 sm:p-5 flex flex-col justify-between gap-4 opacity-90 hover:opacity-100 transition-all shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <Archive className="size-3" />
                        )}
                        <span>{isCompleted ? "Completed" : "Cancelled"}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {plan.totalChapters} Chapters
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-foreground line-clamp-1">
                        {plan.templateTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.enrolledMembersCount}{" "}
                        {plan.enrolledMembersCount === 1
                          ? "reader participated"
                          : "readers participated"}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => handleReopenPlan(plan)}
                        leftIcon={<RotateCcw className="size-3" />}
                        className="text-xs h-8 px-3"
                      >
                        Reopen
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => setPlanToDelete(plan)}
                        leftIcon={<Trash2 className="size-3.5" />}
                        className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {selectedPlanForEnroll && (
        <GroupPlanEnrollModal
          isOpen={true}
          onClose={() => setSelectedPlanForEnroll(null)}
          groupId={groupId}
          groupPlanId={selectedPlanForEnroll.id}
          planTitle={selectedPlanForEnroll.templateTitle}
          scheduledStartDate={selectedPlanForEnroll.scheduledStartDate}
          trackers={trackers}
          defaultTrackerId={activeTrackerId}
        />
      )}

      {/* Leave Plan Confirmation Modal */}
      {planToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto">
              <LogOut className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Leave Reading Plan?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to unenroll from &ldquo;
              {planToLeave.templateTitle}&rdquo;? Your reading progress will be
              unlinked from the fellowship leaderboard. Your personal reading
              tracker will remain intact.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlanToLeave(null)}
                disabled={isLeavingPlan}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isLeavingPlan}
                onClick={handleConfirmLeavePlan}
                className="flex-1"
              >
                Confirm &amp; Leave
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Plan Confirmation Modal */}
      {planToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Complete Reading Plan?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mark &ldquo;{planToComplete.templateTitle}&rdquo; as completed for
              this fellowship? It will move to the Completed &amp; Archived
              section.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlanToComplete(null)}
                disabled={isUpdatingStatus}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={handleConfirmCompletePlan}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-transparent"
              >
                Confirm Complete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Plan Confirmation Modal */}
      {planToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Cancel Reading Plan?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to cancel &ldquo;
              {planToCancel.templateTitle}&rdquo;? It will be deactivated and
              moved to archived plans.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlanToCancel(null)}
                disabled={isUpdatingStatus}
                className="flex-1"
              >
                Keep Active
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={handleConfirmCancelPlan}
                className="flex-1"
              >
                Cancel Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto">
              <Trash2 className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Permanently Delete Plan?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete &ldquo;
              {planToDelete.templateTitle}&rdquo;? This will remove all
              associated cohort enrollment records.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlanToDelete(null)}
                disabled={isUpdatingStatus}
                className="flex-1"
              >
                Keep Plan
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isUpdatingStatus}
                onClick={handleConfirmDeletePlan}
                className="flex-1"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
