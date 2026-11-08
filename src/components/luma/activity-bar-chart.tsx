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
    <div className="ui-card relative flex flex-1 flex-col justify-between p-5 sm:p-6">
      {/* Header and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-normal tracking-tight text-foreground">
            Reading Activity
          </h3>
          <p className="mt-0.5 text-[13px] font-normal text-foreground-secondary">
            Weekly chapter reading progression
          </p>
        </div>

        {/* Total label */}
        <div className="text-right">
          <span className="block text-[10px] font-medium tracking-wider text-foreground-secondary uppercase">
            Total Chapters
          </span>
          <span className="mt-0.5 font-mono text-[24px] font-light tracking-tight text-foreground">
            {totalChapters.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Date indicators row */}
      <div className="mt-2.5 flex items-center gap-2 text-[12px] font-normal text-foreground-secondary">
        <span className="font-medium text-foreground">Last 7 Days</span>
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
          {barData.map((bar) => (
            <div
              key={bar.label}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* High Contrast Monochrome Tag above Peak Bar */}
              {bar.isPeak && (
                <div className="absolute -top-7 z-10 flex flex-col items-center">
                  <span className="rounded-full border border-primary-border bg-primary px-2 py-0.5 font-mono text-[10px] font-medium text-primary-foreground shadow-xs">
                    {bar.value}
                  </span>
                  <div className="mt-0.5 size-1 rounded-full bg-primary" />
                </div>
              )}

              {/* The Vertical Bar */}
              <div
                style={{ height: `${bar.height}%` }}
                className={`w-full max-w-7 rounded-t-md transition-all ${
                  bar.isPeak
                    ? "bg-primary shadow-xs"
                    : "bg-surface-subtle hover:bg-border-strong"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline markers along bottom */}
      <div className="mt-4 flex justify-between border-t border-border-subtle pt-3 text-[12px] font-normal text-foreground-secondary">
        {barData.map((bar) => (
          <span key={bar.label}>{bar.label}</span>
        ))}
      </div>
    </div>
  );
}
