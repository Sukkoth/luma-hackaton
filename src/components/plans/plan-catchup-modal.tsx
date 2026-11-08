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
      <div className="ui-card relative w-full max-w-lg p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
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
            className="flex size-8 items-center justify-center rounded-xl text-foreground-dim transition-colors hover:bg-surface-elevated hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Title & Description */}
        <div className="mt-4">
          <h2
            id="catch-up-title"
            className="text-[20px] font-bold tracking-tight text-foreground"
          >
            Catch Up & Adjust Schedule
          </h2>
          <p className="mt-1 text-[13px] text-foreground-secondary">
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
          <div className="ui-card-elevated p-4.5">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
                <Calendar className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14.5px] font-bold text-foreground">
                    Shift Days to Today
                  </h3>
                  <span className="ui-pill text-[9px] uppercase tracking-wider">
                    RECOMMENDED
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground-secondary">
                  Keep your pace of {currentPace} chapters/day.{" "}
                  {overdueInfo.firstOverdueSessionTitle} moves to today, and
                  your end date moves to{" "}
                  {overdueInfo.projectedEndDateLabel || "the future"}.
                </p>

                {/* Info Pills */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="ui-pill">
                    <BookOpen className="size-3 text-foreground" />
                    <span>{currentPace} chap/day</span>
                  </div>
                  {overdueInfo.projectedEndDateLabel && (
                    <div className="ui-pill">
                      <Clock className="size-3 text-foreground" />
                      <span>Finishes {overdueInfo.projectedEndDateLabel}</span>
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={onExecuteShiftAction}
                  disabled={isPending}
                  className="ui-btn-primary ui-btn-sm mt-3.5 w-full gap-2"
                >
                  <span>Apply Shift to Today</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Increase Daily Pace */}
          <div className="ui-card-elevated p-4.5">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
                <Zap className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-bold text-foreground">
                  Increase Daily Pace
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground-secondary">
                  {overdueInfo.hasTargetEndDate &&
                  overdueInfo.targetEndDateLabel
                    ? `Increase pace to ${requiredPace} chapters/day to finish by your original deadline (${overdueInfo.targetEndDateLabel}).`
                    : `Increase pace from ${currentPace} to ${requiredPace} chapters/day to catch up faster.`}
                </p>

                {/* Info Pills */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="ui-pill">
                    <TrendingUp className="size-3 text-foreground" />
                    <span>New Target: {requiredPace} chap/day</span>
                  </div>
                  {overdueInfo.hasTargetEndDate &&
                    overdueInfo.targetEndDateLabel && (
                      <div className="ui-pill">
                        <Flag className="size-3 text-foreground" />
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
                  className="ui-btn-secondary ui-btn-sm mt-3.5 w-full gap-2"
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
