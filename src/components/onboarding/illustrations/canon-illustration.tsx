export function CanonIllustration() {
  return (
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
  );
}
