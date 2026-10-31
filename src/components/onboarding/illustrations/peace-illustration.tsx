export function PeaceIllustration() {
  return (
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
        <rect x="-74" y="-16" width="10" height="10" rx="2" fill="#82ADD4" />

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
  );
}
