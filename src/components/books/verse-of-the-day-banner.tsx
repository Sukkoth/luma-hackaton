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
      <section className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Verse of the Day */}
        <div className="glass-panel relative flex flex-col justify-between overflow-hidden rounded-[26px] p-6 sm:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-[10px] border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  <Sparkles className="size-3.5" />
                </span>
                <span className="text-[12px] font-medium tracking-wide text-zinc-600 dark:text-zinc-400">
                  Verse of the Day
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  YouVersion
                </span>
                <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
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
                <blockquote className="text-[20px] font-light leading-relaxed text-black transition-colors group-hover:text-zinc-600 sm:text-[22px] dark:text-white dark:group-hover:text-zinc-300">
                  &ldquo;{text}&rdquo;
                </blockquote>
              </button>
            ) : (
              <blockquote className="mt-4 text-[20px] font-light leading-relaxed text-black sm:text-[22px] dark:text-white">
                &ldquo;{text}&rdquo;
              </blockquote>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/4 pt-3 text-[13px] text-[#777777] dark:border-white/8 dark:text-[#9CA3AF]">
            <span className="font-medium text-black dark:text-white">
              {reference}
            </span>
            <div className="flex items-center gap-3">
              <span>{version}</span>
            </div>
          </div>
        </div>

        {/* Today's Active Plan Reading */}
        <div className="glass-panel flex flex-col justify-between rounded-[26px] p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[12px] font-medium text-zinc-600 dark:text-zinc-400">
                <Calendar className="size-3.5 text-zinc-900 dark:text-zinc-100" />
                <span>Today&apos;s Reading</span>
              </span>
              <Link
                href="/plans"
                className="text-[12px] font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
              >
                View Plans
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                    <Bookmark className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                      Romans 8:1–39
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Bible in a Year • Day 212
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  94%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/4 pt-3 text-[12px] text-zinc-500 dark:border-white/8 dark:text-zinc-400">
            <span>Bible Tracker Total</span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
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
          <div className="glass-panel relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-[28px] border border-white/90 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
            <div className="flex items-center justify-between border-b border-black/4 pb-3 dark:border-white/8">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-black dark:text-white">
                  {reference}
                </span>
                <span className="rounded-sm bg-black/5 px-2 py-0.5 text-[10px] text-[#666666] dark:bg-white/10 dark:text-[#A1A1AA]">
                  {version}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowArtworkModal(false)}
                className="flex size-7 items-center justify-center rounded-full bg-black/5 text-[#666666] transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-black/20">
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
              <p className="mt-3 text-center text-[11px] text-[#888888] dark:text-[#9CA3AF]">
                {verse.attribution}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
