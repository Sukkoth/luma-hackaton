"use client";

import { Download, Calendar } from "lucide-react";

export function ActivityBarChart() {
  // Timeline bars with the prominent peak highlighted in neon yellow (#DDFD2C)
  const barData = [
    { label: "Nov 1", height: 38, isPeak: false },
    { label: "Nov 3", height: 50, isPeak: false },
    { label: "Nov 5", height: 44, isPeak: false },
    { label: "Nov 8", height: 58, isPeak: false },
    { label: "Nov 10", height: 46, isPeak: false },
    { label: "Nov 12", height: 65, isPeak: false },
    { label: "Nov 15", height: 55, isPeak: false },
    { label: "Nov 17", height: 96, isPeak: true, value: "654" }, // The peak bar
    { label: "Nov 19", height: 62, isPeak: false },
    { label: "Nov 22", height: 48, isPeak: false },
    { label: "Nov 24", height: 54, isPeak: false },
    { label: "Nov 26", height: 60, isPeak: false },
    { label: "Nov 29", height: 42, isPeak: false },
  ];

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

        {/* Action icons & total label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Export chart"
            className="glass-pill flex h-8 w-8 items-center justify-center rounded-full text-black/70 shadow-2xs transition-colors hover:bg-white hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Download className="h-3.5 w-3.5 stroke-[1.75]" />
          </button>
          <button
            type="button"
            aria-label="Select date range"
            className="glass-pill flex h-8 w-8 items-center justify-center rounded-full text-black/70 shadow-2xs transition-colors hover:bg-white hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Calendar className="h-3.5 w-3.5 stroke-[1.75]" />
          </button>
          <div className="hidden border-l border-black/[0.06] pl-3 text-right sm:block dark:border-white/[0.08]">
            <span className="block text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
              Total Chapters
            </span>
            <span className="mt-0.5 text-[24px] font-light tracking-tight text-black dark:text-white">
              10 832
            </span>
          </div>
        </div>
      </div>

      {/* Date indicators row */}
      <div className="mt-2.5 flex items-center gap-2 text-[12px] font-normal text-[#888888] dark:text-[#9CA3AF]">
        <span className="font-medium text-black/80 dark:text-white/90">
          2025
        </span>
        <span>•</span>
        <span>November</span>
      </div>

      {/* Bar Chart Area */}
      <div className="relative mt-4 min-h-[140px] w-full flex-1">
        <div className="flex h-full items-end justify-between gap-2 px-2 sm:gap-4">
          {barData.map((bar, idx) => (
            <div
              key={idx}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* Neon Yellow Tag above Peak Bar */}
              {bar.isPeak && (
                <div className="absolute -top-7 z-10 flex flex-col items-center">
                  <span className="rounded-[4px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black shadow-xs">
                    {bar.value}
                  </span>
                  <div className="mt-0.5 h-1 w-1 rounded-full bg-[#DDFD2C]" />
                </div>
              )}

              {/* The Vertical Bar */}
              <div
                style={{ height: `${bar.height}%` }}
                className={`w-full max-w-[28px] rounded-t-[6px] transition-all ${
                  bar.isPeak
                    ? "bg-gradient-to-t from-[#DDFD2C] to-[#F1FFAE] shadow-xs"
                    : "bg-[#E6ECF2]/65 hover:bg-[#D5DFE8] dark:bg-white/[0.08] dark:hover:bg-white/[0.14]"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline markers along bottom */}
      <div className="mt-4 flex justify-between border-t border-black/[0.04] pt-3 text-[12px] font-normal text-[#888888] dark:border-white/[0.08] dark:text-[#9CA3AF]">
        <span>Nov 8</span>
        <span>Nov 15</span>
        <span>Nov 22</span>
        <span>Nov 29</span>
      </div>
    </div>
  );
}
