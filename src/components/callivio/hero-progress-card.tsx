"use client";

import { Share2, X } from "lucide-react";

type HeroProgressCardProps = {
  userName?: string;
  readChapters?: number;
  totalChapters?: number;
  otChapters?: number;
  ntChapters?: number;
  remainingChapters?: number;
};

export function HeroProgressCard({
  userName = "James",
  readChapters = 443,
  totalChapters = 1189,
  otChapters = 498,
  ntChapters = 443,
  remainingChapters = 167,
}: HeroProgressCardProps) {
  const percentage = Math.round((readChapters / totalChapters) * 100);

  // SVG circular calculations with a refined, slender stroke
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.82;
  const strokeDashoffset = arcLength * (1 - percentage / 100);

  return (
    <div className="glass-hero relative flex shrink-0 flex-col justify-between overflow-hidden rounded-[32px] p-7 text-white lg:w-[380px]">
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[17px] font-normal text-white/90">
              Hello, {userName}!
            </p>
            <h2 className="mt-0.5 text-[26px] font-normal tracking-tight text-white">
              Bible Progress
            </h2>
          </div>
          <button
            type="button"
            aria-label="Minimize progress banner"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white/80 transition-colors hover:bg-white/25 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug font-normal text-white/70">
          Tracking scripture reading with active Protestant canon.
        </p>
      </div>

      {/* Circular Progress Gauge Section */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <svg
            className="h-56 w-56 -rotate-90 transform overflow-visible"
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
              <span className="h-1.5 w-1.5 rounded-full border border-white/80 bg-transparent" />
              <span>Old Test.</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-white">
              {otChapters}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span>New Test.</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-white">
              {ntChapters}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-[12px] font-normal text-white/80">
              <span className="h-1.5 w-1.5 rounded-full border border-white/80 bg-transparent" />
              <span>Remaining</span>
            </div>
            <p className="mt-1 text-[22px] font-light text-white">
              {remainingChapters}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Score & Share Section */}
      <div className="mt-2 border-t border-white/20 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[12px] font-normal text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span>Your Total Progress</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[54px] leading-none font-light tracking-tight text-white">
                1 108
              </span>
              <span className="text-[15px] font-normal text-white/75">
                chapters
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Share progress report"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white shadow-2xs backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
