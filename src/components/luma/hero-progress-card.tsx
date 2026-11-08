"use client";

type HeroProgressCardProps = {
  userName?: string;
  trackerName?: string;
  readChapters?: number;
  totalChapters?: number;
  otChapters?: number;
  ntChapters?: number;
  remainingChapters?: number;
  canonName?: string;
};

export function HeroProgressCard({
  userName = "Reader",
  trackerName,
  readChapters = 0,
  totalChapters = 1189,
  otChapters = 0,
  ntChapters = 0,
  remainingChapters = 1189,
  canonName = "Standard 66 Books",
}: HeroProgressCardProps) {
  const percentage =
    totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;

  // SVG circular calculations with a refined, slender stroke
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.82;
  const strokeDashoffset = arcLength * (1 - percentage / 100);

  return (
    <div className="ui-card relative flex shrink-0 flex-col justify-between overflow-hidden p-7 lg:w-95">
      {/* Top Header Row */}
      <div>
        <p className="text-[17px] font-normal text-foreground-secondary">
          Hello, {userName}!
        </p>
        <h2 className="mt-0.5 text-[26px] font-normal tracking-tight text-foreground">
          Bible Progress
        </h2>
        <p className="mt-1.5 text-[13px] leading-snug font-normal text-foreground-dim">
          Tracking{" "}
          {trackerName
            ? `"${trackerName}" with active `
            : "scripture reading with active "}
          {canonName}.
        </p>
      </div>

      {/* Circular Progress Gauge Section */}
      <div className="my-auto flex flex-col items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          <svg
            className="size-56 -rotate-90 transform overflow-visible"
            viewBox="0 0 220 220"
          >
            {/* Background Track Arc */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="var(--border)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Active Progress Arc */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="var(--primary)"
              strokeWidth="4.5"
              fill="none"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Content Inside Circular Gauge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="ui-pill-primary text-[11px]">{percentage}%</span>
            <span className="mt-1.5 text-[13px] font-normal text-foreground-secondary">
              {readChapters} of {totalChapters}
            </span>
          </div>
        </div>

        {/* Category breakdown dots */}
        <div className="mt-6 flex w-full items-center justify-between px-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-foreground-secondary">
              <span className="size-1.5 rounded-full border border-border-strong bg-transparent" />
              <span>Old Test.</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-foreground">
              {otChapters}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-foreground-secondary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>New Test.</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-foreground">
              {ntChapters}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-foreground-secondary">
              <span className="size-1.5 rounded-full border border-border-strong bg-transparent" />
              <span>Remaining</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-foreground">
              {remainingChapters}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Progress Section */}
      <div className="mt-2 border-t border-border-subtle pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-normal text-foreground-secondary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Your Total Progress</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[54px] leading-none font-light tracking-tight text-foreground">
              {readChapters.toLocaleString()}
            </span>
            <span className="text-[15px] font-normal text-foreground-dim">
              chapters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
