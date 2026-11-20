"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import type {
  OverviewRadialClockData,
  PolarClockWedge,
} from "@/actions/overview";
import { cn } from "@/lib/utils";

type RadialClockCardProps = {
  data: OverviewRadialClockData;
};

function polarToCartesian({
  cx,
  cy,
  r,
  angleInDegrees,
}: {
  cx: number;
  cy: number;
  r: number;
  angleInDegrees: number;
}): { x: number; y: number } {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}

function describeWedge({
  cx,
  cy,
  innerR,
  outerR,
  startAngle,
  endAngle,
}: {
  cx: number;
  cy: number;
  innerR: number;
  outerR: number;
  startAngle: number;
  endAngle: number;
}): string {
  const angleDiff = Math.max(0.1, endAngle - startAngle);
  const effectiveEnd = startAngle + angleDiff;

  const startOuter = polarToCartesian({
    cx,
    cy,
    r: outerR,
    angleInDegrees: startAngle,
  });
  const endOuter = polarToCartesian({
    cx,
    cy,
    r: outerR,
    angleInDegrees: effectiveEnd,
  });
  const startInner = polarToCartesian({
    cx,
    cy,
    r: innerR,
    angleInDegrees: effectiveEnd,
  });
  const endInner = polarToCartesian({
    cx,
    cy,
    r: innerR,
    angleInDegrees: startAngle,
  });

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 0 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 0 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

export function RadialClockCard({ data }: RadialClockCardProps) {
  const { hourlyWedges, weekdayItems, peakHourLabel, takeaway } = data;

  const [viewMode, setViewMode] = useState<"time" | "weekday">("weekday");
  const [hoveredWedge, setHoveredWedge] = useState<PolarClockWedge | null>(
    null
  );

  const handleModeChange = ({ mode }: { mode: "time" | "weekday" }) => {
    setViewMode(mode);
  };

  const cx = 100;
  const cy = 100;
  const hubRadius = 38;
  const maxOuterRadius = 88;

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Reading Rhythm
        </h3>

        {/* 24h | 7d Toggle */}
        <div className="flex items-center rounded-xl border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => handleModeChange({ mode: "time" })}
            className={cn(
              "rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer",
              viewMode === "time"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            24h Clock
          </button>
          <button
            type="button"
            onClick={() => handleModeChange({ mode: "weekday" })}
            className={cn(
              "rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer",
              viewMode === "weekday"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            7-Day Radar
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center pt-1">
        {viewMode === "time" && (
          <div className="relative flex items-center justify-center w-full max-h-[205px] aspect-square">
            <svg className="size-full overflow-visible" viewBox="0 0 200 200">
              {/* Concentric Grid Rings */}
              <circle
                cx={cx}
                cy={cy}
                r={hubRadius}
                fill="none"
                stroke="var(--border)"
                strokeOpacity={0.6}
                strokeWidth={0.75}
              />
              <circle
                cx={cx}
                cy={cy}
                r={hubRadius + (maxOuterRadius - hubRadius) * 0.5}
                fill="none"
                stroke="var(--border)"
                strokeOpacity={0.4}
                strokeDasharray="2 2"
                strokeWidth={0.5}
              />
              <circle
                cx={cx}
                cy={cy}
                r={maxOuterRadius}
                fill="none"
                stroke="var(--border)"
                strokeOpacity={0.5}
                strokeWidth={0.75}
              />

              {/* 24 Polar Wedges */}
              {hourlyWedges.map((w) => {
                const startAngle = w.hour * 15;
                const endAngle = startAngle + 14;

                const trackPath = describeWedge({
                  cx,
                  cy,
                  innerR: hubRadius,
                  outerR: maxOuterRadius,
                  startAngle,
                  endAngle,
                });

                const effectiveR =
                  w.chapters > 0
                    ? hubRadius +
                      4 +
                      (w.percentOfMax / 100) * (maxOuterRadius - hubRadius - 4)
                    : hubRadius;

                const fillPath =
                  w.chapters > 0
                    ? describeWedge({
                        cx,
                        cy,
                        innerR: hubRadius,
                        outerR: effectiveR,
                        startAngle,
                        endAngle,
                      })
                    : null;

                const isHovered = hoveredWedge?.hour === w.hour;

                return (
                  <g
                    key={`hour-${w.hour}`}
                    onMouseEnter={() => setHoveredWedge(w)}
                    onMouseLeave={() => setHoveredWedge(null)}
                    className="cursor-pointer transition-opacity"
                  >
                    {/* Track */}
                    <path
                      d={trackPath}
                      fill="url(#donutHatchPattern)"
                      stroke="var(--border)"
                      strokeWidth={0.5}
                      strokeOpacity={0.3}
                      className="opacity-40"
                    />

                    {/* Active Fill with Amber Primary */}
                    {fillPath && (
                      <path
                        d={fillPath}
                        fill="var(--primary)"
                        fillOpacity={isHovered ? 1 : 0.85}
                        stroke="var(--card)"
                        strokeWidth={0.75}
                        className="transition-all duration-300"
                      />
                    )}
                  </g>
                );
              })}

              {/* Cardinal Labels: 12 AM / 6 AM / 12 PM / 6 PM */}
              <text
                x={cx}
                y={cy - maxOuterRadius - 3}
                textAnchor="middle"
                fontSize={8.5}
                fill="var(--foreground-dim)"
                fontWeight={500}
              >
                12A
              </text>
              <text
                x={cx + maxOuterRadius + 4}
                y={cy + 3}
                textAnchor="start"
                fontSize={8.5}
                fill="var(--foreground-dim)"
                fontWeight={500}
              >
                6A
              </text>
              <text
                x={cx}
                y={cy + maxOuterRadius + 10}
                textAnchor="middle"
                fontSize={8.5}
                fill="var(--foreground-dim)"
                fontWeight={500}
              >
                12P
              </text>
              <text
                x={cx - maxOuterRadius - 4}
                y={cy + 3}
                textAnchor="end"
                fontSize={8.5}
                fill="var(--foreground-dim)"
                fontWeight={500}
              >
                6P
              </text>
            </svg>

            {/* Center Info Hub */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {hoveredWedge ? (
                <>
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    {hoveredWedge.label}
                  </span>
                  <span className="text-[10px] text-primary font-semibold tabular-nums">
                    {hoveredWedge.chapters} ch
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    {peakHourLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Peak
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {viewMode === "weekday" && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={weekdayItems}
              margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            >
              <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
              <PolarAngleAxis
                dataKey="day"
                stroke="var(--foreground)"
                fontSize={10.5}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={30}
                stroke="var(--foreground-dim)"
                fontSize={9.5}
                tickLine={false}
              />
              <Radar
                name="Chapters"
                dataKey="chapters"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="var(--primary)"
                fillOpacity={0.25}
                isAnimationActive={true}
                animationDuration={600}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  return (
                    <div className="rounded-xl border border-border bg-card p-2.5 shadow-lg text-xs">
                      <p className="font-semibold text-foreground">
                        {item.fullName}
                      </p>
                      <p className="text-muted-foreground">
                        Chapters read:{" "}
                        <span className="font-semibold text-primary">
                          {item.chapters}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Takeaway line */}
      <div className="mt-2 border-t border-border/60 pt-2 shrink-0">
        <p className="text-xs text-muted-foreground truncate">{takeaway}</p>
      </div>
    </div>
  );
}
