export function PlansIllustration() {
  return (
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
  );
}
