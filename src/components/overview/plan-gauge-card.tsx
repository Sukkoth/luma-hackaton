"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type {
  OverviewPlanGaugeData,
  PlanBurnUpPoint,
} from "@/actions/overview";
import { cn } from "@/lib/utils";

type PlanGaugeCardProps = {
  data: OverviewPlanGaugeData;
};

export function PlanGaugeCard({ data }: PlanGaugeCardProps) {
  const { plans, hasActivePlans, takeaway } = data;
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans[0]?.instanceId || ""
  );

  const activePlan =
    plans.find((p) => p.instanceId === selectedPlanId) || plans[0];

  if (!hasActivePlans || !activePlan) {
    return (
      <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Plan Progress
          </h3>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-2.5">
            <Compass className="size-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">
            No Active Reading Plans
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-[200px]">
            Enroll in a curated or custom plan to track daily pacing.
          </p>
          <Link
            href="/plans"
            className="mt-3.5 inline-flex h-9 items-center px-4 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-2xs transition-all"
          >
            Browse Plans
          </Link>
        </div>

        <div className="mt-2 border-t border-border/60 pt-2 shrink-0">
          <p className="text-xs text-muted-foreground truncate">
            No active plan trajectory
          </p>
        </div>
      </div>
    );
  }

  // Semicircular Gauge Calculations (180 degrees)
  const cx = 80;
  const cy = 76;
  const radius = 58;
  const strokeWidth = 9;
  const semiCircumference = Math.PI * radius;

  const actualArc = (activePlan.actualPercent / 100) * semiCircumference;

  // Expected Tick Position (Angle from 180 to 0)
  let expectedTick = null;
  if (!activePlan.isSelfPaced && activePlan.expectedPercent !== null) {
    const expAngleDeg = 180 - (activePlan.expectedPercent / 100) * 180;
    const expRad = (expAngleDeg * Math.PI) / 180;
    const innerR = radius - strokeWidth / 2 - 2;
    const outerR = radius + strokeWidth / 2 + 3;

    expectedTick = {
      x1: cx + innerR * Math.cos(expRad),
      y1: cy - innerR * Math.sin(expRad),
      x2: cx + outerR * Math.cos(expRad),
      y2: cy - outerR * Math.sin(expRad),
    };
  }

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header with Plan Switcher if multiple */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">
          Plan Progress
        </h3>

        {plans.length > 1 ? (
          <div className="flex items-center rounded-xl border border-border bg-muted p-0.5 max-w-[150px] truncate">
            {plans.map((p) => (
              <button
                key={p.instanceId}
                type="button"
                onClick={() => setSelectedPlanId(p.instanceId)}
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-semibold truncate transition-all cursor-pointer",
                  p.instanceId === activePlan.instanceId
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.planName}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px]">
            {activePlan.planName}
          </span>
        )}
      </div>

      {/* Main Body: Top Half Gauge + Bottom Half Burn-up */}
      <div className="flex flex-1 flex-col justify-between min-h-0 pt-1">
        {/* Top Half: Semicircular Gauge */}
        <div className="relative flex flex-col items-center justify-center h-[90px] shrink-0">
          <svg
            className="w-[170px] h-[82px] overflow-visible"
            viewBox="0 0 160 85"
          >
            {/* Background Semicircle Hatched Track */}
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              stroke="url(#donutHatchPattern)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              className="opacity-70"
            />

            {/* Actual Progress Arc with Warm Amber Accent */}
            {actualArc > 0 && (
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                stroke="var(--primary)"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${actualArc} ${semiCircumference * 2}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Expected Marker Tick */}
            {expectedTick && (
              <line
                x1={expectedTick.x1}
                y1={expectedTick.y1}
                x2={expectedTick.x2}
                y2={expectedTick.y2}
                stroke="var(--foreground-dim)"
                strokeWidth={2}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Center Info inside Semicircle */}
          <div className="absolute bottom-1 flex flex-col items-center text-center">
            <span className="text-sm font-bold text-foreground leading-tight">
              {activePlan.statusText}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {activePlan.completedChapters} of {activePlan.totalChapters} ch (
              {activePlan.actualPercent}%)
            </span>
          </div>
        </div>

        {/* Bottom Half: Burn-up Chart */}
        <div className="relative flex-1 min-h-[70px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activePlan.burnUpPoints}
              margin={{ top: 4, right: 6, left: -22, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                stroke="var(--foreground-dim)"
                fontSize={9.5}
                tickLine={false}
                axisLine={false}
                ticks={[
                  activePlan.burnUpPoints[0]?.label || "",
                  activePlan.burnUpPoints[
                    Math.floor(activePlan.burnUpPoints.length / 2)
                  ]?.label || "",
                  activePlan.burnUpPoints[activePlan.burnUpPoints.length - 1]
                    ?.label || "",
                ].filter(Boolean)}
              />
              <YAxis
                stroke="var(--foreground-dim)"
                fontSize={9.5}
                tickLine={false}
                axisLine={false}
                domain={[0, activePlan.totalChapters]}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as PlanBurnUpPoint;
                  if (!p) return null;

                  return (
                    <div className="rounded-xl border border-border bg-card p-2 shadow-lg text-[10px] backdrop-blur-md">
                      <p className="font-semibold text-foreground mb-0.5">
                        {p.label}
                      </p>
                      {p.actual !== null && (
                        <p className="text-muted-foreground">
                          Actual:{" "}
                          <span className="font-semibold text-primary">
                            {p.actual} ch
                          </span>
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        Target:{" "}
                        <span className="font-semibold text-foreground">
                          {p.expected} ch
                        </span>
                      </p>
                    </div>
                  );
                }}
              />

              {/* Target / Expected Pace Line */}
              <Line
                type="monotone"
                dataKey="expectedCumulative"
                stroke="var(--foreground-dim)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                strokeOpacity={0.6}
                dot={false}
                isAnimationActive={false}
              />

              {/* Actual Completed Line with Amber Primary */}
              <Line
                type="monotone"
                dataKey="actualCumulative"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={500}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
