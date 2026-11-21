type IsometricCubeProps = {
  readonly size?: number;
  readonly className?: string;
};

export function IsometricCube({
  size = 72,
  className = "",
}: IsometricCubeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon Silhouette */}
      <polygon
        points="40,10 68,26 68,58 40,74 12,58 12,26"
        className="stroke-stone-900/15 dark:stroke-stone-200/20 fill-black/[0.015] dark:fill-white/[0.015]"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Front Center Y Edges */}
      <line
        x1="40"
        y1="42"
        x2="40"
        y2="74"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="40"
        y1="42"
        x2="68"
        y2="26"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="40"
        y1="42"
        x2="12"
        y2="26"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      {/* Dashed Interior Wireframe Edges */}
      <line
        x1="40"
        y1="42"
        x2="40"
        y2="10"
        className="stroke-stone-900/15 dark:stroke-white/15"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <line
        x1="40"
        y1="42"
        x2="68"
        y2="58"
        className="stroke-stone-900/15 dark:stroke-white/15"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <line
        x1="40"
        y1="42"
        x2="12"
        y2="58"
        className="stroke-stone-900/15 dark:stroke-white/15"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Center Vertex Node */}
      <circle
        cx="40"
        cy="42"
        r="2"
        className="fill-stone-900/25 dark:fill-white/30"
      />
    </svg>
  );
}

type WireframeOctahedronProps = {
  readonly size?: number;
  readonly className?: string;
};

export function WireframeOctahedron({
  size = 64,
  className = "",
}: WireframeOctahedronProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Pyramid Front Edges */}
      <line
        x1="30"
        y1="6"
        x2="10"
        y2="30"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="30"
        y1="6"
        x2="50"
        y2="30"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="30"
        y1="6"
        x2="30"
        y2="36"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      {/* Bottom Pyramid Front Edges */}
      <line
        x1="30"
        y1="54"
        x2="10"
        y2="30"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="30"
        y1="54"
        x2="50"
        y2="30"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="30"
        y1="54"
        x2="30"
        y2="36"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      {/* Equatorial Ridge */}
      <line
        x1="10"
        y1="30"
        x2="30"
        y2="36"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      <line
        x1="30"
        y1="36"
        x2="50"
        y2="30"
        className="stroke-stone-900/15 dark:stroke-stone-200/20"
        strokeWidth="1.2"
      />
      {/* Dashed Back Ridge & Edges */}
      <line
        x1="10"
        y1="30"
        x2="30"
        y2="24"
        className="stroke-stone-900/10 dark:stroke-stone-200/10"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="30"
        y1="24"
        x2="50"
        y2="30"
        className="stroke-stone-900/10 dark:stroke-stone-200/10"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="30"
        y1="6"
        x2="30"
        y2="24"
        className="stroke-stone-900/10 dark:stroke-stone-200/10"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <line
        x1="30"
        y1="54"
        x2="30"
        y2="24"
        className="stroke-stone-900/10 dark:stroke-stone-200/10"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* Top & Bottom Vertex Nodes */}
      <circle
        cx="30"
        cy="6"
        r="1.5"
        className="fill-stone-900/25 dark:fill-white/30"
      />
      <circle
        cx="30"
        cy="54"
        r="1.5"
        className="fill-stone-900/25 dark:fill-white/30"
      />
    </svg>
  );
}

type AstrolabeCompassProps = {
  readonly size?: number;
  readonly className?: string;
};

