"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Tooltip,
} from "recharts";
import type { OverviewSunburstData, SunburstSlice } from "@/actions/overview";
import { cn } from "@/lib/utils";

type SunburstCardProps = {
  data: OverviewSunburstData;
};

// Helper to convert polar angle and radius to Cartesian coordinates (in degrees)
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

// Generate SVG path for an annular sector (donut slice)
function describeArc({
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
  const angleDiff = Math.min(359.99, Math.max(0.1, endAngle - startAngle));
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

  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

type TreemapNodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  percent?: number;
};

function CustomTreemapContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  percent = 0,
}: TreemapNodeProps) {
  if (width < 32 || height < 24) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth={1}
        rx={4}
      />
      {percent > 0 && (
        <rect
          x={x}
          y={y}
          width={(width * percent) / 100}
          height={height}
          fill="var(--primary)"
          fillOpacity={0.8}
          rx={4}
        />
      )}
      <text
        x={x + 4}
        y={y + 14}
        fill="var(--foreground)"
        fontSize={10}
        fontWeight={600}
      >
        {name}
      </text>
      <text
        x={x + 4}
        y={y + 26}
        fill="var(--foreground-dim)"
        fontSize={8.5}
      >
        {percent}%
      </text>
    </g>
  );
}

export function SunburstCard({ data }: SunburstCardProps) {
  const {
    slices,
    radarData,
    treemapData,
    overallPercentage,
    readChapters,
    totalChapters,
    takeaway,
  } = data;

  const [viewMode, setViewMode] = useState<"sunburst" | "radar" | "treemap">(
    "radar"
  );
  const [hoveredSlice, setHoveredSlice] = useState<SunburstSlice | null>(null);

  const handleModeChange = ({
    mode,
  }: {
    mode: "sunburst" | "radar" | "treemap";
  }) => {
    setViewMode(mode);
  };

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Canon Depth
        </h3>

        {/* Radar | Sunburst | Treemap Toggle */}
        <div className="flex items-center rounded-xl border border-border bg-muted p-0.5">
          {(["radar", "sunburst", "treemap"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange({ mode: m })}
              className={cn(
                "rounded-lg px-2 py-0.5 text-xs font-semibold capitalize transition-all cursor-pointer",
                viewMode === m
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center pt-1">
        {viewMode === "sunburst" && (
          <div className="relative flex items-center justify-center w-full max-h-[205px] aspect-square">
            <svg className="size-full overflow-visible" viewBox="0 0 200 200">
              {slices.map((slice) => {
                let innerR = 36;
                let outerR = 54;
                let fillOpacity = 0.9;

                if (slice.depth === 2) {
                  innerR = 56;
                  outerR = 74;
                  fillOpacity = 0.7;
                } else if (slice.depth === 3) {
                  innerR = 76;
                  outerR = 95;
                  fillOpacity = 0.45;
                }

                const span = slice.endAngle - slice.startAngle;
                const readSpan = (slice.percent / 100) * span;

                const bgPath = describeArc({
                  cx: 100,
                  cy: 100,
                  innerR,
                  outerR,
                  startAngle: slice.startAngle,
                  endAngle: slice.endAngle,
                });

                const fillPath =
                  readSpan > 0.1
                    ? describeArc({
                        cx: 100,
                        cy: 100,
                        innerR,
                        outerR,
                        startAngle: slice.startAngle,
                        endAngle: slice.startAngle + readSpan,
                      })
                    : null;

                const isHovered = hoveredSlice?.id === slice.id;

                return (
                  <g
                    key={slice.id}
                    onMouseEnter={() => setHoveredSlice(slice)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="cursor-pointer transition-opacity hover:opacity-100"
                  >
                    {/* Unread portion: Hatched pattern */}
                    <path
                      d={bgPath}
                      fill="url(#donutHatchPattern)"
                      stroke="var(--border)"
                      strokeWidth={0.5}
                      className="opacity-70"
                    />

                    {/* Read portion: Warm Amber Fill */}
                    {fillPath && (
                      <path
                        d={fillPath}
                        fill="var(--primary)"
                        fillOpacity={fillOpacity}
                        stroke="var(--card)"
                        strokeWidth={0.75}
                        className={isHovered ? "brightness-110" : ""}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Center Info / Hover Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              {hoveredSlice ? (
                <>
                  <span className="text-xs font-bold text-foreground truncate max-w-[85px]">
                    {hoveredSlice.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {hoveredSlice.completed}/{hoveredSlice.total} ·{" "}
                    {hoveredSlice.percent}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
                    {overallPercentage}%
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {readChapters} / {totalChapters.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {viewMode === "radar" && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData}
              margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            >
              <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
              <PolarAngleAxis
                dataKey="section"
                stroke="var(--foreground)"
                fontSize={10.5}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="var(--foreground-dim)"
                fontSize={9.5}
                tickFormatter={(v) => `${v}%`}
              />
              <Radar
                name="Completed"
                dataKey="percent"
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
                        {item.section}
                      </p>
                      <p className="text-muted-foreground">
                        Coverage:{" "}
                        <span className="font-semibold text-primary">
                          {item.percent}%
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {viewMode === "treemap" && (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="var(--border)"
              content={<CustomTreemapContent />}
            />
          </ResponsiveContainer>
        )}
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
