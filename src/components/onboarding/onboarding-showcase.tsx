import { ArrowRight, ArrowLeft } from "lucide-react";
import { OnboardingHeroIllustration } from "./onboarding-hero-illustration";

export type SlideId =
  "scripture_peace" | "guided_plans" | "canonical_tracking" | "habits_growth";

export type OnboardingSlide = {
  id: SlideId;
  badge: string;
  title: string;
  subtitle: string;
};

export const ONBOARDING_SLIDES: ReadonlyArray<OnboardingSlide> = [
  {
    id: "scripture_peace",
    badge: "DAILY MEDITATION",
    title: "Read Scripture With Peace Daily",
    subtitle:
      "Discover sacred verses, track every chapter, and reflect in a clean, distraction-free space.",
  },
  {
    id: "guided_plans",
    badge: "GUIDED PLANS",
    title: "Walk With Guided Reading Plans",
    subtitle:
      "Explore flexible reading journeys—from focused 30-day gospels and epistles to whole Bible cover-to-cover walkthroughs.",
  },
  {
    id: "canonical_tracking",
    badge: "MULTI-CANON & MILESTONES",
    title: "Track All Books & Spiritual Milestones",
    subtitle:
      "Log chapters across Protestant, Catholic, Orthodox, and Ethiopian canons while unlocking spiritual milestone honors.",
  },
  {
    id: "habits_growth",
    badge: "CONSISTENCY & STREAKS",
    title: "Grow Faith With Daily Habits",
    subtitle:
      "Build an enduring devotional rhythm with habit streaks, streak freeze protections, and velocity analytics.",
  },
];

type Props = {
  slideIndex: number;
  onSelectSlide: (params: { index: number }) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function OnboardingShowcase({
  slideIndex,
  onSelectSlide,
  onNext,
  onPrev,
}: Props) {
  const activeSlide = ONBOARDING_SLIDES[slideIndex] || ONBOARDING_SLIDES[0]!;

  return (
    <div className="py-4 sm:py-6">
      {/* Bespoke Celestial Hero Illustration */}
      <OnboardingHeroIllustration slideId={activeSlide.id} />

      {/* Slide Content */}
      <div className="mt-4 text-center sm:mt-6">
        <span className="rounded-full bg-[#82ADD4]/15 px-3 py-1 text-[10px] font-medium tracking-wider text-[#3c6b90] uppercase dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
          {activeSlide.badge}
        </span>

        <h2 className="mt-4 text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
          {activeSlide.title}
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-[#666666] sm:text-[14px] dark:text-[#9CA3AF]">
          {activeSlide.subtitle}
        </p>
      </div>

      {/* Stepper Indicators */}
      <div className="mt-10 flex items-center justify-center gap-1.5">
        {ONBOARDING_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => onSelectSlide({ index: idx })}
            className={`h-1.5 rounded-full transition-all ${
              idx === slideIndex
                ? "w-8 bg-black dark:bg-[#DDFD2C]"
                : "w-2 bg-black/15 dark:bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {slideIndex > 0 ? (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 rounded-[14px] border border-black/8 bg-white/70 px-4 py-2.5 text-[13px] font-normal text-black hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-[14px] bg-black px-6 py-2.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
        >
          <span>
            {slideIndex === ONBOARDING_SLIDES.length - 1
              ? "Continue to Setup"
              : "Next"}
          </span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
