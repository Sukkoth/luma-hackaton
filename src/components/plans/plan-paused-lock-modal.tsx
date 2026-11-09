"use client";

import { PauseCircle, Play, X } from "lucide-react";

type PlanPausedLockModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  onResumeAction: () => void;
  isPending?: boolean;
};

export function PlanPausedLockModal({
  isOpen,
  onCloseAction,
  onResumeAction,
  isPending = false,
}: PlanPausedLockModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paused-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isPending) onCloseAction();
        }}
      />

      {/* Modal Dialog Content */}
      <div className="ui-card relative w-full max-w-md p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-warning/20 bg-warning/10 text-warning shadow-xs">
            <PauseCircle className="size-6" />
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            disabled={isPending}
            className="flex size-8 items-center justify-center rounded-xl text-foreground-dim transition-colors hover:bg-surface-elevated hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <div className="mt-4">
          <h2
            id="paused-modal-title"
            className="text-[19px] font-bold tracking-tight text-foreground"
          >
            Plan Paused
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-secondary">
            This reading plan is paused. Check marks are locked. Resume the plan
            to start logging your readings again.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onResumeAction}
            disabled={isPending}
            className="ui-btn-primary ui-btn-sm flex-1 gap-2"
          >
            <Play className="size-3.5 fill-current" />
            <span>Resume Plan</span>
          </button>
          <button
            type="button"
            onClick={onCloseAction}
            disabled={isPending}
            className="ui-btn-secondary ui-btn-sm flex-1"
          >
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
