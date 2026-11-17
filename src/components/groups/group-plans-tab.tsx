"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { GroupPlanSummary } from "@/actions/groups";
import {
  leaveGroupPlanAction,
  updateGroupPlanStatusAction,
  deleteGroupPlanAction,
} from "@/actions/groups";
import type { UserTrackerSummary } from "@/actions/trackers";
import { Button } from "@/components/ui/button";
import { GroupPlanEnrollModal } from "@/components/groups/group-plan-enroll-modal";

export type GroupPlansTabProps = {
  groupId: string;
  activePlans: ReadonlyArray<GroupPlanSummary>;
  scheduledPlans: ReadonlyArray<GroupPlanSummary>;
  completedPlans?: ReadonlyArray<GroupPlanSummary>;
  trackers: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string;
  isAdmin: boolean;
  onOpenScheduleModal: () => void;
  selectedPlanForEnroll?: GroupPlanSummary | null;
  onSelectPlanForEnroll?: (plan: GroupPlanSummary | null) => void;
};

export function GroupPlansTab({
  groupId,
  activePlans,
  scheduledPlans,
  completedPlans = [],
  trackers,
  activeTrackerId,
  isAdmin,
  onOpenScheduleModal,
  selectedPlanForEnroll: externalSelectedPlan,
  onSelectPlanForEnroll: externalSetSelectedPlan,
}: GroupPlansTabProps) {
  const router = useRouter();
  const [internalSelectedPlan, setInternalSelectedPlan] =
    useState<GroupPlanSummary | null>(null);
  const [planToLeave, setPlanToLeave] = useState<GroupPlanSummary | null>(null);
  const [isLeavingPlan, setIsLeavingPlan] = useState(false);

  // Group Plan Lifecycle state
  const [planToComplete, setPlanToComplete] =
    useState<GroupPlanSummary | null>(null);
  const [planToCancel, setPlanToCancel] =
    useState<GroupPlanSummary | null>(null);
  const [planToDelete, setPlanToDelete] =
    useState<GroupPlanSummary | null>(null);
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
        router.refresh();
      } else {
        alert(res.error || "Failed to leave group plan.");
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
        router.refresh();
      } else {
        alert(res.error || "Failed to start plan.");
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
        router.refresh();
      } else {
        alert(res.error || "Failed to complete plan.");
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
        router.refresh();
      } else {
        alert(res.error || "Failed to cancel plan.");
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
        router.refresh();
      } else {
        alert(res.error || "Failed to reopen plan.");
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
        router.refresh();
      } else {
        alert(res.error || "Failed to delete plan.");
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* ── Active Plans Section ── */}
      {activePlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-surface-elevated text-foreground border border-border mb-3 shadow-2xs">
            <BookOpen className="size-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            No Active Fellowship Plan
          </h3>
          <p className="text-xs sm:text-sm text-foreground-secondary max-w-sm mb-5 leading-relaxed">
            {isAdmin
              ? "Schedule your fellowship's reading plan so members can read scripture together on a shared cadence."
              : "No plan is currently active. Check back when cohort leaders schedule a curriculum."}
          </p>
          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenScheduleModal}
              leftIcon={<Plus className="size-3.5" />}
            >
              Schedule Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                Active Reading Plans ({activePlans.length})
              </h2>
              <p className="text-xs text-foreground-dim mt-0.5 line-clamp-1">
                Curricula currently active and synchronized across all cohort readers.
              </p>
            </div>

            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onOpenScheduleModal}
                leftIcon={<Plus className="size-4" />}
                className="shrink-0 whitespace-nowrap"
              >
                Add Plan
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {activePlans.map((plan) => {
              const isEnrolled = Boolean(plan.userEnrolledInstanceId);

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-border bg-surface p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 shadow-xs relative overflow-hidden"
                >
                  {/* Top Bar: Eyebrow & Cadence */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated px-2.5 py-1 text-[10.5px] font-bold tracking-wider uppercase text-foreground border border-border">
                        <BookOpen className="size-3 text-foreground-dim" />
                        <span>Active Curriculum</span>
                      </span>
                      <span className="text-xs font-medium text-foreground-dim">
                        Synchronized Cohort Pace
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold text-foreground border border-border">
                        <Clock className="size-3.5 text-foreground-dim" />
                        <span>{plan.dailyChapterTarget} {plan.dailyChapterTarget === 1 ? "chapter" : "chapters"} / day</span>
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPlanToComplete(plan)}
                            className="text-xs h-9 px-3"
                            leftIcon={<CheckCircle2 className="size-3.5 text-emerald-500" />}
                          >
                            Complete
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPlanToCancel(plan)}
                            className="text-xs text-foreground-dim hover:text-destructive h-9 px-2.5"
                            title="Cancel Plan"
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Title & Narrative */}
                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                      {plan.templateTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed max-w-2xl">
                      A structured curriculum of {plan.totalChapters} chapters synchronized daily across all cohort readers.
                    </p>
                  </div>

                  {/* 4-Cell Telemetry Rail (Full Width Efficient Use) */}
                  <div className="rounded-xl border border-border bg-border grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden [&>*]:bg-surface-elevated/40">
                    <div className="p-3.5 sm:p-4 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-1">
                        Daily Cadence
                      </span>
                      <span className="text-xs sm:text-base font-bold text-foreground">
                        {plan.dailyChapterTarget} ch / day
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-1">
                        Total Scope
                      </span>
                      <span className="text-xs sm:text-base font-bold text-foreground">
                        {plan.totalChapters} Chapters
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-1">
                        Cohort Readers
                      </span>
                      <span className="text-xs sm:text-base font-bold text-foreground">
                        {plan.enrolledMembersCount} {plan.enrolledMembersCount === 1 ? "reader" : "readers"}
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-1">
                        Sync Rhythm
                      </span>
                      <span className="text-xs sm:text-base font-bold text-foreground">
                        Daily Lockstep
                      </span>
                    </div>
                  </div>

                  {/* Reading Status & Action Area */}
                  {isEnrolled ? (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-t border-border/60">
                      <div className="flex items-center gap-2 text-xs text-foreground-dim">
                        <span className="size-2 rounded-full bg-foreground shrink-0" />
                        <span>You are enrolled in this plan with fellowship notes &amp; reflections enabled.</span>
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          onClick={() => setPlanToLeave(plan)}
                          className="text-foreground-dim hover:text-destructive text-xs shrink-0 whitespace-nowrap"
                          leftIcon={<LogOut className="size-4" />}
                        >
                          Leave Plan
                        </Button>

                        <Link
                          href={`/plans/${plan.userEnrolledInstanceId}`}
                          className="inline-flex items-center justify-center gap-2 h-10.5 px-4.5 text-xs sm:text-sm font-semibold rounded-xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] shadow-xs transition-all flex-1 sm:flex-none whitespace-nowrap cursor-pointer"
                        >
                          <span>Continue Reading</span>
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated/40 p-4 sm:p-5">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-semibold text-foreground">
                          Join Fellowship Reading Journey
                        </h4>
                        <p className="text-xs text-foreground-dim max-w-md leading-relaxed">
                          Synchronize your personal reader with this cohort to share daily milestones, study notes, and reflections.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto shrink-0"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                        leftIcon={<UserCheck className="size-4" />}
                      >
                        Enroll &amp; Read With Fellowship
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Upcoming Scheduled Plans ("Cohort Horizon") ── */}
      {scheduledPlans.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Upcoming Scheduled Plans ({scheduledPlans.length})
            </h3>
            <p className="text-xs text-foreground-dim mt-0.5">
              Curricula scheduled to launch on synchronized start dates for this fellowship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scheduledPlans.map((plan) => {
              const startDateObj = new Date(plan.scheduledStartDate);
              const startDateStr = startDateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const nowMidnight = new Date();
              nowMidnight.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil(
                (startDateObj.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24)
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
                  className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between gap-4 hover:border-border-strong transition-all shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-foreground-dim font-medium">
                        <Calendar className="size-3.5" />
                        <span>Starts {startDateStr}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-foreground-secondary px-2 py-0.5 rounded-md bg-surface-elevated border border-border">
                        {countdownLabel}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {plan.templateTitle}
                      </h4>
                      <p className="text-xs text-foreground-dim mt-1">
                        {plan.totalChapters} chapters • {plan.dailyChapterTarget} chapters / day
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <span className="text-foreground-dim font-medium">
                      {plan.enrolledMembersCount}{" "}
                      {plan.enrolledMembersCount === 1 ? "reader waiting" : "readers waiting"}
                    </span>

                    {plan.userEnrolledInstanceId ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-elevated border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground">
                          <Check className="size-3 text-foreground" />
                          Pre-enrolled
                        </span>
                        <Link
                          href={`/plans/${plan.userEnrolledInstanceId}`}
                          className="text-xs text-foreground-dim hover:text-foreground font-medium transition-colors inline-flex items-center gap-0.5"
                        >
                          <span>Preview</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                      >
                        Pre-enroll
                      </Button>
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
                        leftIcon={<Play className="size-3 text-emerald-500" />}
                        className="text-xs h-9 px-3 flex-1"
                      >
                        Start Now
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => setPlanToCancel(plan)}
                        className="text-xs text-foreground-dim hover:text-destructive h-9 px-2.5"
                        title="Cancel Schedule"
                      >
                        <XCircle className="size-3.5" />
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
      {completedPlans.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Completed &amp; Archived Plans ({completedPlans.length})
            </h3>
            <p className="text-xs text-foreground-dim mt-0.5">
              Previous curricula that were concluded or archived for this fellowship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedPlans.map((plan) => {
              const isCompleted = plan.status === "completed";
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between gap-4 opacity-90 hover:opacity-100 transition-all shadow-2xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-surface-elevated text-foreground-dim border border-border"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <Archive className="size-3" />
                        )}
                        <span>{isCompleted ? "Completed" : "Cancelled"}</span>
                      </span>
                      <span className="text-[11px] text-foreground-dim">
                        {plan.totalChapters} Chapters
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-foreground line-clamp-1">
                        {plan.templateTitle}
                      </h4>
                      <p className="text-xs text-foreground-dim mt-0.5">
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
                        className="text-xs h-9 px-3"
                      >
                        Reopen
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdatingStatus}
                        onClick={() => setPlanToDelete(plan)}
                        className="text-xs text-foreground-dim hover:text-destructive h-9 px-2.5"
                        title="Delete Plan"
                      >
                        <Trash2 className="size-3.5" />
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
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-surface-elevated text-foreground border border-border mx-auto shadow-2xs">
              <LogOut className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Leave Reading Plan?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Are you sure you want to unenroll from &ldquo;{planToLeave.templateTitle}&rdquo;? Your reading progress will be unlinked from the fellowship leaderboard. Your personal reading tracker will remain intact.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlanToLeave(null)}
                disabled={isLeavingPlan}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isLeavingPlan}
                onClick={handleConfirmLeavePlan}
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
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Complete Reading Plan?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Mark &ldquo;{planToComplete.templateTitle}&rdquo; as completed for this fellowship? It will move to the Completed &amp; Archived section.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setPlanToComplete(null)}
                disabled={isUpdatingStatus}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isUpdatingStatus}
                onClick={handleConfirmCompletePlan}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
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
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Cancel Reading Plan?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Are you sure you want to cancel &ldquo;{planToCancel.templateTitle}&rdquo;? It will be deactivated and moved to archived plans.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setPlanToCancel(null)}
                disabled={isUpdatingStatus}
                className="flex-1"
              >
                Keep Active
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
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
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto">
              <Trash2 className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Permanently Delete Plan?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Are you sure you want to delete &ldquo;{planToDelete.templateTitle}&rdquo;? This will remove all associated cohort enrollment records.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setPlanToDelete(null)}
                disabled={isUpdatingStatus}
                className="flex-1"
              >
                Keep Plan
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
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
