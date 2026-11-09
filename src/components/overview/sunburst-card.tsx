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
  // Rotate so 0 degrees is top (-90 from standard trigonometric 0)
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
  // Cap angle difference to 359.99 to prevent zero-length closed loop bug
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
  abbrev?: string;
  percent?: number;
};

function TreemapContent(props: TreemapNodeProps): React.JSX.Element {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = "",
    abbrev = "",
    percent = 0,
  } = props;
  if (width < 2 || height < 2) return <g />;
  const canShowText = width >= 26 && height >= 20;
  const pct = Math.min(100, Math.max(0, percent));
  const isHighCompletion = pct >= 50;

  // Unread cells use subtle background (0.08 opacity)
  // Partially / fully completed cells scale up to 1.0 opacity
  const bgOpacity = pct === 0 ? 0.08 : 0.3 + 0.7 * (pct / 100);
  const label = abbrev || (name.length <= 4 ? name : name.slice(0, 3));

  // Contrast:
  // - High completion: text is opposite (var(--surface): white in light mode, dark in dark mode)
  // - Low completion / unread: text matches foreground (var(--foreground): dark in light mode, white in dark mode)
  // stroke="none" is required so SVG text does not inherit Treemap's stroke="var(--surface)"
  const textFill = isHighCompletion ? "var(--surface)" : "var(--foreground)";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="var(--foreground)"
        fillOpacity={bgOpacity}
        stroke="var(--surface)"
        strokeWidth={1.5}
        rx={3}
      />
      {canShowText && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 3.5}
          textAnchor="middle"
          fontSize={width < 34 ? 8.5 : 10}
          fontWeight="600"
          fill={textFill}
          stroke="none"
          className="pointer-events-none select-none"
        >
          {label}
        </text>
      )}
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

  const [viewMode, setViewMode] = useState<"radar" | "sunburst" | "treemap">(
    "radar"
  );
  const [hoveredSlice, setHoveredSlice] = useState<SunburstSlice | null>(null);

  const handleModeChange = ({
    mode,
  }: {
    mode: "radar" | "sunburst" | "treemap";
  }) => {
    setViewMode(mode);
  };

  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs">
      {/* Header with Sunburst | Radar | Treemap Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <h3 className="text-[13.5px] font-medium tracking-tight text-foreground truncate">
          {viewMode === "sunburst"
            ? "Bible Sunburst"
            : viewMode === "radar"
              ? "Section Radar"
              : "Canon Treemap"}
        </h3>

        {/* 3-way toggle */}
        <div className="flex items-center rounded-full border border-border bg-surface-elevated p-0.5">
          {(["radar", "sunburst", "treemap"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange({ mode: m })}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition-all cursor-pointer ${
                viewMode === m
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
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
                let fillOpacity = 0.85;

                if (slice.depth === 2) {
                  innerR = 56;
                  outerR = 74;
                  fillOpacity = 0.65;
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

                    {/* Read portion: Solid ink */}
                    {fillPath && (
                      <path
                        d={fillPath}
                        fill="var(--foreground)"
                        fillOpacity={fillOpacity}
                        stroke="var(--surface)"
                        strokeWidth={0.75}
                        className={isHovered ? "brightness-125" : ""}
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
                  <span className="text-[11.5px] font-bold text-foreground truncate max-w-[85px]">
                    {hoveredSlice.name}
                  </span>
                  <span className="text-[10px] text-foreground-secondary tabular-nums">
                    {hoveredSlice.completed}/{hoveredSlice.total} ·{" "}
                    {hoveredSlice.percent}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[20px] font-bold leading-none tracking-tight text-foreground tabular-nums">
                    {overallPercentage}%
                  </span>
                  <span className="mt-0.5 text-[10px] text-foreground-secondary tabular-nums">
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
              <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
              <PolarAngleAxis
                dataKey="section"
                stroke="var(--foreground)"
                fontSize={10}
                tickLine={false}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="var(--foreground-dim)"
                fontSize={9}
                tickFormatter={(v) => `${v}%`}
              />
              <Radar
                name="Completed"
                dataKey="percent"
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
                        {item.section}
                      </p>
                      <p className="text-foreground-secondary">
                        {item.completed} of {item.total} chapters (
                        {item.percent}%)
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
              stroke="var(--surface)"
              fill="var(--foreground)"
              isAnimationActive={true}
              animationDuration={600}
              content={<TreemapContent />}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const b = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border border-border bg-surface p-2 shadow-md text-[11px]">
                      <p className="font-semibold text-foreground">{b.name}</p>
                      <p className="text-foreground-secondary">
                        {b.completed} / {b.size} chapters ({b.percent}%)
                      </p>
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
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
