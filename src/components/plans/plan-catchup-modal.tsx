"use client";

import {
  AlertCircle,
  Calendar,
  Zap,
  BookOpen,
  Clock,
  TrendingUp,
  Flag,
  X,
  ArrowRight,
} from "lucide-react";
import type { PlanOverdueInfo } from "@/actions/plans";

type PlanCatchUpModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  overdueInfo: PlanOverdueInfo;
  currentPace: number;
  onExecuteShiftAction: () => void;
  onExecuteIncreasePaceAction: (newPace: number) => void;
  isPending?: boolean;
};

export function PlanCatchUpModal({
  isOpen,
  onCloseAction,
  overdueInfo,
  currentPace,
  onExecuteShiftAction,
  onExecuteIncreasePaceAction,
  isPending = false,
}: PlanCatchUpModalProps) {
  if (!isOpen) return null;

  const requiredPace = overdueInfo.requiredDailyPace || currentPace + 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="catch-up-title"
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
      <div className="relative w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl transition-all dark:border-white/12 dark:bg-[#141414] sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            <AlertCircle className="size-3.5" />
            <span>
              {overdueInfo.overdueDaysCount}{" "}
              {overdueInfo.overdueDaysCount === 1 ? "DAY" : "DAYS"} BEHIND
              SCHEDULE
            </span>
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

        {/* Title & Description */}
        <div className="mt-4">
          <h2
            id="catch-up-title"
            className="text-[20px] font-semibold tracking-tight text-black dark:text-white"
          >
            Catch Up & Adjust Schedule
          </h2>
          <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
            You have {overdueInfo.overdueChaptersCount} chapters pending
            starting from {overdueInfo.firstOverdueSessionTitle}
            {overdueInfo.firstOverdueSessionDateLabel
              ? ` (${overdueInfo.firstOverdueSessionDateLabel})`
              : ""}
            . Choose how you would like to proceed:
          </p>
        </div>

        {/* Catch-Up Options Cards */}
        <div className="mt-5 space-y-3.5">
          {/* Option 1: Shift Days to Today (RECOMMENDED) */}
          <div className="group rounded-[20px] border border-[#82ADD4]/30 bg-[#82ADD4]/5 p-4.5 transition-all dark:border-[#82ADD4]/25 dark:bg-[#82ADD4]/10">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#507ea6] dark:text-[#82ADD4]">
                <Calendar className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14.5px] font-semibold text-black dark:text-white">
                    Shift Days to Today
                  </h3>
                  <span className="rounded-md bg-[#82ADD4]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#507ea6] dark:text-[#82ADD4]">
                    RECOMMENDED
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#666666] dark:text-[#A1A1AA]">
                  Keep your pace of {currentPace} chapters/day.{" "}
                  {overdueInfo.firstOverdueSessionTitle} moves to today, and
                  your end date moves to{" "}
                  {overdueInfo.projectedEndDateLabel || "the future"}.
                </p>

                {/* Info Pills */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-lg bg-black/4 px-2.5 py-1 text-[11px] font-medium text-black/70 dark:bg-white/6 dark:text-white/70">
                    <BookOpen className="size-3 text-[#507ea6] dark:text-[#82ADD4]" />
                    <span>{currentPace} chap/day</span>
                  </div>
                  {overdueInfo.projectedEndDateLabel && (
                    <div className="inline-flex items-center gap-1 rounded-lg bg-black/4 px-2.5 py-1 text-[11px] font-medium text-black/70 dark:bg-white/6 dark:text-white/70">
                      <Clock className="size-3 text-[#507ea6] dark:text-[#82ADD4]" />
                      <span>Finishes {overdueInfo.projectedEndDateLabel}</span>
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={onExecuteShiftAction}
                  disabled={isPending}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-[12.5px] font-medium text-white shadow-xs transition-all hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <span>Apply Shift to Today</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Increase Daily Pace */}
          <div className="rounded-[20px] border border-black/8 bg-black/2 p-4.5 transition-all dark:border-white/10 dark:bg-white/3">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-black/6 text-black/70 dark:bg-white/8 dark:text-white/70">
                <Zap className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-black dark:text-white">
                  Increase Daily Pace
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[#666666] dark:text-[#A1A1AA]">
                  {overdueInfo.hasTargetEndDate &&
                  overdueInfo.targetEndDateLabel
                    ? `Increase pace to ${requiredPace} chapters/day to finish by your original deadline (${overdueInfo.targetEndDateLabel}).`
                    : `Increase pace from ${currentPace} to ${requiredPace} chapters/day to catch up faster.`}
                </p>

                {/* Info Pills */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-lg bg-black/4 px-2.5 py-1 text-[11px] font-medium text-black/70 dark:bg-white/6 dark:text-white/70">
                    <TrendingUp className="size-3 text-black/60 dark:text-white/60" />
                    <span>New Target: {requiredPace} chap/day</span>
                  </div>
                  {overdueInfo.hasTargetEndDate &&
                    overdueInfo.targetEndDateLabel && (
                      <div className="inline-flex items-center gap-1 rounded-lg bg-black/4 px-2.5 py-1 text-[11px] font-medium text-black/70 dark:bg-white/6 dark:text-white/70">
                        <Flag className="size-3 text-black/60 dark:text-white/60" />
                        <span>
                          Keep Deadline ({overdueInfo.targetEndDateLabel})
                        </span>
                      </div>
                    )}
                </div>

                {/* Increase Pace Button */}
                <button
                  type="button"
                  onClick={() => onExecuteIncreasePaceAction(requiredPace)}
                  disabled={isPending}
                  className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-[12.5px] font-medium text-black shadow-xs transition-all hover:bg-black/4 disabled:opacity-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/6"
                >
                  <span>Increase Pace to {requiredPace} / day</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
