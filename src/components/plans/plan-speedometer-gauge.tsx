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
    <div className="glass-panel relative flex flex-col items-center overflow-hidden rounded-[28px] p-6 sm:p-8">
      {/* Subtle background ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-white/5 blur-3xl dark:bg-white/[0.03]" />

      {/* SVG Speedometer Gauge with Expanded Headroom */}
      <div className="relative flex w-full max-w-[300px] sm:max-w-[320px] items-center justify-center">
        <svg
          viewBox="0 0 320 230"
          className="size-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="gaugeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#82ADD4" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 57.8 204 A 118 118 0 1 1 262.2 204"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-black/[0.07] dark:text-white/[0.08]"
          />

          {/* Foreground Progress Arc */}
          {clampedPercent > 0 && (
            <path
              d="M 57.8 204 A 118 118 0 1 1 262.2 204"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={ARC_LENGTH}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        {/* Center Metrics with Balanced Breathing Space */}
        <div className="absolute inset-x-0 top-[38px] bottom-[26px] flex flex-col items-center justify-center text-center">
          <span className="text-[10.5px] font-semibold tracking-[0.22em] text-[#888888] uppercase dark:text-[#9CA3AF]">
            JOURNEY
          </span>
          <span className="mt-0.5 text-[38px] sm:text-[44px] font-bold leading-none tracking-tight text-black dark:text-white">
            {clampedPercent}%
          </span>
          <span className="mt-1 text-[12px] sm:text-[12.5px] font-medium text-[#666666] dark:text-[#A1A1AA]">
            {completedChapters} / {totalChapters} Ch.
          </span>
          <div className="mt-2 rounded-full border border-black/8 bg-black/4 px-2.5 py-0.5 text-[9.5px] font-semibold tracking-wider uppercase text-[#444444] dark:border-white/10 dark:bg-white/8 dark:text-[#D4D4D4]">
            {mode === "flexible" ? "SELF-PACED" : "ACTIVE SCHEDULE"}
          </div>
        </div>
      </div>

      {/* Bottom 3-Column Stats Row */}
      <div className="mt-2 grid w-full max-w-lg grid-cols-3 divide-x divide-black/6 border-t border-black/6 pt-5 text-center dark:divide-white/8 dark:border-white/8">
        <div className="px-2">
          <span className="text-[10.5px] font-medium tracking-wider text-[#777777] uppercase dark:text-[#8E8E93]">
            MODE
          </span>
          <p className="mt-1 text-[13.5px] sm:text-[15px] font-semibold text-black dark:text-white">
            {mode === "flexible" ? "Self-Paced" : "Scheduled"}
          </p>
        </div>

        <div className="px-2">
          <span className="text-[10.5px] font-medium tracking-wider text-[#777777] uppercase dark:text-[#8E8E93]">
            COMPLETED
          </span>
          <p className="mt-1 text-[13.5px] sm:text-[15px] font-semibold text-black dark:text-white">
            {completedChapters} / {totalChapters}
          </p>
        </div>

        <div className="px-2">
          <span className="text-[10.5px] font-medium tracking-wider text-[#777777] uppercase dark:text-[#8E8E93]">
            REMAINING
          </span>
          <p className="mt-1 text-[13.5px] sm:text-[15px] font-semibold text-black dark:text-white">
            {remainingChapters} Ch
          </p>
        </div>
      </div>
    </div>
  );
}
