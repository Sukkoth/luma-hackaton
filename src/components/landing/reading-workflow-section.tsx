"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type StepItem = {
  readonly num: string;
  readonly title: string;
  readonly description: string;
  readonly colorClass: string;
};

const STEPS: ReadonlyArray<StepItem> = [
  {
    num: "1",
    title: "Choose your tradition",
    description:
      "Select your canon tradition from 4 historic streams: Protestant (66 books), Catholic (73 books), Eastern Orthodox (76-78 books), or Ethiopian Tewahedo (81 books).",
    colorClass: "text-[#92400E] dark:text-[#D97706]",
  },
  {
    num: "2",
    title: "Set your pace & timezone",
    description:
      "Configure your daily chapter target and localized timezone. Grace-filled streak freezes automatically protect your momentum so a missed day never resets your habit.",
    colorClass: "text-[#D97706] dark:text-[#F59E0B]",
  },
  {
    num: "3",
    title: "Read, track & comprehend",
    description:
      "Tap completed chapters in a tactile matrix. Consult AI Socratic study companions for 2-paragraph cultural context summaries, outlines, and knowledge checks.",
    colorClass: "text-[#F59E0B] dark:text-[#FCD34D]",
  },
];

export function ReadingWorkflowSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(
        0,
        Math.min(1, currentScroll / totalScrollable)
      );
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative mt-28 w-full">
      {/* Desktop: Full-Bleed Pinned Horizontal Walkthrough (matching reference frames 06-09) */}
      <div ref={containerRef} className="relative hidden md:block h-[320vh]">
        <div className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden py-10 sm:py-14">
          {/* Top Section Header */}
          <div className="mx-auto w-full max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary backdrop-blur-md dark:border-white/10 dark:bg-stone-900/60">
              <span>Faithful Daily Rhythm</span>
            </div>
            <h2 className="mt-4 text-[38px] lg:text-[46px] font-normal tracking-tight text-foreground">
              People grow when habits stay gentle.
            </h2>
          </div>

          {/* Floating Atmospheric Cloud with Glass Tiles (top-left decoration matching reference frame 06) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-8 top-12 z-0 hidden lg:block opacity-90 dark:opacity-40 animate-float-slow"
          >
            <div className="relative size-60">
              <Image
                src="/images/golden_cloud.png"
                alt=""
                fill
                className="object-contain"
              />
              {/* Floating frosted glass squares over cloud */}
              <div className="absolute top-10 left-6 size-12 rounded-xl border border-black/8 bg-white/40 shadow-xs backdrop-blur-sm dark:border-white/15 dark:bg-white/10" />
              <div className="absolute top-20 left-22 size-10 rounded-lg border border-black/6 bg-white/30 shadow-2xs backdrop-blur-xs dark:border-white/10 dark:bg-white/5" />
            </div>
          </div>

          {/* Floating Cloud in Mid-Space (matching reference frame 08) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-1/4 top-36 z-0 hidden lg:block opacity-85 dark:opacity-35 animate-float-reverse"
          >
            <div className="relative size-52">
              <Image
                src="/images/golden_cloud.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Horizontal Stepper Canvas with Giant Typography */}
          <div className="relative z-10 w-full overflow-hidden">
            {/* The horizontal track translating across the screen */}
            <div
              className="flex items-center will-change-transform transition-transform ease-out duration-75"
              style={{
                // Translates from 0vw to -115vw as scrollProgress advances 0 -> 1
                transform: `translateX(-${scrollProgress * 115}vw)`,
                width: "215vw",
              }}
            >
              {STEPS.map((step, idx) => (
                <div
                  key={step.num}
                  className="flex w-[68vw] shrink-0 items-end justify-between pl-10 sm:pl-16 pr-8 sm:pr-12"
                >
                  {/* Step Unit: Giant Numeral + Bottom Text Block */}
                  <div className="flex items-end gap-8 sm:gap-12">
                    {/* Giant Typographic Numeral (Monumental Scale matching video) */}
                    <div className="select-none leading-none">
                      <span
                        className={`text-[240px] sm:text-[320px] lg:text-[400px] xl:text-[440px] font-bold tracking-tighter ${step.colorClass}`}
                      >
                        {step.num}
                      </span>
                    </div>

                    {/* Step Title & Copy placed at base of number */}
                    <div className="mb-8 max-w-sm sm:max-w-md pb-2">
                      <h3 className="text-[26px] sm:text-[30px] lg:text-[34px] font-normal tracking-tight text-foreground leading-tight">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-[14px] sm:text-[15px] lg:text-[16px] leading-relaxed text-foreground-secondary">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Delicate Vertical Divider Line between steps */}
                  {idx < STEPS.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden sm:block h-[340px] w-px bg-black/10 dark:bg-white/10"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Step Indicator Bar */}
          <div className="mx-auto flex items-center justify-center gap-2 pt-4">
            {STEPS.map((step, idx) => {
              const activeIdx = Math.min(
                STEPS.length - 1,
                Math.floor(scrollProgress * STEPS.length)
              );
              return (
                <div
                  key={step.num}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    activeIdx === idx
                      ? "w-8 bg-primary"
                      : "w-2 bg-black/15 dark:bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Fallback: Stacked Numerals for touch screens */}
      <div className="block md:hidden px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/70 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary backdrop-blur-md dark:border-white/10 dark:bg-stone-900/60">
            <span>Faithful Daily Rhythm</span>
          </div>
          <h2 className="mt-4 text-[28px] font-normal tracking-tight text-foreground">
            People grow when habits stay gentle.
          </h2>
        </div>

        <div className="mt-12 space-y-12">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="border-b border-black/8 pb-8 dark:border-white/10"
            >
              <span
                className={`text-[120px] font-bold leading-none tracking-tighter ${step.colorClass}`}
              >
                {step.num}
              </span>
              <h3 className="mt-2 text-[22px] font-normal tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
