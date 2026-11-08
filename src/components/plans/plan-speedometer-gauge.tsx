"use client";

type PlanSpeedometerGaugeProps = {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  mode: "scheduled" | "flexible";
};

export function PlanSpeedometerGauge({
  progressPercent,
  completedChapters,
  totalChapters,
  mode,
}: PlanSpeedometerGaugeProps) {
  const ARC_LENGTH = 494.28;
  const clampedPercent = Math.min(100, Math.max(0, progressPercent));
  const strokeDashoffset = ARC_LENGTH - (ARC_LENGTH * clampedPercent) / 100;
  const remainingChapters = Math.max(0, totalChapters - completedChapters);

  return (
    <div className="ui-card relative flex flex-col items-center overflow-hidden p-6 sm:p-8">
      {/* SVG Speedometer Gauge with 250° Open Arc Geometry */}
      <div className="relative flex w-full max-w-[300px] sm:max-w-[320px] items-center justify-center">
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

        {/* Center Metrics with Watermelon Typography */}
        <div className="absolute inset-x-0 top-[38px] bottom-[26px] flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-foreground-dim uppercase">
            JOURNEY
          </span>
          <span className="mt-0.5 text-[40px] sm:text-[46px] font-extrabold leading-none tracking-tight text-foreground">
            {clampedPercent}%
          </span>
          <span className="mt-1 text-[12px] font-medium text-foreground-secondary">
            {completedChapters} / {totalChapters} chapters
          </span>
          <div className="ui-pill mt-2 text-[9.5px] font-bold tracking-wider uppercase">
            {mode === "flexible" ? "SELF-PACED" : "ACTIVE SCHEDULE"}
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Stats Row */}
      <div className="mt-2 grid w-full max-w-lg grid-cols-3 divide-x divide-border-subtle border-t border-border-subtle pt-4 text-center">
        <div className="px-2">
          <span className="text-[10px] font-bold tracking-wider text-foreground-dim uppercase">
            MODE
          </span>
          <p className="mt-1 text-[14px] font-bold text-foreground">
            {mode === "flexible" ? "Self-Paced" : "Scheduled"}
          </p>
        </div>

        <div className="px-2">
          <span className="text-[10px] font-bold tracking-wider text-foreground-dim uppercase">
            COMPLETED
          </span>
          <p className="mt-1 text-[14px] font-bold text-foreground">
            {completedChapters} / {totalChapters}
          </p>
        </div>

        <div className="px-2">
          <span className="text-[10px] font-bold tracking-wider text-foreground-dim uppercase">
            REMAINING
          </span>
          <p className="mt-1 text-[14px] font-bold text-foreground">
            {remainingChapters} Ch
          </p>
        </div>
      </div>
    </div>
  );
}
