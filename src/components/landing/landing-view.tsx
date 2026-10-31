"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";
import { CanonShowcaseSection } from "./canon-showcase-section";
import { PillarsSection } from "./pillars-section";
import { LandingFooter } from "./landing-footer";

export function LandingView() {
  const [selectedCanonId, setSelectedCanonId] = useState<string>("protestant");

  return (
    <div className="mx-auto flex min-h-dvh max-w-350 flex-col px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Hero Showcase */}
      <section className="relative mt-4 overflow-hidden rounded-3xl border border-black/8 bg-white/70 p-8 shadow-xs backdrop-blur-md sm:p-12 md:p-16 dark:border-white/10 dark:bg-white/3">
        {/* Ambient radial glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-[#82ADD4]/15 blur-3xl dark:bg-[#82ADD4]/10" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-[#DDFD2C]/20 blur-3xl dark:bg-[#DDFD2C]/10" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-black shadow-2xs backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white">
            <span className="size-1.5 rounded-full bg-[#DDFD2C]" />
            <span>Luma Scripture Tracker • Multi-Canon Reading Sanctuary</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="leading-[1.12] mt-6 text-[36px] font-normal tracking-tight text-black sm:text-[50px] md:text-[62px] dark:text-white">
            Read Deeply. Track Faithfully. <br />
            <span className="font-light text-[#555555] dark:text-[#A1A1AA]">
              Journey Through Scripture.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-[14px] leading-relaxed font-normal text-[#555555] sm:text-[16px] dark:text-[#A1A1AA]">
            Track chapter completion matrices across 4 historical Christian
            canons. Maintain daily habits with grace-filled streak freezes,
            guided reading plans, and AI-assisted study comprehension.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-[14px] bg-black px-6 py-3 text-[14px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <span>Start Reading for Free</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-[14px] border border-black/8 bg-white/80 px-5 py-3 text-[14px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:border-black/16 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/8"
            >
              <Calendar className="size-4 text-[#82ADD4]" />
              <span>Browse Reading Plans</span>
            </Link>

            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-[14px] border border-black/8 bg-white/80 px-5 py-3 text-[14px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:border-black/16 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/8"
            >
              <BookOpen className="size-4 text-[#888888] dark:text-[#A1A1AA]" />
              <span>Explore Bible Books</span>
            </Link>
          </div>

          {/* Quantitative Proof Row */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-black/6 pt-8 sm:grid-cols-4 dark:border-white/8">
            <div className="flex flex-col items-center">
              <span className="text-[22px] font-medium text-black dark:text-white">
                4 Traditions
              </span>
              <span className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                Protestant to Ethiopian (81b)
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[22px] font-medium text-black dark:text-white">
                1 189+
              </span>
              <span className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                Canonical Chapters
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[22px] font-medium text-black dark:text-white">
                3 Freezes
              </span>
              <span className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                Grace-Filled Streak Protection
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[22px] font-medium text-black dark:text-white">
                AI Guidance
              </span>
              <span className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                Context Summaries & Quizzes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Feature: Multi-Canon Selector */}
      <CanonShowcaseSection
        selectedCanonId={selectedCanonId}
        onSelectCanon={({ canonId }) => setSelectedCanonId(canonId)}
      />

      {/* Core Tenets & Pillars Grid */}
      <PillarsSection />

      {/* Spiritual Sanctuary Scripture Banner */}
      <section className="relative mt-8 overflow-hidden rounded-3xl bg-[#0D0D0F] p-8 text-white sm:p-12 dark:bg-[#070708]">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-medium tracking-[0.2em] text-[#DDFD2C] uppercase">
            PSALM 119:105
          </span>
          <blockquote className="mt-4 text-[24px] leading-relaxed font-light tracking-tight text-white sm:text-[32px]">
            &ldquo;Your word is a lamp unto my feet,{" "}
            <br className="hidden sm:inline" />
            and a light unto my path.&rdquo;
          </blockquote>
          <p className="mt-4 text-[13px] text-white/70">
            Built for intentional reading, quiet contemplation, and steady
            growth in understanding.
          </p>
        </div>
      </section>

      {/* Bottom Conversion CTA */}
      <section className="mt-8 rounded-3xl border border-black/8 bg-white/70 p-8 text-center shadow-xs backdrop-blur-md sm:p-12 dark:border-white/10 dark:bg-white/3">
        <h2 className="text-[28px] font-normal tracking-tight text-black sm:text-[36px] dark:text-white">
          Begin Your Scripture Journey Today
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[14px] text-[#666666] dark:text-[#9CA3AF]">
          Create your first reading tracker in seconds. Choose your canon, set
          your pace, and build a lasting relationship with the Word.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-[14px] bg-black px-6 py-3 text-[14px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
          >
            <span>Create Free Account</span>
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[14px] border border-black/8 bg-white px-5 py-3 text-[14px] font-medium text-black shadow-2xs hover:border-black/16 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <span>Sign In to Existing Account</span>
          </Link>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <LandingFooter />
    </div>
  );
}
