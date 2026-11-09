"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Calendar, Bookmark, X } from "lucide-react";
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
      <section className="mt-3 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Verse of the Day */}
        <div className="ui-card relative flex flex-col justify-between overflow-hidden p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-[10px] border border-border bg-primary-muted text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="text-[12.5px] font-medium tracking-wide text-foreground-secondary">
                  Verse of the Day
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="ui-pill text-[10px] font-medium">
                  YouVersion
                </span>
                <span className="ui-pill-primary text-[10px] font-medium uppercase tracking-wider">
                  Daily Light
                </span>
              </div>
            </div>

            {verse?.imageUrl ? (
              <button
                type="button"
                onClick={() => setShowArtworkModal(true)}
                className="group mt-4 block w-full cursor-pointer text-left transition-opacity hover:opacity-85 focus:outline-hidden"
                aria-label="View verse artwork"
                title="Click to view artwork"
              >
                <blockquote className="text-[20px] font-normal leading-relaxed text-foreground transition-colors group-hover:text-foreground-secondary sm:text-[22px]">
                  &ldquo;{text}&rdquo;
                </blockquote>
              </button>
            ) : (
              <blockquote className="mt-4 text-[20px] font-normal leading-relaxed text-foreground sm:text-[22px]">
                &ldquo;{text}&rdquo;
              </blockquote>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-[13px] text-foreground-dim">
            <span className="font-semibold text-foreground">{reference}</span>
            <div className="flex items-center gap-3">
              <span>{version}</span>
            </div>
          </div>
        </div>

        {/* Today's Active Plan Reading */}
        <div className="ui-card flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12.5px] font-medium text-foreground-secondary">
                <Calendar className="size-3.5 text-primary" />
                <span>Today&apos;s Reading</span>
              </span>
              <Link
                href="/plans"
                className="text-[12px] font-medium text-primary underline-offset-4 hover:underline"
              >
                View Plans
              </Link>
            </div>

            <div className="mt-4 rounded-[14px] border border-border-subtle bg-surface-elevated p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
                    <Bookmark className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-foreground">
                      Romans 8:1–39
                    </h4>
                    <p className="text-[11px] text-foreground-dim">
                      Bible in a Year • Day 212
                    </p>
                  </div>
                </div>
                <span className="ui-pill text-[10px] font-medium">94%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-[12px] text-foreground-dim">
            <span>Bible Tracker Total</span>
            <span className="font-medium text-foreground">
              {totalReadChapters} / {totalChaptersAcrossCanon} ch (
              {canonPercentage}%)
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in"
        >
          <div className="ui-card relative max-h-[90vh] w-full max-w-lg overflow-hidden p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-foreground">
                  {reference}
                </span>
                <span className="ui-pill text-[10px] font-medium text-foreground-dim">
                  {version}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowArtworkModal(false)}
                className="flex size-7 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary transition-colors hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-[14px] bg-surface-elevated">
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
              <p className="mt-3 text-center text-[11px] text-foreground-dim">
                {verse.attribution}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
