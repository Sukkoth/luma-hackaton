"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Bookmark, Check, CheckCircle2, ArrowRight } from "lucide-react";
import type { UserTrackerSummary } from "@/actions/trackers";
import { enrollInGroupPlanAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupPlanEnrollModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupPlanId: string;
  planTitle: string;
  scheduledStartDate?: string | Date;
  trackers: ReadonlyArray<UserTrackerSummary>;
  defaultTrackerId?: string;
};

export function GroupPlanEnrollModal({
  isOpen,
  onClose,
  groupPlanId,
  planTitle,
  scheduledStartDate,
  trackers,
  defaultTrackerId,
}: GroupPlanEnrollModalProps) {
  const router = useRouter();
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(
    defaultTrackerId || trackers[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolledInstanceId, setEnrolledInstanceId] = useState<string | null>(
    null
  );

  // Compute future date status
  const { isFuture, relativeDaysStr, formattedStartDate } = useMemo(() => {
    if (!scheduledStartDate) {
      return { isFuture: false, relativeDaysStr: "", formattedStartDate: "" };
    }
    const startObj =
      scheduledStartDate instanceof Date
        ? scheduledStartDate
        : new Date(scheduledStartDate);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const isFut = startObj.getTime() > todayMidnight.getTime();
    const diffDays = Math.ceil(
      (startObj.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
    );
    const relStr =
      diffDays === 0
        ? "Starts Today"
        : diffDays === 1
          ? "Starts Tomorrow"
          : `Starts in ${diffDays} days`;
    const fmtStr = startObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return { isFuture: isFut, relativeDaysStr: relStr, formattedStartDate: fmtStr };
  }, [scheduledStartDate]);

  if (!isOpen) return null;

  async function handleEnroll() {
    if (!selectedTrackerId) {
      setError("Please select a reading tracker.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await enrollInGroupPlanAction({
        groupPlanId,
        trackerId: selectedTrackerId,
      });

      if (!res.success || !res.planInstanceId) {
        setError(res.error || "Failed to enroll in plan.");
        setIsSubmitting(false);
        return;
      }

      if (isFuture) {
        setEnrolledInstanceId(res.planInstanceId);
        setIsSubmitting(false);
        router.refresh();
      } else {
        onClose();
        router.push(`/plans/${res.planInstanceId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll in plan.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="ui-card relative w-full max-w-md p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enroll-plan-title"
      >
        {/* Post-Enrollment Success View for Scheduled Future Plans */}
        {enrolledInstanceId ? (
          <div className="py-2 text-center space-y-4">
            <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-surface-elevated text-foreground border border-border shadow-xs">
              <CheckCircle2 className="size-6 text-foreground" />
            </div>

            <div className="space-y-1">
              <h2
                id="enroll-plan-title"
                className="text-base font-bold text-foreground"
              >
                Pre-enrolled Successfully!
              </h2>
              <p className="text-xs font-medium text-foreground-secondary">
                {planTitle}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs text-muted-foreground space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Calendar className="size-3.5 text-primary" />
                <span>Cohort Starts: {formattedStartDate}</span>
                <span className="text-xs px-2 py-0.5 rounded-lg border border-border bg-card text-muted-foreground ml-auto font-medium">
                  {relativeDaysStr}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your reading tracker is linked. When Day 1 arrives, readings will automatically unlock and synchronize with your fellowship.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 justify-end">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => {
                  onClose();
                  router.refresh();
                }}
              >
                Return to Fellowship
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => {
                  onClose();
                  router.push(`/plans/${enrolledInstanceId}`);
                }}
                rightIcon={<ArrowRight className="size-3.5" />}
              >
                Preview Schedule
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-surface-elevated text-foreground border border-border">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h2
                    id="enroll-plan-title"
                    className="text-base font-semibold tracking-tight text-foreground"
                  >
                    {isFuture ? "Pre-enroll in Scheduled Plan" : "Enroll in Reading Plan"}
                  </h2>
                  <p className="text-xs text-foreground-secondary line-clamp-1">
                    {planTitle}
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

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Scheduled Future Date Notice */}
            {isFuture && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="size-4 text-primary shrink-0" />
                  <span className="font-semibold truncate">
                    Starts {formattedStartDate}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-lg border border-border bg-card text-muted-foreground">
                  {relativeDaysStr}
                </span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {isFuture
                  ? "Select which of your personal Reading Trackers will synchronize your progress once this scheduled cohort plan begins:"
                  : "Select which of your personal Reading Trackers will track your chapter completions for this community plan:"}
              </p>

              {/* Tracker Selection List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {trackers.map((t) => {
                  const isSelected = selectedTrackerId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTrackerId(t.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-surface-elevated/40 text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-surface border border-border text-xs text-foreground-secondary">
                          <Bookmark className="size-4 text-foreground" />
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-foreground block">
                            {t.name}
                          </span>
                          <span className="text-[11px] text-foreground-dim block capitalize">
                            {t.canon.replace("_", " ")} Canon
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={handleEnroll}
                >
                  {isFuture ? "Confirm Pre-enrollment" : "Confirm & Start Reading"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
