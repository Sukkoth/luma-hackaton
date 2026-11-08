"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { completeOnboardingAction } from "@/actions/onboarding";
import { OnboardingShowcase, ONBOARDING_SLIDES } from "./onboarding-showcase";
import { TrackerSetupForm } from "./tracker-setup-form";

type Props = {
  userName?: string;
};

export function OnboardingView({ userName = "Reader" }: Props) {
  const router = useRouter();

  // Phase: 'showcase' (intro carousel) -> 'setup' (canon & tracker creation)
  const [phase, setPhase] = useState<"showcase" | "setup">("showcase");
  const [slideIndex, setSlideIndex] = useState(0);

  // Selected canon state (default: standard 66 books)
  const [selectedCanonId, setSelectedCanonId] = useState<string>("protestant");

  // Form submission feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-black/2 blur-3xl dark:bg-white/2" />
      </div>

      <div className="glass-panel relative z-10 w-full max-w-155 rounded-4xl p-6 shadow-2xl backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-[#121216]/80">
        {/* Brand bar */}
        <div className="flex items-center justify-between border-b border-black/6 pb-4 dark:border-white/8">
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-semibold tracking-tight text-black dark:text-white">
              Luma<span className="text-zinc-400 dark:text-zinc-600">.</span>
            </span>
            <span className="rounded-full border border-zinc-300 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] font-medium text-white dark:border-zinc-700 dark:bg-white dark:text-zinc-950">
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

        {/* Phase 1: Showcase Carousel */}
        {phase === "showcase" ? (
          <OnboardingShowcase
            slideIndex={slideIndex}
            onSelectSlide={({ index }) => setSlideIndex(index)}
            onNext={handleNextSlide}
            onPrev={handlePrevSlide}
          />
        ) : (
          /* Phase 2: Canon Selection & Tracker Creation */
          <div className="py-6">
            <div className="text-left">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
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
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <TrackerSetupForm
              selectedCanonId={selectedCanonId}
              onSelectCanon={({ canonId }) => setSelectedCanonId(canonId)}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
