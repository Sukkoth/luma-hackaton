"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  Flame,
  Bookmark,
  Heart,
  Sun,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { CANON_OPTIONS } from "@/lib/schemas/onboarding";
import { completeOnboardingAction } from "@/actions/onboarding";
import { OnboardingHeroIllustration } from "./onboarding-hero-illustration";

type SlideId =
  "scripture_peace" | "guided_plans" | "canonical_tracking" | "habits_growth";

type OnboardingSlide = {
  id: SlideId;
  badge: string;
  title: string;
  subtitle: string;
};

const ONBOARDING_SLIDES: ReadonlyArray<OnboardingSlide> = [
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

const TRACKER_COLORS = [
  { name: "Gold", value: "#F59E0B" },
  { name: "Sapphire", value: "#3B82F6" },
  { name: "Emerald", value: "#10B981" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Slate", value: "#71717A" },
];

const TRACKER_ICONS = [
  { id: "book-open", label: "Open Book", icon: BookOpen },
  { id: "bookmark", label: "Bookmark", icon: Bookmark },
  { id: "compass", label: "Compass", icon: Compass },
  { id: "heart", label: "Heart", icon: Heart },
  { id: "flame", label: "Flame", icon: Flame },
  { id: "sun", label: "Sun", icon: Sun },
];

type OnboardingViewProps = {
  userName?: string;
};

export function OnboardingView({ userName = "Reader" }: OnboardingViewProps) {
  const router = useRouter();

  // Phase: 'showcase' (intro carousel) -> 'setup' (canon & tracker creation)
  const [phase, setPhase] = useState<"showcase" | "setup">("showcase");
  const [slideIndex, setSlideIndex] = useState(0);

  // Selected canon state (default: standard 66 books)
  const [selectedCanonId, setSelectedCanonId] = useState<string>("protestant");
  const [showCanonPicker, setShowCanonPicker] = useState(false);

  // Form submission feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeSlide = ONBOARDING_SLIDES[slideIndex] || ONBOARDING_SLIDES[0]!;

  const selectedCanon =
    CANON_OPTIONS.find((c) => c.id === selectedCanonId) || CANON_OPTIONS[0]!;

  const handleNextSlide = () => {
    if (slideIndex < ONBOARDING_SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setPhase("setup");
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await completeOnboardingAction({ formData });

    if (!result.success) {
      setErrorMessage(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Background ambient bloom */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#82ADD4]/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[#DDFD2C]/10 blur-3xl" />
      </div>

      <div className="glass-panel relative z-10 w-full max-w-[620px] rounded-[32px] p-6 shadow-2xl backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-[#121216]/80">
        {/* Brand bar */}
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-normal tracking-tight text-black dark:text-white">
              Scripture<span className="text-[#82ADD4]">.</span>
            </span>
            <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[10px] font-medium text-black">
              Onboarding
            </span>
          </div>

          {phase === "showcase" ? (
            <button
              type="button"
              onClick={() => setPhase("setup")}
              className="text-[12px] font-normal text-[#666666] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
            >
              Skip to Setup
            </button>
          ) : (
            <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
              Welcome, {userName.split(" ")[0]}
            </span>
          )}
        </div>

        {/* Phase 1: Showcase Carousel with Bespoke Celestial SVG Artwork */}
        {phase === "showcase" ? (
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
                  onClick={() => setSlideIndex(idx)}
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
                  onClick={handlePrevSlide}
                  className="inline-flex items-center gap-1.5 rounded-[14px] border border-black/[0.08] bg-white/70 px-4 py-2.5 text-[13px] font-normal text-black hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextSlide}
                className="inline-flex items-center gap-2 rounded-[14px] bg-black px-6 py-2.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <span>
                  {slideIndex === ONBOARDING_SLIDES.length - 1
                    ? "Continue to Setup"
                    : "Next"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Phase 2: Canon Selection & Tracker Creation (Forms Rule Compliant) */
          <div className="py-6">
            <div className="text-left">
              <span className="text-[11px] font-medium tracking-wider text-[#82ADD4] uppercase">
                STEP 2 OF 2 • CANON & TRACKER SETUP
              </span>
              <h2 className="mt-1 text-[24px] font-normal tracking-tight text-black sm:text-[28px] dark:text-white">
                Set Up Your Reading Tracker
              </h2>
              <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                A tracker holds your personal Bible reading progress, logs, and
                habit streaks.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-[14px] border border-red-500/20 bg-red-500/10 p-3 text-[12px] font-normal text-red-600 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Canon Selection Section: Default is Standard 66 books with a change button */}
            <div className="mt-6 rounded-[20px] border border-black/[0.08] bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
                    SELECTED BIBLE CANON
                  </span>
                  <h3 className="text-[16px] font-medium text-black dark:text-white">
                    {selectedCanon.name}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-[#666666] dark:text-[#9CA3AF]">
                    {selectedCanon.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCanonPicker(!showCanonPicker)}
                  className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-black shadow-2xs hover:bg-black/5 dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/15"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>{showCanonPicker ? "Done" : "Change"}</span>
                </button>
              </div>

              {/* Collapsible Canon Options List */}
              {showCanonPicker && (
                <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                  <span className="text-[11px] font-normal text-[#888888] dark:text-[#A1A1AA]">
                    Choose from 4 historical Christian traditions:
                  </span>
                  <div className="grid gap-2">
                    {CANON_OPTIONS.map((canon) => {
                      const isSelected = canon.id === selectedCanonId;
                      return (
                        <button
                          key={canon.id}
                          type="button"
                          onClick={() => {
                            setSelectedCanonId(canon.id);
                            setShowCanonPicker(false);
                          }}
                          className={`flex items-start justify-between rounded-[14px] border p-3 text-left transition-all ${
                            isSelected
                              ? "border-black/30 bg-black/[0.03] dark:border-white/30 dark:bg-white/[0.06]"
                              : "border-black/[0.06] bg-white/50 hover:bg-white/90 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-black dark:text-white">
                                {canon.name}
                              </span>
                              {canon.id === "protestant" && (
                                <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.2 text-[9px] font-medium text-black">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-[#666666] dark:text-[#9CA3AF]">
                              {canon.subtitle}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 shrink-0 text-[#82ADD4]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Uncontrolled Tracker Creation Form (Forms Rule Compliant) */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Hidden input carrying over selected canon */}
              <input type="hidden" name="canon" value={selectedCanonId} />

              {/* Tracker Name */}
              <div>
                <label
                  htmlFor="tracker-name"
                  className="block text-[12px] font-medium text-black dark:text-white"
                >
                  Tracker Name
                </label>
                <div className="relative mt-1.5">
                  <BookOpen className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                  <input
                    id="tracker-name"
                    name="name"
                    type="text"
                    required
                    defaultValue="Personal Reading"
                    placeholder="e.g. Personal Reading"
                    className="w-full rounded-[14px] border border-black/[0.08] bg-white/70 py-2.5 pr-4 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
                  />
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="block text-[12px] font-medium text-black dark:text-white">
                  Accent Color
                </label>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  {TRACKER_COLORS.map((c, idx) => (
                    <label
                      key={c.name}
                      className="group relative flex cursor-pointer items-center justify-center"
                    >
                      <input
                        type="radio"
                        name="color"
                        value={c.value}
                        defaultChecked={idx === 0}
                        className="peer sr-only"
                      />
                      <span
                        style={{ backgroundColor: c.value }}
                        className="flex h-9 w-9 items-center justify-center rounded-full shadow-xs transition-all duration-150 hover:scale-105 peer-checked:scale-105 peer-checked:[&>svg]:opacity-100"
                      >
                        <Check className="h-4 w-4 stroke-[3] text-white opacity-0 drop-shadow-xs transition-opacity duration-150" />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Icon Badge Selection */}
              <div>
                <label className="block text-[12px] font-medium text-black dark:text-white">
                  Icon Badge
                </label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {TRACKER_ICONS.map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <label
                        key={item.id}
                        className="relative flex cursor-pointer items-center justify-center"
                      >
                        <input
                          type="radio"
                          name="icon"
                          value={item.id}
                          defaultChecked={idx === 0}
                          className="peer sr-only"
                        />
                        <span className="flex h-11 w-full items-center justify-center rounded-[12px] border border-black/[0.08] bg-white/70 text-[#666666] shadow-2xs transition-all peer-checked:border-black peer-checked:bg-black peer-checked:text-white dark:border-white/10 dark:bg-white/[0.05] dark:text-[#9CA3AF] dark:peer-checked:border-[#DDFD2C] dark:peer-checked:bg-[#DDFD2C] dark:peer-checked:text-black">
                          <IconComp className="h-4 w-4" />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-black py-3 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initializing Tracker...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Onboarding & Begin</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
