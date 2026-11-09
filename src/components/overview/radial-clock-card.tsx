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
  const hubRadius = 26;
  const maxOuterRadius = 80;

  const takeawayText =
    viewMode === "time"
      ? takeaway
      : weekdayItems.some((w) => w.chapters > 0)
        ? `Most active on ${data.peakWeekdayLabel}`
        : "Log readings to see reading rhythm";

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header with Time of Day | Weekday Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] font-medium tracking-tight text-foreground truncate">
          {viewMode === "time" ? "When You Read" : "Reading by Weekday"}
        </h3>

        <div className="flex items-center rounded-full border border-border bg-surface-elevated p-0.5">
          <button
            type="button"
            onClick={() => handleModeChange({ mode: "weekday" })}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
              viewMode === "weekday"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            Weekday
          </button>
          <button
            type="button"
            onClick={() => handleModeChange({ mode: "time" })}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
              viewMode === "time"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            Time of day
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center pt-1">
        {viewMode === "time" && (
          <div className="relative flex items-center justify-center w-full max-h-[205px] aspect-square">
            <svg className="size-full overflow-visible" viewBox="0 0 200 200">
              {/* Concentric Quiet Grid Rings */}
              <circle
                cx={cx}
                cy={cy}
                r={hubRadius}
                fill="none"
                stroke="var(--border)"
                strokeOpacity={0.5}
                strokeWidth={0.75}
              />
              <circle
                cx={cx}
                cy={cy}
                r={hubRadius + (maxOuterRadius - hubRadius) * 0.5}
                fill="none"
                stroke="var(--border)"
                strokeOpacity={0.3}
                strokeDasharray="2 2"
                strokeWidth={0.5}
              />
              <circle
                cx={cx}
                cy={cy}
                r={maxOuterRadius}
                fill="none"
                stroke="var(--border)"
                strokeOpacity={0.4}
                strokeWidth={0.75}
              />

              {/* 24 Polar Wedges */}
              {hourlyWedges.map((w) => {
                const startAngle = w.hour * 15;
                const endAngle = startAngle + 14;

                // Wedge track (hatched background)
                const trackPath = describeWedge({
                  cx,
                  cy,
                  innerR: hubRadius,
                  outerR: maxOuterRadius,
                  startAngle,
                  endAngle,
                });

                // Wedge fill (length proportional to chapters)
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

                    {/* Active Fill */}
                    {fillPath && (
                      <path
                        d={fillPath}
                        fill="var(--foreground)"
                        fillOpacity={isHovered ? 1 : 0.8}
                        stroke="var(--surface)"
                        strokeWidth={0.75}
                        className="transition-all duration-300"
                      />
                    )}
                  </g>
                );
              })}

              {/* Quiet Labels at 12am, 6am, 12pm, 6pm */}
              <text
                x={cx}
                y={cy - maxOuterRadius - 6}
                textAnchor="middle"
                fontSize={9}
                fill="var(--foreground-dim)"
                fontWeight="500"
              >
                12a
              </text>
              <text
                x={cx + maxOuterRadius + 8}
                y={cy + 3}
                textAnchor="start"
                fontSize={9}
                fill="var(--foreground-dim)"
                fontWeight="500"
              >
                6a
              </text>
              <text
                x={cx}
                y={cy + maxOuterRadius + 13}
                textAnchor="middle"
                fontSize={9}
                fill="var(--foreground-dim)"
                fontWeight="500"
              >
                12p
              </text>
              <text
                x={cx - maxOuterRadius - 8}
                y={cy + 3}
                textAnchor="end"
                fontSize={9}
                fill="var(--foreground-dim)"
                fontWeight="500"
              >
                6p
              </text>
            </svg>

            {/* Center Info / Hover Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              {hoveredWedge ? (
                <>
                  <span className="text-[11px] font-bold text-foreground">
                    {hoveredWedge.label}
                  </span>
                  <span className="text-[9.5px] text-foreground-secondary tabular-nums">
                    {hoveredWedge.chapters} ch
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[12px] font-bold text-foreground tabular-nums">
                    {peakHourLabel}
                  </span>
                  <span className="text-[9px] text-foreground-dim uppercase tracking-wider">
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
              <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
              <PolarAngleAxis
                dataKey="day"
                stroke="var(--foreground)"
                fontSize={10}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={30}
                stroke="var(--foreground-dim)"
                fontSize={9}
                tickLine={false}
              />
              <Radar
                name="Chapters"
                dataKey="chapters"
                stroke="var(--foreground)"
                strokeWidth={2}
                fill="var(--foreground)"
                fillOpacity={0.35}
                isAnimationActive={true}
                animationDuration={600}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border border-border bg-surface p-2 shadow-md text-[11px]">
                      <p className="font-semibold text-foreground">
                        {item.fullName}
                      </p>
                      <p className="text-foreground-secondary">
                        {item.chapters} chapters logged
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
      <div className="short-laptop-hide max-h-[759px]:hidden mt-2 border-t border-border-subtle pt-2 shrink-0">
        <p className="text-[12px] font-normal text-foreground-secondary truncate">
          {takeawayText}
        </p>
      </div>
    </div>
  );
}
