import React from "react";

type SlideType =
  "scripture_peace" | "guided_plans" | "canonical_tracking" | "habits_growth";

type OnboardingHeroIllustrationProps = {
  slideId: SlideType;
};

export function OnboardingHeroIllustration({
  slideId,
}: OnboardingHeroIllustrationProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-[420px] items-center justify-center overflow-visible py-2">
      <svg
        viewBox="0 0 380 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-44 w-full select-none sm:h-52 md:h-60"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle Ambient Radial Aura */}
          <radialGradient id="heroCoreGlow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="#82ADD4"
              className="dark:stop-[#82ADD4]"
              stopOpacity="0.22"
            />
            <stop offset="60%" stopColor="#82ADD4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#82ADD4" stopOpacity="0" />
          </radialGradient>

          {/* Warm Flame & Gold Glow */}
          <radialGradient id="flameAmberGlow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="#DDFD2C"
              className="dark:stop-[#DDFD2C]"
              stopOpacity="0.32"
            />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Golden / Amber Ribbon Gradient */}
          <linearGradient
            id="goldRibbonGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#DDFD2C" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Page Gradient */}
          <linearGradient id="pageGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        {/* Global Ambient Glow across the canvas */}
        <circle cx="190" cy="135" r="130" fill="url(#heroCoreGlow)" />

        {/* Atmospheric Celestial Sparkle Constellation */}
        <g className="fill-black/30 dark:fill-white/35">
          <circle cx="35" cy="55" r="1.5" />
          <circle cx="70" cy="35" r="2" />
          <circle cx="115" cy="65" r="1.4" />
          <circle cx="265" cy="40" r="1.8" />
          <circle cx="315" cy="65" r="2.2" />
          <circle cx="350" cy="45" r="1.4" />
          <circle cx="45" cy="180" r="1.6" />
          <circle cx="340" cy="190" r="1.8" />
          <circle cx="85" cy="230" r="1.4" />
          <circle cx="295" cy="235" r="1.5" />
          <circle cx="190" cy="20" r="2.5" />
        </g>

        {/* --- SLIDE 1: Read Scripture With Peace Daily --- */}
        {slideId === "scripture_peace" && (
          <g className="transition-all duration-500 ease-out">
            {/* Celestial Radiant Rings */}
            <circle
              cx="190"
              cy="135"
              r="110"
              fill="none"
              strokeDasharray="4 6"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <circle
              cx="190"
              cy="135"
              r="82"
              fill="none"
              strokeDasharray="3 5"
              className="stroke-black/15 dark:stroke-white/15"
              strokeWidth="1.2"
            />

            {/* Radiant Sunburst Rays */}
            <g className="stroke-black/15 dark:stroke-white/15">
              <line
                x1="190"
                y1="135"
                x2="190"
                y2="35"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <line
                x1="190"
                y1="135"
                x2="125"
                y2="55"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <line
                x1="190"
                y1="135"
                x2="255"
                y2="55"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <line
                x1="190"
                y1="135"
                x2="70"
                y2="105"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <line
                x1="190"
                y1="135"
                x2="310"
                y2="105"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
            </g>

            {/* Glowing Starburst Cross Emblem above Bible */}
            <g transform="translate(190, 48)">
              <circle
                cx="0"
                cy="0"
                r="14"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.2"
              />
              <path
                d="M 0,-7 L 0,7 M -5,-2 L 5,-2"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Grand Floating 3D Open Scripture Bible */}
            <g transform="translate(190, 142)">
              {/* Outer Book Cover Thickness / Depth */}
              <path
                d="M -90,40 C -46,24 -15,26 0,38 C 15,26 46,24 90,40 L 90,51 C 46,35 15,37 0,49 C -15,37 -46,35 -90,51 Z"
                className="fill-black/15 dark:fill-black/60"
              />

              {/* Left Page Leaf Stack (Curved depth) */}
              <path
                d="M -88,36 C -46,22 -14,24 0,36 L 0,-20 C -14,-32 -46,-34 -88,-20 Z"
                className="fill-white stroke-black/20 dark:fill-[#1a1a20] dark:stroke-white/20"
                strokeWidth="1.6"
              />

              {/* Right Page Leaf Stack */}
              <path
                d="M 0,36 C 14,24 46,22 88,36 L 88,-20 C 46,-34 14,-32 0,-20 Z"
                className="fill-slate-50 stroke-black/20 dark:fill-[#202028] dark:stroke-white/20"
                strokeWidth="1.6"
              />

              {/* Subtle Turning Inner Page Flutter */}
              <path
                d="M -76,28 C -40,16 -12,18 0,28 L 0,-12 C -12,-22 -40,-24 -76,-12 Z"
                className="fill-slate-100/80 stroke-black/10 dark:fill-[#141418] dark:stroke-white/10"
                strokeWidth="0.9"
              />
              <path
                d="M 0,28 C 12,18 40,16 76,28 L 76,-12 C 40,-24 12,-22 0,-12 Z"
                className="fill-white stroke-black/10 dark:fill-[#1c1c22] dark:stroke-white/10"
                strokeWidth="0.9"
              />

              {/* Sacred Scripture Text Lines */}
              <g className="stroke-black/35 dark:stroke-white/35">
                {/* Left page text */}
                <path
                  d="M -70,-4 L -18,-14 M -70,6 L -18,-4 M -70,16 L -24,6 M -70,26 L -18,16"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Right page text */}
                <path
                  d="M 18,-14 L 70,-4 M 18,-4 L 70,6 M 18,6 L 64,16 M 18,16 L 70,26"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>

              {/* Illuminated Drop Cap Accent on Left Page */}
              <rect
                x="-74"
                y="-16"
                width="10"
                height="10"
                rx="2"
                fill="#82ADD4"
              />

              {/* Floating Golden Bookmark Ribbon Draping Down */}
              <path
                d="M 0,-22 L 0,60 L 6,52 L 12,60 L 12,-22 Z"
                fill="url(#goldRibbonGrad)"
              />
            </g>

            {/* Floating Serene Verse Card below Scripture */}
            <g transform="translate(190, 240)">
              <rect
                x="-80"
                y="-13"
                width="160"
                height="26"
                rx="13"
                className="fill-white/90 stroke-black/15 shadow-sm dark:fill-[#1a1a20]/90 dark:stroke-white/15"
                strokeWidth="1.2"
              />
              <circle cx="-60" cy="0" r="4.5" fill="#DDFD2C" />
              <path
                d="M -44,0 L 62,0"
                className="stroke-black/60 dark:stroke-white/70"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}

        {/* --- SLIDE 2: Walk With Guided Reading Plans --- */}
        {slideId === "guided_plans" && (
          <g className="transition-all duration-500 ease-out">
            {/* Celestial Navigation Azimuth Rings */}
            <circle
              cx="190"
              cy="90"
              r="72"
              fill="none"
              strokeDasharray="3 5"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <circle
              cx="190"
              cy="90"
              r="46"
              fill="none"
              className="stroke-black/15 dark:stroke-white/15"
              strokeWidth="1.2"
            />

            {/* 8-Direction Celestial Compass Rose */}
            <g transform="translate(190, 90)">
              {/* Compass Major Pointers */}
              <polygon
                points="0,-34 6,-5 34,0 6,5 0,34 -6,5 -34,0 -6,-5"
                className="fill-black dark:fill-white"
              />
              {/* Compass Minor Intercardinal Pointers */}
              <polygon
                points="0,-20 4,-3 20,0 4,3 0,20 -4,3 -20,0 -4,-3"
                transform="rotate(45)"
                className="fill-black/50 dark:fill-white/60"
              />
              {/* Center Pivot Gem */}
              <circle
                cx="0"
                cy="0"
                r="7"
                className="fill-white stroke-black dark:fill-[#141418] dark:stroke-white"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="3" fill="#82ADD4" />
            </g>

            {/* Flowing Floating Winding S-Curved Journey Trail */}
            <path
              d="M 190,135 C 270,165 290,205 225,230 C 160,255 115,240 85,268"
              fill="none"
              strokeDasharray="6 6"
              className="stroke-black/40 dark:stroke-white/50"
              strokeWidth="3"
            />

            {/* Waypoint 1: 7-Day Fast Start */}
            <g transform="translate(265, 168)">
              <rect
                x="-38"
                y="-13"
                width="76"
                height="26"
                rx="13"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.4"
              />
              <circle cx="-22" cy="0" r="4.5" fill="#DDFD2C" />
              <path
                d="M -10,0 L 24,0"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Waypoint 2: 30-Day Gospels */}
            <g transform="translate(230, 225)">
              <rect
                x="-42"
                y="-13"
                width="84"
                height="26"
                rx="13"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.4"
              />
              <circle cx="-26" cy="0" r="4.5" fill="#82ADD4" />
              <path
                d="M -13,0 L 28,0"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Waypoint 3: 365-Day Whole Bible */}
            <g transform="translate(105, 258)">
              <rect
                x="-46"
                y="-13"
                width="92"
                height="26"
                rx="13"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.4"
              />
              <circle cx="-29" cy="0" r="4.5" fill="#F59E0B" />
              <path
                d="M -16,0 L 32,0"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Glowing Waypoint Orbs */}
            {[
              { cx: 190, cy: 137 },
              { cx: 256, cy: 180 },
              { cx: 205, cy: 232 },
              { cx: 140, cy: 248 },
            ].map((node, i) => (
              <circle
                key={i}
                cx={node.cx}
                cy={node.cy}
                r={4.5}
                fill="#DDFD2C"
                className="stroke-black/20 dark:stroke-black"
                strokeWidth="1.2"
              />
            ))}
          </g>
        )}

        {/* --- SLIDE 3: Track All Books & Spiritual Milestones --- */}
        {slideId === "canonical_tracking" && (
          <g className="transition-all duration-500 ease-out">
            {/* Concentric Honor Rings */}
            <circle
              cx="190"
              cy="130"
              r="120"
              fill="none"
              strokeDasharray="6 6"
              className="stroke-black/10 dark:stroke-white/10"
              strokeWidth="1"
            />
            <circle
              cx="190"
              cy="130"
              r="86"
              fill="none"
              strokeDasharray="4 4"
              className="stroke-black/15 dark:stroke-white/15"
              strokeWidth="1.4"
            />

            {/* Old Testament Shield Left (Tilted -6deg) */}
            <g transform="translate(80, 110) rotate(-6)">
              <rect
                x="-38"
                y="-26"
                width="76"
                height="52"
                rx="12"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.4"
              />
              <circle cx="-20" cy="-10" r="4.5" fill="#82ADD4" />
              <path
                d="M -9,-10 L 22,-10"
                className="stroke-black dark:stroke-white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M -20,2 L 22,2 M -20,11 L 12,11"
                className="stroke-black/35 dark:stroke-white/40"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* New Testament Shield Right (Tilted +6deg) */}
            <g transform="translate(300, 110) rotate(6)">
              <rect
                x="-38"
                y="-26"
                width="76"
                height="52"
                rx="12"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.4"
              />
              <circle cx="-20" cy="-10" r="4.5" fill="#DDFD2C" />
              <path
                d="M -9,-10 L 22,-10"
                className="stroke-black dark:stroke-white"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M -20,2 L 22,2 M -20,11 L 12,11"
                className="stroke-black/35 dark:stroke-white/40"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* Majestic Central 8-Point Star Milestone Laurel Seal */}
            <g transform="translate(190, 130)">
              {/* Outer Star Aura */}
              <circle
                cx="0"
                cy="0"
                r="48"
                className="fill-white/80 stroke-black/20 shadow-md dark:fill-[#16161c]/90 dark:stroke-white/20"
                strokeWidth="2"
              />
              <circle
                cx="0"
                cy="0"
                r="38"
                className="fill-slate-50 stroke-black/10 dark:fill-[#1f1f26] dark:stroke-white/10"
                strokeWidth="1.2"
              />

              {/* 8-Pointed Radiant Gold Star */}
              <path
                d="M 0,-22 L 5.5,-7.5 L 22,0 L 5.5,7.5 L 0,22 L -5.5,7.5 L -22,0 L -5.5,-7.5 Z"
                className="fill-black dark:fill-white"
              />
              <circle cx="0" cy="0" r="5.5" fill="#DDFD2C" />

              {/* Laurel Wreath Wings */}
              <path
                d="M -32,12 C -42,0 -42,-18 -30,-28 M 32,12 C 42,0 42,-18 30,-28"
                fill="none"
                className="stroke-black/60 dark:stroke-white/70"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>

            {/* Bottom 66 Books Global Progress Arc */}
            <g transform="translate(190, 248)">
              <rect
                x="-70"
                y="-12"
                width="140"
                height="24"
                rx="12"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.2"
              />
              <circle cx="-50" cy="0" r="4" fill="#82ADD4" />
              <path
                d="M -36,0 L 48,0"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}

        {/* --- SLIDE 4: Grow Faith With Daily Habits --- */}
        {slideId === "habits_growth" && (
          <g className="transition-all duration-500 ease-out">
            {/* Dynamic Angled Concentric Habit Orbits */}
            <g transform="translate(190, 130) rotate(-10)">
              <circle
                cx="0"
                cy="0"
                r="120"
                fill="none"
                strokeDasharray="5 6"
                className="stroke-black/10 dark:stroke-white/10"
                strokeWidth="1"
              />
              <circle
                cx="0"
                cy="0"
                r="86"
                fill="none"
                strokeDasharray="3 5"
                className="stroke-black/15 dark:stroke-white/15"
                strokeWidth="1.3"
              />
            </g>

            {/* Central Amber Warmth Glow for Sacred Devotional Flame */}
            <circle cx="190" cy="115" r="78" fill="url(#flameAmberGlow)" />

            {/* Free-Floating Sacred Lantern */}
            <g transform="translate(190, 105)">
              {/* Suspension Ring */}
              <circle
                cx="0"
                cy="-38"
                r="7"
                fill="none"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
              />
              <path
                d="M 0,-31 L 0,-20"
                className="stroke-black dark:stroke-white"
                strokeWidth="2"
              />

              {/* Lantern Dome Roof */}
              <path
                d="M -24,-8 C -24,-22 24,-22 24,-8 Z"
                className="fill-slate-100 stroke-black dark:fill-[#1e1e24] dark:stroke-white"
                strokeWidth="2"
              />

              {/* Lantern Glass Body */}
              <path
                d="M -22,-8 L -28,38 L 28,38 L 22,-8 Z"
                className="fill-white/80 stroke-black dark:fill-[#141418]/80 dark:stroke-white"
                strokeWidth="2"
              />
              {/* Glass Mullions */}
              <line
                x1="-9"
                y1="-6"
                x2="-11"
                y2="36"
                className="stroke-black/20 dark:stroke-white/20"
                strokeWidth="1.5"
              />
              <line
                x1="9"
                y1="-6"
                x2="11"
                y2="36"
                className="stroke-black/20 dark:stroke-white/20"
                strokeWidth="1.5"
              />

              {/* Lantern Base Rim */}
              <path
                d="M -30,38 L 30,38 L 25,48 L -25,48 Z"
                className="fill-slate-100 stroke-black dark:fill-[#1e1e24] dark:stroke-white"
                strokeWidth="2"
              />

              {/* Sacred Living Devotional Flame inside */}
              <path
                d="M 0,2 Q 13,16 0,31 Q -13,16 0,2 Z"
                fill="url(#goldRibbonGrad)"
              />
              <circle cx="0" cy="22" r="3.5" fill="#FFFFFF" />
            </g>

            {/* 7 Floating Habit Day Streak Badges positioned dynamically along orbit */}
            {[
              { x: 55, y: 105, label: "M", active: true },
              { x: 90, y: 175, label: "T", active: true },
              { x: 142, y: 225, label: "W", active: true },
              { x: 198, y: 235, label: "T", active: true },
              { x: 254, y: 218, label: "F", active: true },
              { x: 295, y: 165, label: "S", active: true },
              { x: 320, y: 95, label: "S", active: false },
            ].map((token, i) => (
              <g key={i} transform={`translate(${token.x}, ${token.y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r={token.active ? 13 : 10}
                  className={
                    token.active
                      ? "fill-[#DDFD2C] stroke-black/20 dark:stroke-black"
                      : "fill-white stroke-black/15 dark:fill-[#1e1e24] dark:stroke-white/20"
                  }
                  strokeWidth="1.4"
                />
                {token.active ? (
                  <path
                    d="M -3.5,0 L -1,3 L 4.5,-2.5"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <circle
                    cx="0"
                    cy="0"
                    r="2.5"
                    className="fill-black/30 dark:fill-white/30"
                  />
                )}
              </g>
            ))}

            {/* Habit Streak Counter Badge at bottom */}
            <g transform="translate(190, 255)">
              <rect
                x="-60"
                y="-11"
                width="120"
                height="22"
                rx="11"
                className="fill-white stroke-black/15 shadow-sm dark:fill-[#1e1e24] dark:stroke-white/20"
                strokeWidth="1.2"
              />
              <circle cx="-42" cy="0" r="3.5" fill="#DDFD2C" />
              <path
                d="M -30,0 L 44,0"
                className="stroke-black/60 dark:stroke-white/70"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
