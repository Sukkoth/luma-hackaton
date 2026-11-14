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
        fill: "var(--foreground, #ffffff)",
      },
    ];
  }, [clampedPercent]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-[320px] sm:w-[350px] h-[260px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="48%"
            innerRadius="76%"
            outerRadius="92%"
            barSize={16}
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
              background={{ fill: "var(--border, rgba(255,255,255,0.12))" }}
              dataKey="value"
              cornerRadius={8}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center overlay label positioned comfortably inside the horseshoe cavity */}
        <div className="absolute inset-x-0 top-[26%] flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
            Journey
          </span>
          <span className="text-4xl sm:text-5xl font-extrabold leading-none tracking-tight text-foreground mt-1.5">
            {clampedPercent}%
          </span>
          <span className="text-xs font-semibold text-foreground-muted mt-2">
            {completedChapters} / {totalChapters} chapters
          </span>
          <span className="mt-3 inline-flex items-center rounded-md bg-surface-elevated px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-foreground-dim border border-border/40">
            {mode === "scheduled" ? "Active Schedule" : "Self-Paced"}
          </span>
        </div>
      </div>
    </div>
  );
}
