import { PeaceIllustration } from "./illustrations/peace-illustration";
import { PlansIllustration } from "./illustrations/plans-illustration";
import { CanonIllustration } from "./illustrations/canon-illustration";
import { HabitsIllustration } from "./illustrations/habits-illustration";

type SlideType =
  "scripture_peace" | "guided_plans" | "canonical_tracking" | "habits_growth";

type Props = {
  slideId: SlideType;
};

export function OnboardingHeroIllustration({ slideId }: Props) {
  return (
    <div className="relative mx-auto flex w-full max-w-105 items-center justify-center overflow-visible py-2">
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
            <stop offset="0%" stopColor="#82ADD4" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#82ADD4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#82ADD4" stopOpacity="0" />
          </radialGradient>

          {/* Warm Flame & Gold Glow */}
          <radialGradient id="flameAmberGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#DDFD2C" stopOpacity="0.32" />
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

        {/* Dynamic Slide Scene */}
        {slideId === "scripture_peace" && <PeaceIllustration />}
        {slideId === "guided_plans" && <PlansIllustration />}
        {slideId === "canonical_tracking" && <CanonIllustration />}
        {slideId === "habits_growth" && <HabitsIllustration />}
      </svg>
    </div>
  );
}
