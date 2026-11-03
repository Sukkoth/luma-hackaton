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
      <div className="relative w-full max-w-md rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl transition-all dark:border-white/12 dark:bg-[#141414] sm:p-7">
        <div className="flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-xs">
            <PauseCircle className="size-6" />
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            disabled={isPending}
            className="flex size-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="size-4" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        <div className="mt-4">
          <h2
            id="paused-modal-title"
            className="text-[19px] font-semibold tracking-tight text-black dark:text-white"
          >
            Plan Paused
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
            This reading plan is paused. Check marks are locked. Resume the plan
            to start logging your readings again.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onResumeAction}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            <Play className="size-3.5 fill-current" />
            <span>Resume Plan</span>
          </button>
          <button
            type="button"
            onClick={onCloseAction}
            disabled={isPending}
            className="flex flex-1 items-center justify-center rounded-xl border border-black/10 px-4 py-2.5 text-[13px] font-medium text-black transition-all hover:bg-black/4 disabled:opacity-50 dark:border-white/10 dark:text-white dark:hover:bg-white/6"
          >
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
