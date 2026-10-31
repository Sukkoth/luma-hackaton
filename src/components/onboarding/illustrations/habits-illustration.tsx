export function HabitsIllustration() {
  return (
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
  );
}
