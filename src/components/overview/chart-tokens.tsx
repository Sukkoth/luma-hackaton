"use client";

import React from "react";

export function ChartDefs() {
  return (
    <svg className="absolute size-0 pointer-events-none" aria-hidden="true">
      <defs>
        {/* Diagonal Hatch Pattern for Unread / Empty / Track bars */}
        <pattern
          id="overviewHatchPattern"
          width="6"
          height="6"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
        </pattern>

        {/* Finer Hatch Pattern for Donut Track */}
        <pattern
          id="donutHatchPattern"
          width="8"
          height="8"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
        </pattern>

        {/* Area Gradient for Hero Area Chart with Warm Radiant Amber */}
        <linearGradient id="overviewAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CustomChartTooltip({
  active,
  payload,
  label,
  valueSuffix = "",
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
  valueSuffix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg backdrop-blur-md">
      {label && (
        <p className="text-[11px] font-medium text-muted-foreground mb-1">
          {label}
        </p>
      )}
      {payload.map((entry, index) => (
        <p
          key={`item-${index}`}
          className="text-xs font-semibold tabular-nums text-foreground flex items-center gap-1.5"
        >
          {entry.name && (
            <span className="font-normal text-muted-foreground">
              {entry.name}:
            </span>
          )}
          <span>
            {entry.value} {valueSuffix}
          </span>
        </p>
      ))}
    </div>
  );
}
