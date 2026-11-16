"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Bookmark, Check } from "lucide-react";
import type { UserTrackerSummary } from "@/actions/trackers";
import { enrollInGroupPlanAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupPlanEnrollModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupPlanId: string;
  planTitle: string;
  trackers: ReadonlyArray<UserTrackerSummary>;
  defaultTrackerId?: string;
};

export function GroupPlanEnrollModal({
  isOpen,
  onClose,
  groupPlanId,
  planTitle,
  trackers,
  defaultTrackerId,
}: GroupPlanEnrollModalProps) {
  const router = useRouter();
  const [selectedTrackerId, setSelectedTrackerId] = useState<string>(
    defaultTrackerId || trackers[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      onClose();
      router.push(`/plans/${res.planInstanceId}`);
      router.refresh();
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
                Enroll in Reading Plan
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

        <div className="mt-5 space-y-4">
          <p className="text-xs text-foreground-secondary leading-relaxed">
            Select which of your personal Reading Trackers will track your chapter completions for this community plan:
          </p>

          {/* Tracker Selection List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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
              Confirm & Start Reading
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
