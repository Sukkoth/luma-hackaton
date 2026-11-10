"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, Award } from "lucide-react";
import { celebratePlanCompletion } from "@/lib/confetti";
import type { SerializableAchievement } from "@/data/achievements";
import { AchievementIcon } from "./achievement-icon";

export type AchievementToastBannerProps = {
  queue: ReadonlyArray<SerializableAchievement>;
  onDismissAction: ({ achievementId }: { achievementId: string }) => void;
};

export function AchievementToastBanner({
  queue,
  onDismissAction,
}: AchievementToastBannerProps) {
  const current = queue[0] ?? null;
  const [isVisible, setIsVisible] = useState(false);
  const celebratedIdsRef = useRef<Set<string>>(new Set());

  // Show banner and trigger celebratory confetti once per unique unlock
  useEffect(() => {
    if (!current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    if (!celebratedIdsRef.current.has(current.id)) {
      celebratedIdsRef.current.add(current.id);
      celebratePlanCompletion({ durationMs: 3400 });
    }

    return () => cancelAnimationFrame(frame);
  }, [current]);

  const handleDismiss = useCallback(() => {
    if (!current) return;
    const dismissedId = current.id;
    setIsVisible(false);

    // Slide out animation delay before switching to next item
    setTimeout(() => {
      onDismissAction({ achievementId: dismissedId });
    }, 250);
  }, [current, onDismissAction]);

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (current && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [current, isVisible, handleDismiss]);

  if (!current) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[100] w-full max-w-[390px] px-3 transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
      }`}
    >
      <div className="ui-card flex items-center gap-3.5 rounded-[22px] p-3.5 shadow-2xl">
        {/* Left Glowing Icon Circle */}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-primary bg-primary text-primary-foreground shadow-xs">
          <AchievementIcon name={current.iconName} className="size-5" />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="flex items-center gap-1 rounded-[6px] border border-border bg-surface-elevated px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-foreground-secondary uppercase">
              <Award className="size-2.5" />
              <span>Achievement Unlocked</span>
            </span>
          </div>
          <h4 className="text-[13.5px] font-bold text-foreground truncate tracking-tight">
            {current.title}
          </h4>
          <p className="text-[11px] text-foreground-secondary line-clamp-1">
            {current.description}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss achievement notification"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground-dim opacity-70 transition-opacity hover:opacity-100 hover:bg-surface-elevated cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
