"use client";

import { useEffect, useState, useRef } from "react";
import { BookMarked, Calendar, ShieldCheck, Sparkles } from "lucide-react";

type StatConfig = {
  readonly label: string;
  readonly target: number;
  readonly suffix: string;
  readonly decimals?: number;
  readonly helper: string;
};

const STATS: ReadonlyArray<StatConfig> = [
  {
    label: "Canons Supported",
    target: 4,
    suffix: " Traditions",
    helper: "Protestant to Ethiopian (81b)",
  },
  {
    label: "Canonical Scope",
    target: 1189,
    suffix: "+",
    helper: "Full Chapter Matrices",
  },
  {
    label: "Curated Plans",
    target: 30,
    suffix: "+ Plans",
    helper: "7-Day to Full-Year Journeys",
  },
  {
    label: "Comprehension",
    target: 100,
    suffix: "%",
    helper: "AI Socratic Insights",
  },
];

type CountUpValueParams = {
  readonly target: number;
  readonly isTriggered: boolean;
};

function useCountUp({ target, isTriggered }: CountUpValueParams): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!isTriggered) return;

    let startTime: number | null = null;
    const duration = 1200; // ms

    let animId: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, isTriggered]);

  return isTriggered ? val : target;
}

type StatCardProps = {
  readonly stat: StatConfig;
  readonly isTriggered: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly index: number;
};

function StatCard({
  stat,
  isTriggered,
  isFirst,
  isLast,
  index,
}: StatCardProps) {
  const currentCount = useCountUp({ target: stat.target, isTriggered });

  return (
    <div
      style={{
        transitionDelay: `${index * 130}ms`,
      }}
      className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-[26px] bg-[#E29D28] p-6 sm:p-7 text-stone-950 shadow-sm transition-all duration-700 ease-out hover:-translate-y-1.5 hover:shadow-lg dark:bg-[#D97706] dark:text-stone-950 ${
        isTriggered
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-[0.98]"
      }`}
    >
      {/* Left circular cutout notch (unless first card in row on desktop) */}
      {!isFirst && (
        <div
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute -left-4 top-1/2 -translate-y-1/2 size-8 rounded-full bg-background shadow-inner"
        />
      )}

      {/* Right circular cutout notch (unless last card in row on desktop) */}
      {!isLast && (
        <div
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 size-8 rounded-full bg-background shadow-inner"
        />
      )}

      {/* Label & helper header */}
      <div>
        <p className="text-[12px] font-bold tracking-wider text-stone-900/80 uppercase">
          {stat.label}
        </p>
      </div>

      {/* Massive metric number */}
      <div className="my-4">
        <p className="text-[38px] sm:text-[46px] md:text-[52px] font-bold tracking-tight text-stone-950 leading-none">
          {currentCount.toLocaleString()}
          <span className="text-[22px] sm:text-[28px] font-semibold">
            {stat.suffix}
          </span>
        </p>
      </div>

      {/* Footnote */}
      <div>
        <p className="text-[13px] font-medium text-stone-900/75">
          {stat.helper}
        </p>
      </div>
    </div>
  );
}

export function InterlockingStats() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="relative mx-auto mt-20 w-full py-4">
      {/* Section Eyebrow */}
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/70 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary backdrop-blur-md dark:border-white/10 dark:bg-stone-900/60">
          <Sparkles className="size-3 text-primary animate-pulse" />
          <span>Scripture by the numbers</span>
        </div>
        <h2 className="mt-4 text-[28px] sm:text-[36px] md:text-[44px] font-normal tracking-tight text-foreground">
          Built for intentional daily endurance.
        </h2>
      </div>

      {/* Interlocking Notched Badges Row */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5">
        {STATS.map((stat, idx) => (
          <StatCard
            key={stat.label}
            stat={stat}
            isTriggered={isIntersecting}
            isFirst={idx === 0}
            isLast={idx === STATS.length - 1}
            index={idx}
          />
        ))}
      </div>

      {/* Endorsements / Cohorts Strip */}
      <div className="relative mt-5 overflow-hidden rounded-2xl border border-black/8 bg-white/60 p-5 shadow-2xs backdrop-blur-md sm:p-6 dark:border-white/10 dark:bg-stone-900/50">
        <div className="flex flex-wrap items-center justify-around gap-4 text-center text-[13px] font-medium text-foreground-secondary sm:text-[14px]">
          <span className="flex items-center gap-2">
            <BookMarked className="size-4 text-primary" />4 Canon Traditions
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            30+ Reading Plans
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Timezone-Safe Deadlines
          </span>
          <span className="hidden sm:inline text-border">•</span>
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Socratic AI Companion
          </span>
        </div>
      </div>
    </section>
  );
}
