"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { OverviewActivityRingsData } from "@/actions/overview";

type ActivityRingsCardProps = {
  data: OverviewActivityRingsData;
};

export function ActivityRingsCard({ data }: ActivityRingsCardProps) {
  const {
    totalChapters,
    readChapters,
    overallPercentage,
    rings,
    thisWeekChapters,
    avgDay30d,
    projectedFinishDate,
    nextReading,
  } = data;

  // Ring radii configuration (4 concentric rings)
  // Scaled with enlarged inner circle for comfortable text placement
  // Center: (110, 110) in 220x220 viewBox
  const ringConfigs = [
    { key: "bible", radius: 96, strokeWidth: 8.5, opacity: 1.0 },
    { key: "ot", radius: 83, strokeWidth: 8.5, opacity: 0.7 },
    { key: "nt", radius: 70, strokeWidth: 8.5, opacity: 0.45 },
    { key: "today", radius: 57, strokeWidth: 8.5, opacity: 0.25 },
  ];

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] font-medium tracking-tight text-foreground">
          Progress Rings
        </h3>
        <span className="text-[11px] font-medium text-foreground-dim tabular-nums">
          Canon Total
        </span>
      </div>

      {/* Rings Visual Area - fills available space */}
      <div className="relative my-auto flex flex-1 flex-col items-center justify-center min-h-0 py-1">
        <div className="relative flex items-center justify-center w-full max-h-[220px] aspect-square">
          <svg
            className="size-full -rotate-90 transform overflow-visible"
            viewBox="0 0 220 220"
          >
            {ringConfigs.map((cfg) => {
              const ringData = rings.find((r) => r.key === cfg.key);
              const pct = ringData
                ? Math.min(100, Math.max(0, ringData.percent))
                : 0;
              const circumference = 2 * Math.PI * cfg.radius;
              const arcLength = (pct / 100) * circumference;

              return (
                <g key={cfg.key}>
                  {/* Hatched Track */}
                  <circle
                    cx="110"
                    cy="110"
                    r={cfg.radius}
                    stroke="url(#donutHatchPattern)"
                    strokeWidth={cfg.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    className="opacity-70"
                  />

                  {/* Filled Arc */}
                  {arcLength > 0 && (
                    <circle
                      cx="110"
                      cy="110"
                      r={cfg.radius}
                      stroke="var(--foreground)"
                      strokeWidth={cfg.strokeWidth}
                      fill="none"
                      strokeDasharray={`${arcLength} ${circumference}`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{ opacity: cfg.opacity }}
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[26px] sm:text-[30px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {overallPercentage}%
            </span>
            <span className="mt-1 text-[11px] font-medium text-foreground-secondary tabular-nums">
              {readChapters} of {totalChapters.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Small Legend */}
        <div className="mt-2 flex items-center justify-center gap-3 text-[10.5px] text-foreground-secondary">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground" />
            <span>Bible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/70" />
            <span>OT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/45" />
            <span>NT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/25" />
            <span>Today</span>
          </div>
        </div>

        {/* 3 Small Numbers Row (Hidden on short laptops < 760px) */}
        <div className="short-laptop-hide max-h-[759px]:hidden mt-2.5 grid w-full grid-cols-3 gap-1 border-t border-border-subtle pt-2 text-center shrink-0">
          <div>
            <span className="block text-[10px] font-medium text-foreground-dim uppercase tracking-wider">
              This Week
            </span>
            <span className="mt-0.5 block text-[12.5px] font-semibold text-foreground tabular-nums">
              {thisWeekChapters} ch
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-medium text-foreground-dim uppercase tracking-wider">
              Avg / Day
            </span>
            <span className="mt-0.5 block text-[12.5px] font-semibold text-foreground tabular-nums">
              {avgDay30d} ch
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-medium text-foreground-dim uppercase tracking-wider">
              Projected
            </span>
            <span className="mt-0.5 block text-[12.5px] font-semibold text-foreground tabular-nums truncate px-1">
              {projectedFinishDate}
            </span>
          </div>
        </div>
      </div>

      {/* Primary CTA Button */}
      <div className="mt-2 shrink-0">
        <Link
          href="/books"
          className="ui-btn-primary flex h-8.5 w-full items-center justify-center gap-1.5 rounded-[10px] text-[11.5px] font-medium shadow-xs transition-all active:scale-[0.99]"
        >
          <BookOpen className="size-3.5" />
          <span className="truncate">
            Continue reading · {nextReading?.displayText ?? "Genesis 1"}
          </span>
          <ArrowRight className="size-3.5 shrink-0 opacity-70" />
        </Link>
      </div>
    </div>
  );
}
