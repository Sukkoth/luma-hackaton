"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { OverviewStackedProgressData } from "@/actions/overview";

type ProgressOverTimeCardProps = {
  data: OverviewStackedProgressData;
};

export function ProgressOverTimeCard({ data }: ProgressOverTimeCardProps) {
  const { ranges, defaultRange, takeaway } = data;
  const [selectedRange, setSelectedRange] = useState<"14d" | "30d" | "90d">(
    defaultRange
  );

  const points = ranges[selectedRange] || ranges["30d"];

  // Calculate ~6 evenly spaced tick intervals
  const tickStep = Math.max(1, Math.floor(points.length / 6));
  const tickIndices = new Set(
    points
      .map((_, i) => i)
      .filter((i) => i === 0 || i === points.length - 1 || i % tickStep === 0)
  );

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header with Range Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] font-medium tracking-tight text-foreground">
          Progress Over Time
        </h3>

        {/* 14d | 30d | 90d Toggle */}
        <div className="flex items-center rounded-full border border-border bg-surface-elevated p-0.5">
          {(["14d", "30d", "90d"] as const).map((rng) => (
            <button
              key={rng}
              type="button"
              onClick={() => setSelectedRange(rng)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                selectedRange === rng
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {rng}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stacked Area Chart */}
      <div className="relative flex-1 min-h-0 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="var(--foreground-dim)"
              fontSize={10.5}
              tickLine={false}
              axisLine={false}
              ticks={points
                .filter((_, i) => tickIndices.has(i))
                .map((p) => p.label)}
            />
            <YAxis
              stroke="var(--foreground-dim)"
              fontSize={10.5}
              tickLine={false}
              axisLine={false}
              domain={[
                0,
                (dataMax: number) => Math.max(10, Math.ceil(dataMax * 1.1)),
              ]}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
              }
            />
            <Tooltip
              cursor={{
                stroke: "var(--foreground)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
                strokeOpacity: 0.5,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;

                const isProjected =
                  d.projected !== null && d.totalActual === null;
                return (
                  <div className="rounded-lg border border-border bg-surface p-2 shadow-md text-[11px] backdrop-blur-md">
                    <p className="font-semibold text-foreground mb-1">
                      {d.label} {isProjected && "(Projected)"}
                    </p>
                    {isProjected ? (
                      <p className="text-foreground-secondary">
                        Projected Total:{" "}
                        <span className="font-semibold text-foreground">
                          {d.projected?.toLocaleString()} ch
                        </span>
                      </p>
                    ) : (
                      <>
                        <p className="text-foreground-secondary">
                          Old Testament:{" "}
                          <span className="font-semibold text-foreground">
                            {d.otActual?.toLocaleString()} ch
                          </span>
                        </p>
                        <p className="text-foreground-secondary">
                          New Testament:{" "}
                          <span className="font-semibold text-foreground">
                            {d.ntActual?.toLocaleString()} ch
                          </span>
                        </p>
                        <div className="mt-1 pt-1 border-t border-border-subtle flex justify-between font-bold text-foreground">
                          <span>Total:</span>
                          <span>{d.totalActual?.toLocaleString()} ch</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              }}
            />

            {/* Stacked Old Testament Area */}
            <Area
              type="monotone"
              dataKey="otActual"
              stackId="progress"
              name="Old Testament"
              stroke="var(--foreground)"
              strokeWidth={1.5}
              fill="var(--foreground)"
              fillOpacity={0.8}
              isAnimationActive={true}
              animationDuration={600}
            />

            {/* Stacked New Testament Area */}
            <Area
              type="monotone"
              dataKey="ntActual"
              stackId="progress"
              name="New Testament"
              stroke="var(--foreground)"
              strokeWidth={1.5}
              fill="var(--foreground)"
              fillOpacity={0.3}
              isAnimationActive={true}
              animationDuration={600}
            />

            {/* Dashed Future Projection Line */}
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected Pace"
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              dot={false}
              isAnimationActive={true}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Takeaway line */}
      <div className="short-laptop-hide max-h-[759px]:hidden mt-2 border-t border-border-subtle pt-2 shrink-0">
        <p className="text-[12px] font-normal text-foreground-secondary truncate">
          {takeaway}
        </p>
      </div>
    </div>
  );
}
