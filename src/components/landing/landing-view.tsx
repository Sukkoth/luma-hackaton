"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, LogIn, Sparkles } from "lucide-react";
import { InterlockingStats } from "./interlocking-stats";
import { ReadingWorkflowSection } from "./reading-workflow-section";
import { CanonShowcaseSection } from "./canon-showcase-section";
import { PillarsSection } from "./pillars-section";
import { LandingFooter } from "./landing-footer";
import { GeometricWireframeShapes } from "./geometric-wireframe-shapes";
import { AtmosphericCanvasArt } from "./atmospheric-canvas-art";

export function LandingView() {
  const [selectedCanonId, setSelectedCanonId] = useState<string>("protestant");

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      {/* Full-Bleed Atmospheric Hero Section (seamlessly integrated landscape without awkward side borders) */}
      <section className="relative w-full overflow-hidden min-h-[620px] lg:h-[calc(100dvh-1rem)] lg:max-h-[940px] flex flex-col justify-between">
        {/* Seamless Landscape Artwork as the natural hero foundation */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/sanctuary_hero_seamless.jpg"
            alt="Serene mountain lake sanctuary at dawn with golden clouds framing the horizon"
            fill
            priority
            sizes="100vw"
            className="object-cover object-bottom"
          />
          {/* Subtle darkening for dark mode contrast */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden dark:block bg-stone-950/45 backdrop-brightness-90"
          />
        </div>

        {/* Hero Content (Floating directly in the airy sky of the landscape) */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-12 sm:pt-16 lg:pt-20 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/90 px-4 py-1.5 text-[11px] lg:text-[12px] font-semibold tracking-wide text-foreground shadow-xs backdrop-blur-md dark:border-white/15 dark:bg-stone-900/90 dark:text-stone-200">
            <Sparkles className="size-3 lg:size-3.5 text-primary animate-pulse" />
            <span>Multi-Canon Scripture Sanctuary</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="mt-5 lg:mt-6 text-[38px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-normal tracking-tight text-foreground leading-[1.06] drop-shadow-2xs">
            Read deeply. Track faithfully. <br />
            Journey through{" "}
            <span className="font-serif italic font-medium text-primary dark:text-[#F59E0B]">
              Scripture.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-[15px] sm:text-[16px] lg:text-[17px] leading-relaxed text-foreground-secondary">
            Track chapter completion matrices across 4 historical traditions.
            Maintain daily habits with grace-filled streak freezes, guided
            reading plans, and Socratic AI study companions.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 lg:mt-7 flex flex-wrap items-center justify-center gap-3 pb-6">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[14px] lg:text-[15px] font-medium text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-98"
            >
              <span>Start Reading for Free</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-6 py-3.5 text-[14px] lg:text-[15px] font-medium text-foreground shadow-xs backdrop-blur-md transition-all hover:bg-black/5 dark:border-white/15 dark:bg-stone-900/95 dark:hover:bg-white/5"
            >
              <Calendar className="size-4 text-foreground-secondary" />
              <span>Browse Reading Plans</span>
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/85 px-5 py-3.5 text-[14px] lg:text-[15px] font-medium text-foreground-secondary shadow-xs backdrop-blur-md transition-all hover:bg-black/5 hover:text-foreground dark:border-white/15 dark:bg-stone-900/85 dark:hover:bg-white/5 dark:hover:text-foreground"
            >
              <LogIn className="size-4" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>

        {/* Scenic lake landscape anchors the bottom of the hero naturally */}
        <div
          aria-hidden="true"
          className="relative z-10 w-full h-12 bg-gradient-to-t from-background to-transparent"
        />
      </section>

      {/* Whole-Page Atmospheric Canvas Art (Continuous long lines, glass tubes, 3D cubes, and celestial astrolabes across entire page below hero) */}
      <div className="relative w-full">
        <AtmosphericCanvasArt />

        {/* Main Content Sections (Comfortable max-w-7xl reading width) */}
        <main className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 pb-20 sm:px-6 md:px-8">
          {/* Interlocking Notched Stat Badges Row */}
          <InterlockingStats />

          {/* 1-2-3 Giant Stepper Process Section */}
          <ReadingWorkflowSection />

          {/* Multi-Canon Interactive Matrix Selector */}
          <CanonShowcaseSection
            selectedCanonId={selectedCanonId}
            onSelectCanon={({ canonId }) => setSelectedCanonId(canonId)}
          />

          {/* Core Pillars Grid */}
          <PillarsSection />

          {/* Spiritual Sanctuary Scripture Banner */}
          <section className="relative mt-16 overflow-hidden rounded-[32px] bg-[#0D0D0F] p-8 text-white sm:p-14 md:p-16 dark:bg-[#070708] shadow-md">
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-zinc-400 uppercase">
                PSALM 119:105
              </span>
              <blockquote className="mt-5 text-[28px] sm:text-[36px] md:text-[42px] leading-snug font-light tracking-tight text-white">
                &ldquo;Your word is a lamp unto my feet,{" "}
                <br className="hidden sm:inline" />
                and a light unto my path.&rdquo;
              </blockquote>
              <p className="mt-5 text-[14px] sm:text-[15px] text-white/75">
                Built for intentional reading, quiet contemplation, and steady
                growth in understanding.
              </p>
            </div>
          </section>

          {/* Bottom Frosted Glass Conversion Card (Twilight / Night Sanctuary Landscape) */}
          <section className="relative mt-20 overflow-hidden rounded-[36px] border border-black/8 shadow-md dark:border-white/10 min-h-[460px] sm:min-h-[520px] flex items-center justify-center p-6 sm:p-10">
            {/* Night Landscape Background Image */}
            <Image
              src="/images/sanctuary_cta_night.jpg"
              alt="Starry twilight mountain lake sanctuary with glowing lanterns"
              fill
              sizes="(max-width: 1400px) 100vw, 1400px"
              className="object-cover object-center"
            />

            {/* Vignette Overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black/35 backdrop-brightness-95"
            />

            {/* Line-based geometric shapes in the sky behind frosted card (matching reference video frame 10) */}
            <GeometricWireframeShapes variant="cta" />

            {/* Floating Frosted Glass Card (matching reference CTA) */}
            <div className="relative z-10 mx-auto w-full max-w-3xl rounded-[32px] border border-white/25 bg-white/75 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-12 md:p-14 dark:border-white/15 dark:bg-stone-900/75">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/90 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary shadow-2xs dark:border-white/15 dark:bg-stone-800/80">
                <Sparkles className="size-3 text-primary animate-pulse" />
                <span>Start Today</span>
              </div>

              <h2 className="mt-5 text-[30px] sm:text-[40px] md:text-[46px] font-normal tracking-tight text-foreground leading-[1.12]">
                The time you invest in Scripture is eternal.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[14px] sm:text-[16px] text-foreground-secondary leading-relaxed">
                Launch your first reading tracker in seconds. Choose your canon,
                set your pace, and build a lasting relationship with the Word.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-[15px] font-medium text-primary-foreground shadow-md transition-all hover:opacity-95 active:scale-98"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-6 py-3 text-[15px] font-medium text-foreground shadow-2xs backdrop-blur-md transition-all hover:bg-black/5 dark:border-white/15 dark:bg-stone-800/90 dark:hover:bg-white/5"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Grounded Accent Footer */}
          <LandingFooter />
        </main>
      </div>
    </div>
  );
}
