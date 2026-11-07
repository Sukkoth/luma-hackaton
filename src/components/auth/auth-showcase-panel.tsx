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
    <section className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#0D0D0F] p-10 text-white lg:flex lg:w-1/2 lg:p-14 xl:p-18 dark:bg-[#070708]">
      {/* Generative SVG architectural tapestry */}
      <svg
        className="pointer-events-none absolute inset-0 size-full object-cover"
        viewBox="0 0 900 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
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
            <stop offset="0%" stopColor="#1E1E22" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#121215" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#070708" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id="authShowcaseArc"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#71717A" stopOpacity="0.14" />
            <stop offset="75%" stopColor="#DDFD2C" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient
            id="authShowcaseBeam"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#71717A" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#71717A" stopOpacity="0" />
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
          <circle cx="450" cy="550" r="4" fill="#DDFD2C" opacity="0.9" />
          <circle cx="450" cy="330" r="3" fill="#FFFFFF" opacity="0.7" />
          <circle cx="450" cy="770" r="3" fill="#71717A" opacity="0.7" />
          <circle cx="230" cy="550" r="3" fill="#FFFFFF" opacity="0.6" />
          <circle cx="670" cy="550" r="3" fill="#71717A" opacity="0.6" />

          {/* Micro coordinate markers */}
          <path
            d="M445 550 H455 M450 545 V555"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M445 110 H455 M450 105 V115"
            stroke="#DDFD2C"
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M445 990 H455 M450 985 V995"
            stroke="#71717A"
            strokeWidth="1"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* Top Header Row with Navigation */}
      <div className="relative z-10 flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12px] font-normal text-white/90 shadow-2xs backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          <span>{backLabel}</span>
        </Link>

        <span className="text-[14px] font-light tracking-wide text-white/80">
          Luma<span className="text-[#DDFD2C]">.</span>
        </span>
      </div>

      {/* Center Typography */}
      <div className="relative z-10 my-auto max-w-lg pt-12">
        {badge && (
          <span className="inline-block text-[11px] font-medium tracking-[0.2em] text-[#DDFD2C] uppercase">
            {badge}
          </span>
        )}

        <h2 className="leading-[1.12] mt-4 text-[38px] font-light tracking-tight text-white xl:text-[46px]">
          {quoteTitle}
        </h2>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px w-8 bg-[#DDFD2C]/80" />
          <span className="text-[13px] font-normal tracking-wide text-white/75">
            {scriptureRef}
          </span>
        </div>

        {description && (
          <p className="mt-6 max-w-md text-[14px] leading-relaxed font-light text-white/60">
            {description}
          </p>
        )}
      </div>

      {/* Bottom Status Row */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[12px] text-white/60">
        <span>{footerLeft}</span>
        <span className="text-white/80">{footerRight}</span>
      </div>
    </section>
  );
}
