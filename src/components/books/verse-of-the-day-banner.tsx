"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, X, ArrowRight, Bookmark } from "lucide-react";
import type { VerseOfTheDayData } from "@/lib/youversion";
import { Button } from "@/components/ui/button";

type Props = {
  totalReadChapters: number;
  totalChaptersAcrossCanon: number;
  canonPercentage: number;
  verse?: VerseOfTheDayData;
};

export function VerseOfTheDayBanner({
  totalReadChapters,
  totalChaptersAcrossCanon,
  canonPercentage,
  verse,
}: Props) {
  const [showArtworkModal, setShowArtworkModal] = useState(false);

  const reference = verse?.reference || "Psalm 119:105";
  const text =
    verse?.text || "Your word is a lamp to my feet and a light to my path.";
  const version = verse?.version || "English Standard Version";

  const remainingChapters = Math.max(
    0,
    totalChaptersAcrossCanon - totalReadChapters
  );

  return (
    <div className="w-full space-y-6">
      {/* ── Unboxed Editorial Masthead ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Scripture Canon & Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            Immerse in the Word, chapter by chapter.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Track canonical progress, check off read chapters, and dive into
            original testament texts with daily verse reflections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link href="/plans">
            <Button
              type="button"
              variant="default"
              size="default"
              leftIcon={<Bookmark className="size-4" />}
              className="rounded-xl font-semibold shadow-xs"
            >
              Explore Plans
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Signature Horizon Ribbon ── */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Column 1: Canonical Progress */}
          <div className="pr-0 md:pr-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Canonical Progress
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Current Tracker
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {totalReadChapters}
                </span>
                <span className="text-xs font-semibold text-primary">
                  of {totalChaptersAcrossCanon} chapters read ({canonPercentage}%)
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {remainingChapters > 0
                  ? `${remainingChapters} chapters remaining to complete your current canonical pass.`
                  : "All chapters across this canon completed! Outstanding faithfulness."}
              </p>
            </div>

            {/* Canon Progress Gauge */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Canon completion</span>
                <span className="text-primary font-medium">
                  {canonPercentage}% finished
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, canonPercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Verse of the Day */}
          <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Verse of the Day
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                YouVersion
              </span>
            </div>

            <div className="space-y-1.5">
              {verse?.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setShowArtworkModal(true)}
                  className="group block w-full cursor-pointer text-left transition-opacity hover:opacity-90 focus:outline-none"
                  aria-label="View verse artwork"
                  title="Click to view artwork"
                >
                  <blockquote className="text-xs sm:text-sm font-medium leading-relaxed text-foreground tracking-tight transition-colors group-hover:text-foreground/80 line-clamp-2">
                    &ldquo;{text}&rdquo;
                  </blockquote>
                </button>
              ) : (
                <blockquote className="text-xs sm:text-sm font-medium leading-relaxed text-foreground tracking-tight line-clamp-2">
                  &ldquo;{text}&rdquo;
                </blockquote>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">{reference}</span>
                  <span className="text-muted-foreground text-[11px]">
                    {version}
                  </span>
                </div>
                {verse?.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setShowArtworkModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    <span>View artwork</span>
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verse of the Day Artwork Modal */}
      {showArtworkModal && verse?.imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Verse of the Day Artwork"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in"
        >
          <div className="ui-card relative max-h-[90vh] w-full max-w-lg overflow-hidden p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {reference}
                </span>
                <span className="text-xs text-muted-foreground">
                  {version}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowArtworkModal(false)}
                className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-xl bg-muted">
              <Image
                src={verse.imageUrl}
                alt={`${reference} Verse of the Day Artwork`}
                fill
                sizes="(max-width: 640px) 90vw, 500px"
                className="object-cover"
                unoptimized
                priority
              />
            </div>

            {verse.attribution && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {verse.attribution}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
