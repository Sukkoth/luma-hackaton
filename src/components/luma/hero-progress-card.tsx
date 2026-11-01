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
    <div className="glass-hero relative flex shrink-0 flex-col justify-between overflow-hidden rounded-4xl p-7 text-white lg:w-95">
      {/* Top Header Row */}
      <div>
        <p className="text-[17px] font-normal text-white/90">
          Hello, {userName}!
        </p>
        <h2 className="mt-0.5 text-[26px] font-normal tracking-tight text-white">
          Bible Progress
        </h2>
        <p className="mt-1.5 text-[13px] leading-snug font-normal text-white/70">
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
            {/* Background Track Arc - refined slender stroke */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Active White Progress Arc */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="#FFFFFF"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Content Inside Circular Gauge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="rounded-md bg-white/95 px-2.5 py-0.5 text-[11px] font-medium text-black shadow-xs">
              {percentage}%
            </span>
            <span className="mt-1.5 text-[13px] font-normal text-white/90">
              {readChapters} of {totalChapters}
            </span>
          </div>
        </div>

        {/* Category breakdown dots */}
        <div className="mt-6 flex w-full items-center justify-between px-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-white/80">
              <span className="size-1.5 rounded-full border border-white/80 bg-transparent" />
              <span>Old Test.</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-white">
              {otChapters}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-white/80">
              <span className="size-1.5 rounded-full bg-white" />
              <span>New Test.</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-white">
              {ntChapters}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-white/80">
              <span className="size-1.5 rounded-full border border-white/80 bg-transparent" />
              <span>Remaining</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-white">
              {remainingChapters}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Progress Section */}
      <div className="mt-2 border-t border-white/20 pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] font-normal text-white/80">
            <span className="size-1.5 rounded-full bg-white" />
            <span>Your Total Progress</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[54px] leading-none font-light tracking-tight text-white">
              {readChapters.toLocaleString()}
            </span>
            <span className="text-[15px] font-normal text-white/75">
              chapters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
