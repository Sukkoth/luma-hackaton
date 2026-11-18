"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Clock, ShieldAlert, AlertCircle } from "lucide-react";
import { toggleLeaderboardPrivacyAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupVisibilityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentHideProgress: boolean;
  privacyUpdatedAt?: string | null;
  onSuccess?: ({
    hideProgress,
    privacyUpdatedAt,
  }: {
    hideProgress: boolean;
    privacyUpdatedAt: string;
  }) => void;
};

export function GroupVisibilityModal({
  isOpen,
  onClose,
  groupId,
  currentHideProgress,
  privacyUpdatedAt,
  onSuccess,
}: GroupVisibilityModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mountTimestamp] = useState(() => Date.now());

  if (!isOpen) return null;

  // 24-hour rate limit computation
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const lastUpdatedTime = privacyUpdatedAt ? new Date(privacyUpdatedAt).getTime() : 0;
  const elapsed = mountTimestamp - lastUpdatedTime;
  const isCooldownActive = elapsed < COOLDOWN_MS;
  const remainingMs = COOLDOWN_MS - elapsed;
  const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutesLeft = Math.max(
    1,
    Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
  );

  async function handleConfirm() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextHideProgress = !currentHideProgress;
      const res = await toggleLeaderboardPrivacyAction({
        groupId,
        hideProgress: nextHideProgress,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update visibility.");
        setIsSubmitting(false);
        return;
      }

      const updatedTime = res.privacyUpdatedAt || new Date().toISOString();
      if (onSuccess) {
        onSuccess({
          hideProgress: nextHideProgress,
          privacyUpdatedAt: updatedTime,
        });
      }
      setIsSubmitting(false);
      onClose();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md p-5 sm:p-6 shadow-2xl transition-all border border-border bg-card rounded-2xl max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="visibility-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>

        {isCooldownActive ? (
          /* Cooldown Locked View */
          <div className="space-y-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <Clock className="size-5" />
            </div>

            <div>
              <h3
                id="visibility-modal-title"
                className="text-base font-bold text-foreground"
              >
                Visibility Cooldown Active
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                To protect fellowship accountability and prevent gaming reading records,
                visibility can only be changed once every 24 hours.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-foreground">
                <span className="text-muted-foreground">Current status</span>
                <span className="font-semibold">
                  {currentHideProgress ? "Hidden (Anonymous)" : "Visible to Cohort"}
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground">
                <span className="text-muted-foreground">Next change allowed in</span>
                <span className="font-semibold tabular-nums text-primary">
                  {hoursLeft}h {minutesLeft}m
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Understood
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation View */
          <div className="space-y-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              {currentHideProgress ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </div>

            <div>
              <h3
                id="visibility-modal-title"
                className="text-base font-bold text-foreground"
              >
                {currentHideProgress
                  ? "Make Your Progress Visible?"
                  : "Hide Your Reading Progress?"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {currentHideProgress
                  ? "Your name, avatar, and completed chapters will be visible to fellow cohort readers, and you will see everyone's actual names on the leaderboard."
                  : "Your name and avatar will be replaced with 'Anonymous Reader' on the fellowship leaderboard."}
              </p>
            </div>

            {/* Reciprocal Anonymity & Rate Limit Notice */}
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs text-muted-foreground">
              {!currentHideProgress ? (
                <div className="flex items-start gap-2">
                  <ShieldAlert className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-foreground">
                      Reciprocal Anonymity:
                    </span>{" "}
                    While your progress is hidden, other readers will also appear as
                    anonymous to you.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <Eye className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-semibold text-foreground">
                      Cohort Transparency:
                    </span>{" "}
                    You and other readers will be able to see each other&apos;s reading
                    milestones and progress.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 pt-1 border-t border-border/60">
                <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="leading-relaxed text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    24-hour lock:
                  </span>{" "}
                  Once updated, you cannot change this setting again for 24 hours.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                <AlertCircle className="size-4 text-destructive shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
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
                variant="default"
                size="sm"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : currentHideProgress
                  ? "Confirm & Make Visible"
                  : "Confirm & Hide Progress"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
