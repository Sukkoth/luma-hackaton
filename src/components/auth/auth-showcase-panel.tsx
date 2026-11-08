import type React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  backHref?: string;
  backLabel?: string;
  badge?: string;
  quoteTitle: React.ReactNode;
  scriptureRef: string;
  description?: string;
  footerLeft?: string;
  footerRight?: string;
};

export function AuthShowcasePanel({
  backHref = "/",
  backLabel = "Back to Dashboard",
  badge = "CANONICAL READING SANCTUARY",
  quoteTitle,
  scriptureRef,
  description,
  footerLeft = "Daily Reading Sanctuary",
  footerRight = "1 189 Chapters",
}: Props) {
  return (
    <section className="relative hidden w-full flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 text-foreground lg:flex lg:w-1/2 lg:p-14 xl:p-18">
      {/* Generative SVG architectural tapestry adapting to color tokens */}
      <svg
        className="pointer-events-none absolute inset-0 size-full object-cover"
        viewBox="0 0 900 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient
            id="authShowcaseGlow"
            cx="45%"
            cy="40%"
            r="60%"
            fx="40%"
            fy="35%"
          >
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.08" />
            <stop
              offset="55%"
              stopColor="var(--surface-elevated)"
              stopOpacity="0.03"
            />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="authShowcaseArc"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="var(--foreground)"
              stopOpacity="0.22"
            />
            <stop
              offset="45%"
              stopColor="var(--foreground-secondary)"
              stopOpacity="0.12"
            />
            <stop
              offset="75%"
              stopColor="var(--foreground-dim)"
              stopOpacity="0.08"
            />
            <stop
              offset="100%"
              stopColor="var(--foreground)"
              stopOpacity="0.01"
            />
          </linearGradient>
          <linearGradient
            id="authShowcaseBeam"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="var(--foreground-dim)"
              stopOpacity="0.16"
            />
            <stop
              offset="50%"
              stopColor="var(--foreground)"
              stopOpacity="0.1"
            />
            <stop
              offset="100%"
              stopColor="var(--foreground-dim)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Deep ambient light bloom */}
        <rect width="900" height="1200" fill="url(#authShowcaseGlow)" />

        {/* Canonical Sphere Coordinates */}
        <g opacity="0.85">
          <circle
            cx="450"
            cy="550"
            r="140"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1"
          />
          <circle
            cx="450"
            cy="550"
            r="220"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1.25"
            strokeDasharray="3 9"
          />
          <circle
            cx="450"
            cy="550"
            r="320"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1"
            opacity="0.6"
          />
          <circle
            cx="450"
            cy="550"
            r="440"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1.5"
            strokeDasharray="8 12"
            opacity="0.4"
          />
          <circle
            cx="450"
            cy="550"
            r="580"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1"
            strokeDasharray="2 14"
            opacity="0.35"
          />
          <circle
            cx="450"
            cy="550"
            r="740"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1"
            opacity="0.2"
          />
          <circle
            cx="450"
            cy="550"
            r="920"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1"
            strokeDasharray="4 18"
            opacity="0.15"
          />

          {/* Meridian intersecting guide axes */}
          <line
            x1="450"
            y1="0"
            x2="450"
            y2="1200"
            stroke="url(#authShowcaseBeam)"
            strokeWidth="1"
            strokeDasharray="4 8"
            opacity="0.4"
          />
          <line
            x1="0"
            y1="550"
            x2="900"
            y2="550"
            stroke="url(#authShowcaseArc)"
            strokeWidth="1"
            strokeDasharray="4 8"
            opacity="0.25"
          />
          <line
            x1="120"
            y1="120"
            x2="780"
            y2="980"
            stroke="url(#authShowcaseArc)"
            strokeWidth="0.75"
            strokeDasharray="2 10"
            opacity="0.2"
          />
          <line
            x1="780"
            y1="120"
            x2="120"
            y2="980"
            stroke="url(#authShowcaseArc)"
            strokeWidth="0.75"
            strokeDasharray="2 10"
            opacity="0.2"
          />

          {/* Radiant Canonical Crosshairs and Node Markers */}
          <circle
            cx="450"
            cy="550"
            r="4"
            fill="var(--foreground)"
            opacity="0.85"
          />
          <circle
            cx="450"
            cy="330"
            r="3"
            fill="var(--foreground)"
            opacity="0.65"
          />
          <circle
            cx="450"
            cy="770"
            r="3"
            fill="var(--foreground-dim)"
            opacity="0.65"
          />
          <circle
            cx="230"
            cy="550"
            r="3"
            fill="var(--foreground)"
            opacity="0.55"
          />
          <circle
            cx="670"
            cy="550"
            r="3"
            fill="var(--foreground-dim)"
            opacity="0.55"
          />

          {/* Micro coordinate markers */}
          <path
            d="M445 550 H455 M450 545 V555"
            stroke="var(--foreground)"
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M445 110 H455 M450 105 V115"
            stroke="var(--foreground)"
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M445 990 H455 M450 985 V995"
            stroke="var(--foreground-dim)"
            strokeWidth="1"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* Top Header Row with Navigation */}
      <div className="relative z-10 flex items-center justify-between">
        <Link href={backHref} className="ui-btn-secondary ui-btn-sm gap-2">
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          <span>{backLabel}</span>
        </Link>

        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Luma<span className="text-foreground-dim">.</span>
        </span>
      </div>

      {/* Center Typography */}
      <div className="relative z-10 my-auto max-w-lg pt-12">
        {badge && (
          <span className="ui-pill text-[10.5px] font-bold tracking-[0.2em] uppercase">
            {badge}
          </span>
        )}

        <h2 className="leading-[1.15] mt-4 text-[36px] font-light tracking-tight text-foreground xl:text-[44px]">
          {quoteTitle}
        </h2>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px w-8 bg-border-strong" />
          <span className="text-[13px] font-medium tracking-wide text-foreground-secondary">
            {scriptureRef}
          </span>
        </div>

        {description && (
          <p className="mt-6 max-w-md text-[14px] leading-relaxed font-normal text-foreground-secondary">
            {description}
          </p>
        )}
      </div>

      {/* Bottom Status Row */}
      <div className="relative z-10 flex items-center justify-between border-t border-border-subtle pt-6 text-[12px] text-foreground-dim">
        <span>{footerLeft}</span>
        <span className="font-medium text-foreground">{footerRight}</span>
      </div>
    </section>
  );
}
