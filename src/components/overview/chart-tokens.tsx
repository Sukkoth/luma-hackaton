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
            stroke="var(--border-strong)"
            strokeWidth="1.5"
          />
        </pattern>

        {/* Area Gradient for Hero Area Chart */}
        <linearGradient id="overviewAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.16} />
          <stop
            offset="100%"
            stopColor="var(--foreground)"
            stopOpacity={0.01}
          />
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
    <div className="rounded-[10px] border border-border bg-surface px-2.5 py-1.5 shadow-md backdrop-blur-md">
      {label && (
        <p className="text-[11px] font-medium text-foreground-dim mb-1">
          {label}
        </p>
      )}
      {payload.map((entry, index) => (
        <p
          key={`item-${index}`}
          className="text-[12px] font-semibold tabular-nums text-foreground flex items-center gap-1.5"
        >
          {entry.name && (
            <span className="font-normal text-foreground-secondary">
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