export function AstrolabeCompass({
  size = 280,
  className = "",
}: AstrolabeCompassProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin-very-slow ${className}`}
    >
      {/* Outer Dashed Orbit */}
      <circle
        cx="100"
        cy="100"
        r="94"
        className="stroke-stone-900/10 dark:stroke-white/12"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      {/* Secondary Solid Ring */}
      <circle
        cx="100"
        cy="100"
        r="80"
        className="stroke-stone-900/12 dark:stroke-white/15"
        strokeWidth="0.8"
      />
      {/* Inner Precision Ticked Ring */}
      <circle
        cx="100"
        cy="100"
        r="60"
        className="stroke-stone-900/12 dark:stroke-white/15"
        strokeWidth="1"
        strokeDasharray="1 5"
      />
      {/* Central Core Ring */}
      <circle
        cx="100"
        cy="100"
        r="28"
        className="stroke-stone-900/15 dark:stroke-white/20"
        strokeWidth="1"
      />
      {/* 4 Cardinal Crosshair Ray Lines */}
      <line
        x1="100"
        y1="2"
        x2="100"
        y2="198"
        className="stroke-stone-900/12 dark:stroke-white/15"
        strokeWidth="0.8"
      />
      <line
        x1="2"
        y1="100"
        x2="198"
        y2="100"
        className="stroke-stone-900/12 dark:stroke-white/15"
        strokeWidth="0.8"
      />
      {/* Diagonal Spoke Rays */}
      <line
        x1="32"
        y1="32"
        x2="168"
        y2="168"
        className="stroke-stone-900/10 dark:stroke-white/10"
        strokeWidth="0.7"
        strokeDasharray="3 3"
      />
      <line
        x1="32"
        y1="168"
        x2="168"
        y2="32"
        className="stroke-stone-900/10 dark:stroke-white/10"
        strokeWidth="0.7"
        strokeDasharray="3 3"
      />
      {/* Cardinal Marker Dots */}
      <circle
        cx="100"
        cy="20"
        r="2"
        className="fill-stone-900/20 dark:fill-white/25"
      />
      <circle
        cx="100"
        cy="180"
        r="2"
        className="fill-stone-900/20 dark:fill-white/25"
      />
      <circle
        cx="20"
        cy="100"
        r="2"
        className="fill-stone-900/20 dark:fill-white/25"
      />
      <circle
        cx="180"
        cy="100"
        r="2"
        className="fill-stone-900/20 dark:fill-white/25"
      />
    </svg>
  );
}

type GlassTubeProps = {
  readonly length?: string; // e.g. "h-72", "h-96"
  readonly orientation?: "vertical" | "horizontal" | "diagonal";
  readonly className?: string;
};

export function GlassTube({
  length = "h-72",
  orientation = "vertical",
  className = "",
}: GlassTubeProps) {
  if (orientation === "horizontal") {
    return (
      <div
        className={`relative h-7 w-60 sm:w-72 rounded-full border border-stone-900/10 dark:border-white/15 bg-white/30 dark:bg-white/[0.04] backdrop-blur-sm shadow-xs ${className}`}
      >
        {/* Specular Top Glass Edge Highlight */}
        <div className="absolute top-1 inset-x-4 h-0.5 rounded-full bg-white/80 dark:bg-white/35" />
        {/* Subtle Inner Refraction Line */}
        <div className="absolute bottom-1 inset-x-5 h-0.5 rounded-full bg-black/5 dark:bg-white/10" />
      </div>
    );
  }

  if (orientation === "diagonal") {
    return (
      <div
        className={`relative w-7 h-56 rounded-full border border-stone-900/10 dark:border-white/15 bg-white/30 dark:bg-white/[0.04] backdrop-blur-sm shadow-xs rotate-45 ${className}`}
      >
        {/* Specular Left Edge Line */}
        <div className="absolute top-3 left-1 bottom-3 w-0.5 rounded-full bg-white/80 dark:bg-white/35" />
        {/* Subtle Inner Refraction Line */}
        <div className="absolute top-3 right-1 bottom-3 w-0.5 rounded-full bg-black/5 dark:bg-white/10" />
      </div>
    );
  }

  // Vertical orientation (default) - pure, clear architectural glass
  return (
    <div
      className={`relative w-7 sm:w-8 ${length} rounded-full border border-stone-900/10 dark:border-white/15 bg-white/30 dark:bg-white/[0.04] backdrop-blur-sm shadow-xs ${className}`}
    >
      {/* Specular Highlight Streak along the left edge */}
      <div className="absolute top-4 left-1 bottom-4 w-0.5 rounded-full bg-white/90 dark:bg-white/40" />
      {/* Subtle Right Shadow/Refraction Line */}
      <div className="absolute top-4 right-1 bottom-4 w-0.5 rounded-full bg-black/5 dark:bg-white/10" />
      {/* Top and Bottom Glass Meniscus Caps */}
      <div className="absolute top-2 inset-x-2 h-1 rounded-full border border-stone-900/5 dark:border-white/10" />
      <div className="absolute bottom-2 inset-x-2 h-1 rounded-full border border-stone-900/5 dark:border-white/10" />
    </div>
  );
}

type FrostedGlassTileProps = {
  readonly size?: string; // e.g. "size-20"
  readonly rotation?: string; // e.g. "rotate-12"
  readonly className?: string;
};

export function FrostedGlassTile({
  size = "size-20",
  rotation = "rotate-6",
  className = "",
}: FrostedGlassTileProps) {
  return (
    <div
      className={`relative ${size} ${rotation} rounded-2xl border border-black/8 dark:border-white/15 bg-white/50 dark:bg-stone-900/50 backdrop-blur-lg shadow-xs ${className}`}
    >
      {/* Delicate diagonal corner shine line */}
      <div className="absolute top-2 left-2 size-4 border-t border-l border-white/80 dark:border-white/40 rounded-tl-lg" />
      <div className="absolute bottom-2 right-2 size-2 rounded-full bg-black/10 dark:bg-white/15" />
    </div>
  );
}

export type AtmosphericCanvasArtParams = {
  readonly className?: string;
};

export function AtmosphericCanvasArt({
  className = "",
}: AtmosphericCanvasArtParams) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* =========================================================================
          CONTINUOUS ARCHITECTURAL GUIDE RAILS & VECTORS (FULL 5600PX HEIGHT)
          ========================================================================= */}
      <svg
        className="absolute inset-0 size-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rayDiagonal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78716C" stopOpacity="0" />
            <stop offset="50%" stopColor="#78716C" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#78716C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Far Left Hairline Guide (4% width) */}
        <line
          x1="4%"
          y1="0"
          x2="4%"
          y2="100%"
          className="stroke-stone-900/6 dark:stroke-white/8"
          strokeWidth="1"
          strokeDasharray="6 8"
        />

        {/* Inner Left Registration Line (14% width) */}
        <line
          x1="14%"
          y1="40"
          x2="14%"
          y2="100%"
          className="stroke-stone-900/8 dark:stroke-white/10"
          strokeWidth="1"
        />

        {/* Inner Right Registration Line (86% width) */}
        <line
          x1="86%"
          y1="40"
          x2="86%"
          y2="100%"
          className="stroke-stone-900/8 dark:stroke-white/10"
          strokeWidth="1"
        />

        {/* Far Right Hairline Guide (96% width) */}
        <line
          x1="96%"
          y1="0"
          x2="96%"
          y2="100%"
          className="stroke-stone-900/6 dark:stroke-white/8"
          strokeWidth="1"
          strokeDasharray="6 8"
        />

        {/* Precision Crosshairs (+) Down the Entire 5600px Spine */}
        <g className="stroke-stone-900/20 dark:stroke-white/25" strokeWidth="1">
          {/* Stats Zone */}
          <line x1="calc(14% - 6px)" y1="180" x2="calc(14% + 6px)" y2="180" />
          <line x1="14%" y1="174" x2="14%" y2="186" />
          <line x1="calc(86% - 6px)" y1="180" x2="calc(86% + 6px)" y2="180" />
          <line x1="86%" y1="174" x2="86%" y2="186" />

          {/* Stepper Zone Step 1 */}
          <line x1="calc(14% - 6px)" y1="920" x2="calc(14% + 6px)" y2="920" />
          <line x1="14%" y1="914" x2="14%" y2="926" />
          <line x1="calc(86% - 6px)" y1="920" x2="calc(86% + 6px)" y2="920" />
          <line x1="86%" y1="914" x2="86%" y2="926" />

          {/* Stepper Zone Step 2 */}
          <line x1="calc(14% - 6px)" y1="1850" x2="calc(14% + 6px)" y2="1850" />
          <line x1="14%" y1="1844" x2="14%" y2="1856" />
          <line x1="calc(86% - 6px)" y1="1850" x2="calc(86% + 6px)" y2="1850" />
          <line x1="86%" y1="1844" x2="86%" y2="1856" />

          {/* Stepper Zone Step 3 */}
          <line x1="calc(14% - 6px)" y1="2800" x2="calc(14% + 6px)" y2="2800" />
          <line x1="14%" y1="2794" x2="14%" y2="2806" />
          <line x1="calc(86% - 6px)" y1="2800" x2="calc(86% + 6px)" y2="2800" />
          <line x1="86%" y1="2794" x2="86%" y2="2806" />

          {/* Canon Traditions Zone */}
          <line x1="calc(14% - 6px)" y1="3650" x2="calc(14% + 6px)" y2="3650" />
          <line x1="14%" y1="3644" x2="14%" y2="3656" />
          <line x1="calc(86% - 6px)" y1="3650" x2="calc(86% + 6px)" y2="3650" />
          <line x1="86%" y1="3644" x2="86%" y2="3656" />

          {/* Pillars Zone */}
          <line x1="calc(14% - 6px)" y1="4120" x2="calc(14% + 6px)" y2="4120" />
          <line x1="14%" y1="4114" x2="14%" y2="4126" />
          <line x1="calc(86% - 6px)" y1="4120" x2="calc(86% + 6px)" y2="4120" />
          <line x1="86%" y1="4114" x2="86%" y2="4126" />

          {/* Scripture Banner Zone */}
          <line x1="calc(14% - 6px)" y1="4520" x2="calc(14% + 6px)" y2="4520" />
          <line x1="14%" y1="4514" x2="14%" y2="4526" />
          <line x1="calc(86% - 6px)" y1="4520" x2="calc(86% + 6px)" y2="4520" />
          <line x1="86%" y1="4514" x2="86%" y2="4526" />

          {/* Bottom CTA Zone */}
          <line x1="calc(14% - 6px)" y1="5050" x2="calc(14% + 6px)" y2="5050" />
          <line x1="14%" y1="5044" x2="14%" y2="5056" />
          <line x1="calc(86% - 6px)" y1="5050" x2="calc(86% + 6px)" y2="5050" />
          <line x1="86%" y1="5044" x2="86%" y2="5056" />
        </g>

        {/* Dynamic Diagonal Connecting Beams Across All Sections */}
        <line
          x1="0%"
          y1="280"
          x2="48%"
          y2="760"
          stroke="url(#rayDiagonal)"
          strokeWidth="1.2"
        />
        <line
          x1="100%"
          y1="1200"
          x2="52%"
          y2="1750"
          stroke="url(#rayDiagonal)"
          strokeWidth="1.2"
        />
        <line
          x1="0%"
          y1="2200"
          x2="50%"
          y2="2850"
          stroke="url(#rayDiagonal)"
          strokeWidth="1.2"
        />
        <line
          x1="100%"
          y1="3300"
          x2="46%"
          y2="3950"
          stroke="url(#rayDiagonal)"
          strokeWidth="1.2"
        />
        <line
          x1="0%"
          y1="4200"
          x2="52%"
          y2="4850"
          stroke="url(#rayDiagonal)"
          strokeWidth="1.2"
        />
      </svg>

      {/* =========================================================================
          ZONE 1: SCRIPTURE BY NUMBERS / STATS (0 - 600px)
          ========================================================================= */}
      {/* Left Glass Tube & Cube */}
      <div className="absolute top-24 left-3 sm:left-6 lg:left-10 animate-float-slow">
        <GlassTube length="h-72 sm:h-80" />
      </div>
      <div
        className="absolute top-44 left-16 sm:left-24 lg:left-32 animate-drift-slow"
        style={{ animationDelay: "400ms" }}
      >
        <IsometricCube size={88} />
      </div>
      <div
        className="absolute top-84 left-8 sm:left-14 animate-float-reverse"
        style={{ animationDelay: "200ms" }}
      >
        <FrostedGlassTile size="size-16 sm:size-20" rotation="-rotate-12" />
      </div>

      {/* Right Glass Tube, Octahedron & Diagonal Tube */}
      <div className="absolute top-16 right-3 sm:right-6 lg:right-10 animate-float-reverse">
        <GlassTube length="h-80 sm:h-96" />
      </div>
      <div
        className="absolute top-48 right-16 sm:right-28 lg:right-36 animate-float-slow"
        style={{ animationDelay: "300ms" }}
      >
        <WireframeOctahedron size={76} />
      </div>
      <div
        className="absolute top-72 right-6 sm:right-16 animate-drift-slow"
        style={{ animationDelay: "600ms" }}
      >
        <GlassTube orientation="diagonal" />
      </div>

      {/* =========================================================================
          ZONE 2: HORIZONTAL STEPPER PROCESS (600px - 3400px)
          ========================================================================= */}
      {/* Astrolabe Compass Ring at Step 1 */}
      <div className="absolute top-[800px] -left-20 sm:-left-10 opacity-70 dark:opacity-45">
        <AstrolabeCompass size={360} />
      </div>

      {/* Horizontal Tube Beam behind Step 1/2 transition */}
      <div
        className="hidden md:block absolute top-[1100px] right-8 lg:right-20 animate-float-slow"
        style={{ animationDelay: "500ms" }}
      >
        <GlassTube orientation="horizontal" />
      </div>

      {/* 3D Isometric Cube at Step 2 */}
      <div
        className="absolute top-[1450px] right-6 sm:right-16 lg:right-28 animate-drift-slow"
        style={{ animationDelay: "700ms" }}
      >
        <IsometricCube size={96} />
      </div>

      {/* Left Glass Tube at Step 2 */}
      <div className="absolute top-[1700px] left-4 sm:left-10 animate-float-slow">
        <GlassTube length="h-80" />
      </div>
      <div
        className="absolute top-[1850px] left-14 sm:left-24 animate-float-reverse"
        style={{ animationDelay: "300ms" }}
      >
        <FrostedGlassTile size="size-18" rotation="rotate-12" />
      </div>

      {/* Astrolabe Compass Ring at Step 2/3 transition */}
      <div className="absolute top-[2200px] -right-24 sm:-right-12 opacity-65 dark:opacity-40">
        <AstrolabeCompass size={340} />
      </div>

      {/* Right Octahedron Diamond at Step 3 */}
      <div
        className="absolute top-[2600px] right-10 sm:right-24 animate-float-slow"
        style={{ animationDelay: "200ms" }}
      >
        <WireframeOctahedron size={80} />
      </div>

      {/* Left Diagonal Glass Tube at Step 3 */}
      <div
        className="absolute top-[2900px] left-6 sm:left-16 animate-drift-slow"
        style={{ animationDelay: "450ms" }}
      >
        <GlassTube orientation="diagonal" />
      </div>

      {/* =========================================================================
          ZONE 3: UNIVERSAL CHRISTIAN TRADITIONS / CANON MATRIX (3400px - 4000px)
          ========================================================================= */}
      {/* Left Vertical Glass Tube with warm amber core */}
      <div className="absolute top-[3550px] left-3 sm:left-8 animate-float-slow">
        <GlassTube length="h-80" />
      </div>

      {/* Left 3D Isometric Cube */}
      <div
        className="absolute top-[3650px] left-14 sm:left-24 animate-drift-slow"
        style={{ animationDelay: "500ms" }}
      >
        <IsometricCube size={84} />
      </div>

      {/* Right Astrolabe Compass Ring */}
      <div className="absolute top-[3500px] -right-20 sm:-right-8 opacity-70 dark:opacity-45">
        <AstrolabeCompass size={320} />
      </div>

      {/* Right Wireframe Octahedron Diamond */}
      <div
        className="absolute top-[3750px] right-12 sm:right-24 animate-float-reverse"
        style={{ animationDelay: "350ms" }}
      >
        <WireframeOctahedron size={76} />
      </div>

      {/* Right Horizontal Glass Tube */}
      <div
        className="hidden sm:block absolute top-[3900px] right-8 sm:right-18 animate-float-slow"
        style={{ animationDelay: "250ms" }}
      >
        <GlassTube orientation="horizontal" />
      </div>

      {/* =========================================================================
          ZONE 4: CORE PILLARS & PSALM BANNER (4000px - 4700px)
          ========================================================================= */}
      {/* Left Frosted Glass Tile and Diagonal Tube */}
      <div
        className="absolute top-[4100px] left-6 sm:left-14 animate-float-reverse"
        style={{ animationDelay: "200ms" }}
      >
        <FrostedGlassTile size="size-20" rotation="-rotate-6" />
      </div>
      <div
        className="absolute top-[4250px] left-4 sm:left-12 animate-drift-slow"
        style={{ animationDelay: "600ms" }}
      >
        <GlassTube orientation="diagonal" />
      </div>

      {/* Right 3D Wireframe Cube */}
      <div
        className="absolute top-[4150px] right-8 sm:right-20 animate-float-slow"
        style={{ animationDelay: "400ms" }}
      >
        <IsometricCube size={88} />
      </div>

      {/* Right Vertical Glass Tube */}
      <div className="absolute top-[4350px] right-4 sm:right-10 animate-float-reverse">
        <GlassTube length="h-72" />
      </div>

      {/* Center-Left Wireframe Octahedron near Psalm 119:105 */}
      <div
        className="absolute top-[4550px] left-8 sm:left-20 animate-float-slow"
        style={{ animationDelay: "300ms" }}
      >
        <WireframeOctahedron size={72} />
      </div>

      {/* =========================================================================
          ZONE 5: BOTTOM TWILIGHT CTA & FOOTER (4700px - 5600px)
          ========================================================================= */}
      {/* Left Astrolabe Compass framing Twilight Lake sky */}
      <div className="absolute top-[4800px] -left-20 sm:-left-8 opacity-60 dark:opacity-40">
        <AstrolabeCompass size={340} />
      </div>

      {/* Left Glass Tube */}
      <div className="absolute top-[5050px] left-4 sm:left-12 animate-float-slow">
        <GlassTube length="h-72" />
      </div>

      {/* Right 3D Isometric Cube & Octahedron */}
      <div
        className="absolute top-[4900px] right-8 sm:right-20 animate-drift-slow"
        style={{ animationDelay: "350ms" }}
      >
        <IsometricCube size={80} />
      </div>
      <div
        className="absolute top-[5150px] right-4 sm:right-14 animate-float-reverse"
        style={{ animationDelay: "550ms" }}
      >
        <WireframeOctahedron size={68} />
      </div>
    </div>
  );
}
