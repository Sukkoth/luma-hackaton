"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Users,
  X,
  Lock,
  Globe,
  Check,
  BookOpen,
  Compass,
  Sparkles,
  Clock,
} from "lucide-react";
import type { GroupPlanSummary } from "@/actions/groups";
import { joinGroupAction, enrollInGroupPlanAction } from "@/actions/groups";
import type { UserTrackerSummary } from "@/actions/trackers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GroupJoinConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description?: string;
    avatarUrl: string | null;
    memberCount: number;
    requiresApproval: boolean;
    inviteCode: string;
    activePlans: ReadonlyArray<GroupPlanSummary>;
    scheduledPlans: ReadonlyArray<GroupPlanSummary>;
  };
  trackers: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string;
  onCompleted: () => void;
};

type Step = "confirm" | "plans" | "pending_success";

export function GroupJoinConfirmModal({
  isOpen,
  onClose,
  group,
  trackers,
  activeTrackerId,
  onCompleted,
}: GroupJoinConfirmModalProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availablePlans = [...group.activePlans, ...group.scheduledPlans];

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    () => availablePlans[0]?.id || null
  );
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(() => {
    return activeTrackerId || trackers[0]?.id || "";
  });

  if (!isOpen) return null;

  async function handleConfirmJoin() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await joinGroupAction({ inviteCode: group.inviteCode });
      if (!res.success) {
        setError(res.error || "Failed to join this fellowship.");
        setIsSubmitting(false);
        return;
      }

      if (res.status === "pending_approval" || group.requiresApproval) {
        setStep("pending_success");
        setIsSubmitting(false);
        return;
      }

      // If group has plans, transition to step 2 (plan enrollment)
      if (availablePlans.length > 0) {
        setStep("plans");
        setIsSubmitting(false);
      } else {
        // No plans, finish immediately
        onCompleted();
        onClose();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to join this fellowship."
      );
      setIsSubmitting(false);
    }
  }

  async function handleEnrollInPlan() {
    if (!selectedPlanId) {
      handleSkipPlan();
      return;
    }

    if (!selectedTrackerId) {
      setError("Please select a reading tracker to log your progress.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await enrollInGroupPlanAction({
        groupPlanId: selectedPlanId,
        trackerId: selectedTrackerId,
      });

      if (!res.success) {
        setError(res.error || "Failed to enroll in the selected plan.");
        setIsSubmitting(false);
        return;
      }

      onCompleted();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to enroll in the selected plan."
      );
      setIsSubmitting(false);
    }
  }

  function handleSkipPlan() {
    onCompleted();
    onClose();
  }

  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-wizard-title"
      >
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              {step === "plans" ? (
                <BookOpen className="size-4.5" />
              ) : (
                <Users className="size-4.5" />
              )}
            </div>
            <div>
              <h2
                id="join-wizard-title"
                className="text-base font-bold tracking-tight text-foreground"
              >
                {step === "confirm" && "Join Fellowship"}
                {step === "plans" && "Choose a Reading Plan"}
                {step === "pending_success" && "Request Submitted"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === "confirm" && "Step 1 of 2: Confirm fellowship membership"}
                {step === "plans" && "Step 2 of 2: Optional plan enrollment"}
                {step === "pending_success" && "Awaiting leader approval"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── STEP 1: Confirm Joining Fellowship ── */}
        {step === "confirm" && (
          <div className="space-y-4 pt-4 animate-in fade-in duration-150">
            {/* Group Preview Card */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs font-bold text-foreground overflow-hidden">
                  {group.avatarUrl ? (
                    <Image
                      src={group.avatarUrl}
                      alt={group.name}
                      width={44}
                      height={44}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      <span>{group.memberCount} members</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {group.requiresApproval ? (
                        <>
                          <Lock className="size-3" />
                          <span>Approval required</span>
                        </>
                      ) : (
                        <>
                          <Globe className="size-3 text-primary" />
                          <span>Open access</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {group.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1 border-t border-border/50">
                  {group.description}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {group.requiresApproval
                ? "This fellowship requires leader approval. When you confirm, your request will be delivered to fellowship administrators."
                : "You are joining this fellowship community. After joining, you can choose to enroll in an active reading plan, or simply stay in the group to follow along."}
            </p>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleConfirmJoin}
                isLoading={isSubmitting}
                leftIcon={<Check className="size-4" />}
                className="rounded-xl font-semibold shadow-xs"
              >
                {group.requiresApproval ? "Request to Join" : "Confirm & Join"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Optional Plan Enrollment ── */}
        {step === "plans" && (
          <div className="space-y-4 pt-4 animate-in fade-in duration-150">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                You&apos;re now a member of {group.name}!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose an active reading plan to read in lockstep with your cohort, or skip to remain in the group without enrolling.
              </p>
            </div>

            {/* Plan Options Selector */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {availablePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isScheduled = plan.status === "scheduled";

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer flex items-start gap-3",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border bg-card hover:border-border-strong hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {isSelected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {plan.templateTitle}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0",
                            isScheduled
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                              : "bg-primary/10 text-primary border border-primary/20"
                          )}
                        >
                          {isScheduled ? "Scheduled" : "Active"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <BookOpen className="size-3" />
                          <span>{plan.totalChapters} chapters</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Compass className="size-3" />
                          <span>{plan.enrolledMembersCount} readers enrolled</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tracker selector for plan enrollment */}
            {selectedPlanId && trackers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <label className="text-xs font-semibold text-foreground block">
                  Log progress under tracker:
                </label>
                <select
                  value={selectedTrackerId}
                  onChange={(e) => setSelectedTrackerId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {trackers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.canon})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Multi-step Actions: Enroll vs Skip and remain */}
            <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleSkipPlan}
                disabled={isSubmitting}
                className="rounded-xl font-medium"
              >
                Skip for now
              </Button>

              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleEnrollInPlan}
                isLoading={isSubmitting}
                disabled={!selectedPlanId}
                leftIcon={<Sparkles className="size-4" />}
                className="rounded-xl font-semibold shadow-xs"
              >
                Enroll in Plan
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Pending Approval Confirmation ── */}
        {step === "pending_success" && (
          <div className="space-y-4 pt-4 text-center animate-in fade-in duration-150">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mx-auto">
              <Clock className="size-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Join Request Submitted!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Your request to join <strong>{group.name}</strong> has been sent to the fellowship administrators. You will be enrolled once an admin approves your request.
              </p>
            </div>

            <div className="pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => {
                  onCompleted();
                  onClose();
                }}
                className="w-full rounded-xl font-semibold shadow-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
