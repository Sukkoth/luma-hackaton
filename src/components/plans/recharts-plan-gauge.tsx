"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

type RechartsPlanGaugeProps = {
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  mode: "scheduled" | "flexible";
};

export function RechartsPlanGauge({
  progressPercent,
  completedChapters,
  totalChapters,
  mode,
}: RechartsPlanGaugeProps) {
  const clampedPercent = Math.min(100, Math.max(0, progressPercent));

  const data = useMemo(() => {
    return [
      {
        name: "Journey",
        value: clampedPercent,
        fill: "var(--primary)",
      },
    ];
  }, [clampedPercent]);

  const badgeText =
    clampedPercent === 100
      ? "Completed"
      : mode === "scheduled"
        ? "Active Schedule"
        : "Self-Paced";

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-[300px] sm:w-[330px] h-[230px] sm:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="48%"
            innerRadius="74%"
            outerRadius="92%"
            barSize={18}
            data={data}
            startAngle={215}
            endAngle={-35}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "color-mix(in srgb, var(--border) 70%, transparent)" }}
              dataKey="value"
              cornerRadius={9}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center overlay: well-proportioned, natural hierarchy */}
        <div className="absolute inset-x-0 top-[22%] flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-xs font-medium text-foreground-dim">
            Journey
          </span>
          <span className="text-4xl sm:text-5xl font-extrabold leading-none tracking-tight text-foreground mt-1">
            {clampedPercent}%
          </span>
          <span className="text-xs font-medium text-foreground-muted mt-1.5">
            {completedChapters} of {totalChapters} chapters
          </span>
          <span className="mt-2.5 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
            {badgeText}
          </span>
        </div>
      </div>
    </div>
  );
}
