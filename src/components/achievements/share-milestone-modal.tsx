"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Share2,
  Check,
  Lock,
  Sparkles,
  Download,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type { UserAchievementItem } from "@/actions/achievements";
import { generateMilestoneImageBlob } from "@/lib/achievements/generate-milestone-image";
import { AchievementIcon } from "./achievement-icon";

export type ShareMilestoneModalProps = {
  achievement: UserAchievementItem | null;
  isOpen: boolean;
  onCloseAction: () => void;
};

export function ShareMilestoneModal({
  achievement,
  isOpen,
  onCloseAction,
}: ShareMilestoneModalProps) {
  const { resolvedTheme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const iconContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseAction();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCloseAction]);

  if (!isOpen || !achievement) return null;

  const {
    title,
    description,
    category,
    iconName,
    isUnlocked,
    current,
    total,
    percentage,
  } = achievement;

  const getMilestoneBlob = async (): Promise<Blob | null> => {
    const iconSvgHtml =
      iconContainerRef.current?.querySelector("svg")?.outerHTML;
    return generateMilestoneImageBlob({
      achievement,
      iconSvgHtml,
      theme: resolvedTheme === "dark" ? "dark" : "light",
    });
  };

  const handleShareImage = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const blob = await getMilestoneBlob();
      if (!blob) return;

      const filename = `luma-milestone-${achievement.id}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${title} - Luma Milestone`,
            text: `I unlocked the "${title}" badge in Luma Bible Tracker!`,
          });
          return;
        } catch {
          // Fallback if user cancels or native share fails
        }
      }

      // Fallback: Copy PNG image to clipboard & download
      let copiedToClipboard = false;
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          copiedToClipboard = true;
        } catch {
          // Clipboard image writing might be restricted by browser permissions
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setToastMessage(
        copiedToClipboard
          ? "Image Saved & Copied to Clipboard!"
          : "Image Downloaded!"
      );
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const blob = await getMilestoneBlob();
      if (!blob) return;

      const filename = `luma-milestone-${achievement.id}.png`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setToastMessage("Image Downloaded!");
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onCloseAction}
      />

      {/* Modal Dialog Card */}
      <div className="ui-card relative z-10 flex w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-border p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCloseAction}
          aria-label="Close milestone dialog"
          className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full border border-border bg-surface text-foreground-dim transition-colors hover:text-foreground hover:bg-surface-elevated cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Celestial Artwork Container */}
        <div className="relative flex flex-col items-center text-center pt-2 pb-4">
          {/* Background Radiant Celestial SVG */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
            <svg
              className="w-full h-full"
              viewBox="0 0 360 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="celestialGlow" cx="50%" cy="45%" r="50%">
                  <stop
                    offset="0%"
                    stopColor="var(--foreground)"
                    stopOpacity={isUnlocked ? "0.08" : "0.03"}
                  />
                  <stop
                    offset="60%"
                    stopColor="var(--foreground)"
                    stopOpacity="0.01"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--foreground)"
                    stopOpacity="0"
                  />
                </radialGradient>
              </defs>

              <rect width="360" height="260" fill="url(#celestialGlow)" />

              {/* Orbit Rings */}
              <circle
                cx="180"
                cy="110"
                r="95"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.5"
              />
              <circle
                cx="180"
                cy="110"
                r="68"
                stroke="var(--border-strong)"
                strokeWidth="1"
                strokeDasharray="3 5"
                opacity="0.65"
              />

              {/* Radiating Burst Rays */}
              <line
                x1="180"
                y1="110"
                x2="180"
                y2="15"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.4"
              />
              <line
                x1="180"
                y1="110"
                x2="280"
                y2="50"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.4"
              />
              <line
                x1="180"
                y1="110"
                x2="80"
                y2="50"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.4"
              />
              <line
                x1="180"
                y1="110"
                x2="310"
                y2="140"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.3"
              />
              <line
                x1="180"
                y1="110"
                x2="50"
                y2="140"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.3"
              />

              {/* Sparkles */}
              <circle cx="85" cy="40" r="1.5" fill="var(--foreground-dim)" />
              <circle cx="275" cy="45" r="2" fill="var(--foreground-dim)" />
              <circle cx="65" cy="180" r="1.5" fill="var(--foreground-dim)" />
              <circle cx="295" cy="190" r="2" fill="var(--foreground-dim)" />
            </svg>
          </div>

          {/* Central Large Icon Circle */}
          <div
            ref={iconContainerRef}
            className={`relative z-10 flex size-20 items-center justify-center rounded-3xl border shadow-lg transition-transform ${
              isUnlocked
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface-elevated text-foreground-dim border-border"
            }`}
          >
            <AchievementIcon name={iconName} className="size-9" />
          </div>

          {/* Eyebrow Tag */}
          <div className="mt-4 flex flex-col items-center gap-1.5">
            {isUnlocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-wider text-primary-foreground uppercase shadow-2xs">
                <Sparkles className="size-3" />
                <span>Achievement Unlocked</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1 text-[11px] font-semibold tracking-wider text-foreground-secondary uppercase">
                <Lock className="size-3" />
                <span>Milestone In Progress</span>
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim">
              {category}
            </span>
          </div>

          {/* Title & Description */}
          <h2
            id="milestone-modal-title"
            className="mt-3 text-[22px] font-bold tracking-tight text-foreground"
          >
            {title}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground-secondary max-w-[320px]">
            {description}
          </p>
        </div>

        {/* 3 Stats Tiles */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface-elevated/70 py-2.5 px-1 text-center my-2">
          <div className="px-1">
            <span className="block text-[15px] font-bold tracking-tight text-foreground tabular-nums">
              {current}
            </span>
            <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-foreground-dim mt-0.5">
              Completed
            </span>
          </div>
          <div className="px-1">
            <span className="block text-[15px] font-bold tracking-tight text-foreground tabular-nums">
              {total}
            </span>
            <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-foreground-dim mt-0.5">
              Target
            </span>
          </div>
          <div className="px-1">
            <span
              className={`block text-[15px] font-bold tracking-tight tabular-nums ${
                isUnlocked ? "text-primary" : "text-foreground"
              }`}
            >
              {percentage}%
            </span>
            <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-foreground-dim mt-0.5">
              Progress
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-2">
          {isUnlocked ? (
            <>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleShareImage}
                className="ui-btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Generating Image...</span>
                  </>
                ) : toastMessage ? (
                  <>
                    <Check className="size-4" />
                    <span>{toastMessage}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-4" />
                    <span>Share Milestone Image</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDownloadImage}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated text-[13px] font-medium text-foreground transition-colors hover:bg-surface hover:border-border-strong cursor-pointer active:scale-[0.99] disabled:opacity-70"
              >
                <Download className="size-3.5 text-foreground-dim" />
                <span>Download Image</span>
              </button>

              <button
                type="button"
                onClick={onCloseAction}
                className="flex h-9 w-full items-center justify-center text-[12.5px] font-medium text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-surface-elevated/60 px-3 py-2 text-center">
                <p className="text-[11.5px] text-foreground-dim">
                  Locked achievement. Continue reading to unlock this badge and
                  share your milestone.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseAction}
                className="ui-btn-primary flex h-10 w-full items-center justify-center text-[13px] font-medium cursor-pointer"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
