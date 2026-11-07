"use client";

export type DailyActivity = {
  dayLabel: string;
  dateLabel: string;
  count: number;
};

type ActivityBarChartProps = {
  totalChapters?: number;
  activity?: ReadonlyArray<DailyActivity>;
};

export function ActivityBarChart({
  totalChapters = 0,
  activity = [],
}: ActivityBarChartProps) {
  // If activity is empty or not provided, generate past 7 days with 0 counts
  const data =
    activity.length > 0
      ? activity
      : [
          { dayLabel: "Mon", dateLabel: "Mon", count: 0 },
          { dayLabel: "Tue", dateLabel: "Tue", count: 0 },
          { dayLabel: "Wed", dateLabel: "Wed", count: 0 },
          { dayLabel: "Thu", dateLabel: "Thu", count: 0 },
          { dayLabel: "Fri", dateLabel: "Fri", count: 0 },
          { dayLabel: "Sat", dateLabel: "Sat", count: 0 },
          { dayLabel: "Sun", dateLabel: "Sun", count: 0 },
        ];

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const peakIndex =
    maxCount > 0 ? data.findIndex((d) => d.count === maxCount) : -1;

  const barData = data.map((item, idx) => {
    const isPeak = idx === peakIndex && item.count > 0;
    // Scale height from 6% minimum to 95% maximum
    const height =
      item.count > 0 ? Math.round((item.count / maxCount) * 85) + 10 : 6;
    return {
      label: item.dayLabel,
      dateLabel: item.dateLabel,
      height,
      isPeak,
      value: item.count.toString(),
    };
  });

  return (
    <div className="glass-panel relative flex flex-1 flex-col justify-between rounded-[28px] p-5 sm:p-6">
      {/* Header and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-normal tracking-tight text-black dark:text-white">
            Reading Activity
          </h3>
          <p className="mt-0.5 text-[13px] font-normal text-[#777777] dark:text-[#9CA3AF]">
            Weekly chapter reading progression
          </p>
        </div>

        {/* Total label */}
        <div className="text-right">
          <span className="block text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
            Total Chapters
          </span>
          <span className="mt-0.5 text-[24px] font-light tracking-tight text-black dark:text-white">
            {totalChapters.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Date indicators row */}
      <div className="mt-2.5 flex items-center gap-2 text-[12px] font-normal text-[#888888] dark:text-[#9CA3AF]">
        <span className="font-medium text-black/80 dark:text-white/90">
          Last 7 Days
        </span>
        <span>•</span>
        <span>
          {totalChapters > 0
            ? `${totalChapters} chapters logged`
            : "No activity recorded yet"}
        </span>
      </div>

      {/* Bar Chart Area */}
      <div className="relative mt-4 min-h-35 w-full flex-1">
        <div className="flex h-full items-end justify-between gap-2 px-2 sm:gap-4">
          {barData.map((bar, idx) => (
            <div
              key={idx}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* Neon Yellow Tag above Peak Bar */}
              {bar.isPeak && (
                <div className="absolute -top-7 z-10 flex flex-col items-center">
                  <span className="rounded-sm bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black shadow-xs">
                    {bar.value}
                  </span>
                  <div className="mt-0.5 size-1 rounded-full bg-[#DDFD2C]" />
                </div>
              )}

              {/* The Vertical Bar */}
              <div
                style={{ height: `${bar.height}%` }}
                className={`w-full max-w-7 rounded-t-md transition-all ${
                  bar.isPeak
                    ? "bg-linear-to-t from-[#DDFD2C] to-[#F1FFAE] shadow-xs"
                    : "bg-[#E6ECF2]/65 hover:bg-[#D5DFE8] dark:bg-white/8 dark:hover:bg-white/[0.14]"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline markers along bottom */}
      <div className="mt-4 flex justify-between border-t border-black/4 pt-3 text-[12px] font-normal text-[#888888] dark:border-white/8 dark:text-[#9CA3AF]">
        {barData.map((bar, idx) => (
          <span key={idx}>{bar.label}</span>
        ))}
      </div>
    </div>
  );
}
