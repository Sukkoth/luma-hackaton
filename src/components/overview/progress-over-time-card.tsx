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
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Reading Velocity & Progress
        </h3>

        {/* 14d | 30d | 90d Toggle */}
        <div className="flex items-center rounded-xl border border-border bg-muted p-0.5">
          {(["14d", "30d", "90d"] as const).map((rng) => (
            <button
              key={rng}
              type="button"
              onClick={() => setSelectedRange(rng)}
              className={cn(
                "rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer",
                selectedRange === rng
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {rng}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stacked Area Chart */}
      <div className="relative flex-1 min-h-0 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeOpacity={0.6}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              stroke="var(--foreground-dim)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              ticks={points
                .filter((_, i) => tickIndices.has(i))
                .map((p) => p.label)}
            />
            <YAxis
              stroke="var(--foreground-dim)"
              fontSize={11}
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
                stroke: "var(--primary)",
                strokeWidth: 1.5,
                strokeDasharray: "3 3",
                strokeOpacity: 0.6,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;

                const isProjected =
                  d.projected !== null && d.totalActual === null;
                return (
                  <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs backdrop-blur-md">
                    <p className="font-semibold text-foreground mb-1.5">
                      {d.label} {isProjected && "(Projected)"}
                    </p>
                    {isProjected ? (
                      <p className="text-muted-foreground">
                        Projected Total:{" "}
                        <span className="font-semibold text-foreground">
                          {d.projected?.toLocaleString()} ch
                        </span>
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-muted-foreground flex justify-between gap-3">
                          <span>Old Testament:</span>
                          <span className="font-semibold text-foreground">
                            {d.otActual?.toLocaleString()} ch
                          </span>
                        </p>
                        <p className="text-muted-foreground flex justify-between gap-3">
                          <span>New Testament:</span>
                          <span className="font-semibold text-foreground">
                            {d.ntActual?.toLocaleString()} ch
                          </span>
                        </p>
                        <div className="mt-1.5 pt-1.5 border-t border-border flex justify-between font-bold text-foreground">
                          <span>Total:</span>
                          <span className="text-primary font-bold">
                            {d.totalActual?.toLocaleString()} ch
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Stacked Old Testament Area with Warm Amber Theme */}
            <Area
              type="monotone"
              dataKey="otActual"
              stackId="progress"
              name="Old Testament"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#overviewAreaGradient)"
              isAnimationActive={true}
              animationDuration={600}
            />

            {/* Stacked New Testament Area */}
            <Area
              type="monotone"
              dataKey="ntActual"
              stackId="progress"
              name="New Testament"
              stroke="var(--primary)"
              strokeWidth={1.5}
              fill="var(--primary)"
              fillOpacity={0.15}
              isAnimationActive={true}
              animationDuration={600}
            />

            {/* Dashed Future Projection Line */}
            <Line
              type="monotone"
              dataKey="projected"
              name="Projected Pace"
              stroke="var(--foreground-dim)"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.8}
              dot={false}
              isAnimationActive={true}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Takeaway line */}
      <div className="mt-2 border-t border-border/60 pt-2 shrink-0">
        <p className="text-xs text-muted-foreground truncate">
          {takeaway}
        </p>
      </div>
    </div>
  );
}
