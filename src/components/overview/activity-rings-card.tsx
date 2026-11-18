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
  const ringConfigs = [
    { key: "bible", radius: 96, strokeWidth: 8.5, opacity: 1.0 },
    { key: "ot", radius: 83, strokeWidth: 8.5, opacity: 0.75 },
    { key: "nt", radius: 70, strokeWidth: 8.5, opacity: 0.5 },
    { key: "today", radius: 57, strokeWidth: 8.5, opacity: 0.28 },
  ];

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Canon Progress Rings
        </h3>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {readChapters} / {totalChapters} ch
        </span>
      </div>

      {/* Rings Visual Area */}
      <div className="relative my-auto flex flex-1 flex-col items-center justify-center min-h-0 py-2">
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
                    className="opacity-60"
                  />

                  {/* Filled Arc with Warm Amber Accent */}
                  {arcLength > 0 && (
                    <circle
                      cx="110"
                      cy="110"
                      r={cfg.radius}
                      stroke="var(--primary)"
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
            <span className="text-3xl font-bold leading-none tracking-tight text-foreground tabular-nums">
              {overallPercentage}%
            </span>
            <span className="mt-1 text-xs font-medium text-muted-foreground tabular-nums">
              {readChapters} of {totalChapters}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 shrink-0">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">This Week</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {thisWeekChapters} chapters
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] text-muted-foreground">30-Day Velocity</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {avgDay30d} ch/day
          </span>
        </div>
      </div>

      {/* Next Up / Projection */}
      <div className="mt-2 border-t border-border/60 pt-2 shrink-0">
        {nextReading ? (
          <Link
            href={`/bible/${nextReading.bookId}/${nextReading.chapter}`}
            className="flex items-center justify-between group text-xs text-foreground font-medium hover:text-primary transition-colors"
          >
            <div className="flex items-center gap-1.5 truncate">
              <BookOpen className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Next: {nextReading.bookName} {nextReading.chapter}</span>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground truncate">
            {projectedFinishDate ? `Projected completion: ${projectedFinishDate}` : "Start reading to view pace"}
          </p>
        )}
      </div>
    </div>
  );
}
