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
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
          <h3 className="text-[13.5px] font-medium tracking-tight text-foreground">
            Plan Progress
          </h3>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 flex-col items-center justify-center text-center p-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-elevated border border-border text-foreground-dim mb-2.5">
            <Compass className="size-4" />
          </div>
          <h4 className="text-[13px] font-semibold text-foreground">
            No Active Reading Plans
          </h4>
          <p className="mt-1 text-[11px] text-foreground-dim max-w-[200px]">
            Enroll in a curated or custom plan to track pacing.
          </p>
          <Link
            href="/plans"
            className="ui-btn-primary mt-3.5 flex h-8 items-center px-4 rounded-[10px] text-[11.5px] font-medium shadow-xs"
          >
            Browse Plans
          </Link>
        </div>

        <div className="short-laptop-hide max-h-[759px]:hidden mt-2 border-t border-border-subtle pt-2 shrink-0">
          <p className="text-[12px] font-normal text-foreground-dim truncate">
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
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] font-medium tracking-tight text-foreground truncate">
          Plan Progress
        </h3>

        {plans.length > 1 ? (
          <div className="flex items-center rounded-full border border-border bg-surface-elevated p-0.5 max-w-[150px] truncate">
            {plans.map((p) => (
              <button
                key={p.instanceId}
                type="button"
                onClick={() => setSelectedPlanId(p.instanceId)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium truncate transition-all cursor-pointer ${
                  p.instanceId === activePlan.instanceId
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                {p.planName}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-medium text-foreground-dim truncate max-w-[130px]">
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

            {/* Actual Progress Arc */}
            {actualArc > 0 && (
              <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                stroke="var(--foreground)"
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
                stroke="var(--foreground)"
                strokeWidth={2}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Center Info inside Semicircle */}
          <div className="absolute bottom-1 flex flex-col items-center text-center">
            <span className="text-[15px] font-bold text-foreground leading-tight">
              {activePlan.statusText}
            </span>
            <span className="text-[10px] text-foreground-secondary tabular-nums">
              {activePlan.completedChapters} of {activePlan.totalChapters} ch (
              {activePlan.actualPercent}%)
            </span>
          </div>
        </div>

        {/* Bottom Half: Burn-up Line Chart */}
        <div className="relative flex-1 min-h-[60px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activePlan.burnUpPoints}
              margin={{ top: 4, right: 10, left: -22, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                stroke="var(--foreground-dim)"
                fontSize={9.5}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--foreground-dim)"
                fontSize={9.5}
                tickLine={false}
                axisLine={false}
                domain={[0, activePlan.totalChapters]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0]?.payload as PlanBurnUpPoint;
                  return (
                    <div className="rounded-lg border border-border bg-surface p-2 shadow-md text-[10.5px]">
                      <p className="font-semibold text-foreground">
                        {pt.label}
                      </p>
                      {pt.actual !== null && (
                        <p className="text-foreground-secondary">
                          Actual:{" "}
                          <span className="font-semibold text-foreground">
                            {pt.actual} ch
                          </span>
                        </p>
                      )}
                      {pt.expected !== null && (
                        <p className="text-foreground-dim">
                          Expected: {pt.expected} ch
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              {/* Expected Line (Dashed) */}
              {!activePlan.isSelfPaced && (
                <Line
                  type="monotone"
                  dataKey="expected"
                  name="Expected"
                  stroke="var(--foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              )}

              {/* Actual Line (Solid) */}
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke="var(--foreground)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--foreground)" }}
                activeDot={{ r: 4, fill: "var(--foreground)" }}
                connectNulls={false}
                isAnimationActive={true}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Takeaway line */}
      <div className="short-laptop-hide max-h-[759px]:hidden mt-1.5 border-t border-border-subtle pt-1.5 shrink-0">
        <p className="text-[11.5px] font-normal text-foreground-secondary truncate">
          {takeaway}
        </p>
      </div>
    </div>
  );
}
