"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Calendar, Bookmark, X } from "lucide-react";
import type { VerseOfTheDayData } from "@/lib/youversion";

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

  return (
    <>
      <section className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Verse of the Day */}
        <div className="ui-card relative flex flex-col justify-between overflow-hidden p-5 sm:p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <BookOpen className="size-3.5" />
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Daily Scripture
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                YouVersion
              </span>
            </div>

            {verse?.imageUrl ? (
              <button
                type="button"
                onClick={() => setShowArtworkModal(true)}
                className="group mt-3.5 block w-full cursor-pointer text-left transition-opacity hover:opacity-90 focus:outline-none"
                aria-label="View verse artwork"
                title="Click to view artwork"
              >
                <blockquote className="text-lg sm:text-xl font-normal leading-relaxed text-foreground tracking-tight transition-colors group-hover:text-foreground/80">
                  &ldquo;{text}&rdquo;
                </blockquote>
              </button>
            ) : (
              <blockquote className="mt-3.5 text-lg sm:text-xl font-normal leading-relaxed text-foreground tracking-tight">
                &ldquo;{text}&rdquo;
              </blockquote>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
            <span className="font-semibold text-primary">{reference}</span>
            <span className="text-muted-foreground">{version}</span>
          </div>
        </div>

        {/* Today's Active Plan Reading */}
        <div className="ui-card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Calendar className="size-3.5 text-primary" />
                <span>Today&apos;s Reading</span>
              </span>
              <Link
                href="/plans"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View Plans
              </Link>
            </div>

            <div className="mt-3.5 rounded-xl border border-border/60 bg-muted/50 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Bookmark className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      Romans 8
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Assigned Reading
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary tabular-nums">
                  Day 1
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground">Canon Progress</span>
            <span className="font-semibold text-foreground tabular-nums">
              {totalReadChapters} / {totalChaptersAcrossCanon} ({canonPercentage}%)
            </span>
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
    </>
  );
}
