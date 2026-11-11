"use client";

type PlanSpeedometerGaugeProps = {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  mode: "scheduled" | "flexible";
  dailyTarget?: number;
  title?: string;
};

export function PlanSpeedometerGauge({
  progressPercent,
  completedChapters,
  totalChapters,
  mode,
  dailyTarget,
  title = "Journey Progress",
}: PlanSpeedometerGaugeProps) {
  const ARC_LENGTH = 494.28;
  const clampedPercent = Math.min(100, Math.max(0, progressPercent));
  const strokeDashoffset = ARC_LENGTH - (ARC_LENGTH * clampedPercent) / 100;
  const remainingChapters = Math.max(0, totalChapters - completedChapters);
  const isCompleted = clampedPercent === 100;

  return (
    <div className="ui-card relative flex flex-col justify-between overflow-hidden p-5 sm:p-6">
      {/* Card Header (Donezo style) */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-[15px] font-bold tracking-tight text-foreground">
          {title}
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${
            isCompleted
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "bg-surface-elevated text-foreground-secondary border border-border"
          }`}
        >
          {isCompleted
            ? "Completed"
            : mode === "flexible"
              ? "Self-Paced"
              : "Active"}
        </span>
      </div>

      {/* SVG Speedometer Gauge */}
      <div className="relative my-2 flex w-full items-center justify-center">
        <div className="relative w-full max-w-[260px] sm:max-w-[280px]">
          <svg
            viewBox="0 0 320 230"
            className="size-full overflow-visible"
            aria-hidden="true"
          >
            {/* Background Track Arc */}
            <path
              d="M 57.8 204 A 118 118 0 1 1 262.2 204"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              className="text-border"
            />

            {/* Foreground Progress Arc */}
            {clampedPercent > 0 && (
              <path
                d="M 57.8 204 A 118 118 0 1 1 262.2 204"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={ARC_LENGTH}
                strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Center Metrics (Donezo Project Progress style) */}
          <div className="absolute inset-x-0 top-[40px] bottom-[20px] flex flex-col items-center justify-center text-center">
            <span className="text-[36px] sm:text-[42px] font-extrabold leading-none tracking-tight text-foreground">
              {clampedPercent}%
            </span>
            <span className="mt-1 text-[12px] font-medium text-foreground-secondary">
              {isCompleted ? "Journey Finished" : "Journey Progress"}
            </span>
            <span className="mt-0.5 text-[10.5px] font-semibold text-foreground-dim">
              {completedChapters} / {totalChapters} chapters
            </span>
          </div>
        </div>
      </div>

      {/* Donezo Status Legend Dots */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 border-t border-border pt-4 text-[11px] font-medium text-foreground-secondary">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          <span>Completed ({completedChapters})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-border-strong" />
          <span>Remaining ({remainingChapters})</span>
        </div>
        {dailyTarget && (
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground" />
            <span>Pace: {dailyTarget} ch/d</span>
          </div>
        )}
      </div>
    </div>
  );
}
