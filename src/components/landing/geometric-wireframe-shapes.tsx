export type GeometricWireframeShapesParams = {
  readonly variant?: "stats" | "cta";
};

export function GeometricWireframeShapes({
  variant = "stats",
}: GeometricWireframeShapesParams) {
  if (variant === "cta") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 z-0 overflow-hidden"
      >
        {/* Left cluster */}
        <div className="absolute top-8 left-6 sm:left-14 size-16 rounded-2xl border border-white/20 bg-white/3 backdrop-blur-2xs animate-float-slow" />
        <div className="absolute top-24 left-16 sm:left-28 size-12 rounded-xl border border-white/15 bg-white/2 animate-float-reverse" />
        <div className="absolute top-40 left-8 sm:left-20 size-20 rounded-2xl border border-white/20 bg-white/3 animate-float-slow" />

        {/* Right cluster */}
        <div className="absolute top-6 right-8 sm:right-16 size-18 rounded-2xl border border-white/20 bg-white/3 backdrop-blur-2xs animate-float-reverse" />
        <div className="absolute top-20 right-20 sm:right-32 size-14 rounded-xl border border-white/15 bg-white/2 animate-float-slow" />
        <div className="absolute top-36 right-10 sm:right-22 size-20 rounded-2xl border border-white/20 bg-white/3 animate-float-reverse" />

        {/* Upper center scatter */}
        <div className="absolute top-2 left-1/3 size-14 rounded-xl border border-white/15 bg-white/2 animate-float-slow" />
        <div className="absolute top-4 right-1/3 size-12 rounded-xl border border-white/15 bg-white/2 animate-float-reverse" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Left side wireframe outline squares/cubes (matching reference video frame 04) */}
      <div className="absolute top-6 left-2 sm:left-8 size-16 rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.015] animate-float-slow" />
      <div
        className="absolute top-20 left-12 sm:left-24 size-14 rounded-xl border border-black/7 dark:border-white/9 bg-black/[0.01] dark:bg-white/[0.01] animate-float-reverse"
        style={{ animationDelay: "300ms" }}
      />
      <div
        className="absolute top-44 left-4 sm:left-12 size-20 rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.015] animate-float-slow"
        style={{ animationDelay: "600ms" }}
      />
      <div
        className="absolute bottom-16 left-8 sm:left-20 size-12 rounded-xl border border-black/6 dark:border-white/8 bg-black/[0.01] dark:bg-white/[0.01] animate-float-reverse"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="absolute bottom-6 left-16 sm:left-36 size-16 rounded-2xl border border-black/7 dark:border-white/9 bg-black/[0.01] dark:bg-white/[0.01] animate-float-slow"
        style={{ animationDelay: "450ms" }}
      />

      {/* Right side wireframe outline squares/cubes */}
      <div className="absolute top-8 right-4 sm:right-10 size-18 rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.015] animate-float-reverse" />
      <div
        className="absolute top-24 right-14 sm:right-28 size-12 rounded-xl border border-black/7 dark:border-white/9 bg-black/[0.01] dark:bg-white/[0.01] animate-float-slow"
        style={{ animationDelay: "200ms" }}
      />
      <div
        className="absolute top-48 right-6 sm:right-16 size-20 rounded-2xl border border-black/8 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.015] animate-float-reverse"
        style={{ animationDelay: "500ms" }}
      />
      <div
        className="absolute bottom-20 right-12 sm:right-24 size-14 rounded-xl border border-black/6 dark:border-white/8 bg-black/[0.01] dark:bg-white/[0.01] animate-float-slow"
        style={{ animationDelay: "350ms" }}
      />
      <div
        className="absolute bottom-8 right-2 sm:right-8 size-16 rounded-2xl border border-black/7 dark:border-white/9 bg-black/[0.015] dark:bg-white/[0.015] animate-float-reverse"
        style={{ animationDelay: "100ms" }}
      />

      {/* Upper center subtle scatter framing the headline */}
      <div
        className="absolute top-2 left-[28%] size-12 rounded-xl border border-black/6 dark:border-white/8 bg-black/[0.01] dark:bg-white/[0.01] animate-float-slow"
        style={{ animationDelay: "250ms" }}
      />
      <div
        className="absolute top-4 right-[28%] size-14 rounded-xl border border-black/6 dark:border-white/8 bg-black/[0.01] dark:bg-white/[0.01] animate-float-reverse"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );
}
