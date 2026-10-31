"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Flame,
  Users,
  CheckCircle2,
  Compass,
  Cpu,
} from "lucide-react";
import { TopNavbar } from "@/components/luma/top-navbar";

type CanonInfo = {
  id: string;
  name: string;
  totalBooks: number;
  otCount: number;
  ntCount: number;
  tradition: string;
  uniqueHighlights: string[];
};

const CANONS: ReadonlyArray<CanonInfo> = [
  {
    id: "protestant",
    name: "Protestant Canon",
    totalBooks: 66,
    otCount: 39,
    ntCount: 27,
    tradition: "Historical Standard",
    uniqueHighlights: [
      "Genesis through Malachi (39 OT)",
      "Matthew through Revelation (27 NT)",
      "Standard reading plans and devotional pacing",
    ],
  },
  {
    id: "catholic",
    name: "Catholic Canon",
    totalBooks: 73,
    otCount: 46,
    ntCount: 27,
    tradition: "Deuterocanonical",
    uniqueHighlights: [
      "Includes Tobit, Judith, 1 & 2 Maccabees",
      "Wisdom of Solomon, Sirach, and Baruch",
      "Greek additions to Esther and Daniel",
    ],
  },
  {
    id: "orthodox",
    name: "Eastern Orthodox",
    totalBooks: 78,
    otCount: 51,
    ntCount: 27,
    tradition: "Septuagintal",
    uniqueHighlights: [
      "Includes 3 Maccabees and 1 Esdras",
      "Prayer of Manasseh and Psalm 151",
      "4 Maccabees appendix included in tradition",
    ],
  },
  {
    id: "ethiopian",
    name: "Ethiopian Orthodox Tewahedo",
    totalBooks: 81,
    otCount: 54,
    ntCount: 27,
    tradition: "Ancient Ge'ez",
    uniqueHighlights: [
      "Henok (1 Enoch) & Kufale (Jubilees)",
      "1, 2, and 3 Meqabyan (Ethiopian Maccabees)",
      "Broader New Testament pastoral books (Sinodos, Didascalia)",
    ],
  },
];

export function LandingView() {
  const [selectedCanonId, setSelectedCanonId] = useState<string>("protestant");

  const selectedCanon =
    CANONS.find((c) => c.id === selectedCanonId) ?? CANONS[0]!;

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Atmospheric Hero Section */}
      <section className="relative mt-4 overflow-hidden rounded-[24px] border border-black/[0.08] bg-white/70 p-8 shadow-xs backdrop-blur-md sm:p-12 md:p-16 dark:border-white/10 dark:bg-white/[0.03]">
        {/* Ambient radial glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#82ADD4]/15 blur-3xl dark:bg-[#82ADD4]/10" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#DDFD2C]/20 blur-3xl dark:bg-[#DDFD2C]/10" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-black shadow-2xs backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DDFD2C]" />
            <span>Luma Scripture Tracker • Multi-Canon Reading Sanctuary</span>
          </div>

          {/* Monumental Headline */}
          <h1 className="mt-6 text-[36px] font-normal leading-[1.12] tracking-tight text-black sm:text-[50px] md:text-[62px] dark:text-white">
            Read Deeply. Track Faithfully. <br />
            <span className="font-light text-[#555555] dark:text-[#A1A1AA]">
              Journey Through Scripture.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-relaxed text-[#666666] sm:text-[16px] dark:text-[#9CA3AF]">
            A habit-forming Bible companion with native support for 4 major
            traditions, grace-filled streak protection, AI contextual study
            summaries, and shared cohort reading groups.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-[14px] bg-black px-6 py-3 text-[14px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <span>Start Reading for Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/plans"
              className="inline-flex items-center gap-2 rounded-[14px] border border-black/[0.08] bg-white/80 px-5 py-3 text-[14px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:border-black/[0.16] hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
            >
              <Calendar className="h-4 w-4 text-[#82ADD4]" />
              <span>Browse Reading Plans</span>
            </Link>

            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-[14px] border border-black/[0.08] bg-white/80 px-5 py-3 text-[14px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:border-black/[0.16] hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
            >
              <BookOpen className="h-4 w-4 text-[#888888] dark:text-[#A1A1AA]" />
              <span>Explore Bible Books</span>
            </Link>
          </div>

          {/* Quantitative Proof Row */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-black/[0.06] pt-8 sm:grid-cols-4 dark:border-white/[0.08]">
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
      <section className="mt-8 rounded-[24px] border border-black/[0.08] bg-white/60 p-6 shadow-xs backdrop-blur-md sm:p-10 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-[11px] font-medium tracking-[0.16em] text-[#82ADD4] uppercase">
              UNIVERSAL CHRISTIAN TRADITIONS
            </span>
            <h2 className="mt-1 text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
              First-Class Multi-Canon Respect
            </h2>
            <p className="mt-1 max-w-xl text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Select your tradition to experience accurate chapter counts,
              historic books, and custom reading curricula without compromise.
            </p>
          </div>

          {/* Canon Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-[16px] border border-black/[0.06] bg-white/80 p-1.5 dark:border-white/10 dark:bg-white/[0.05]">
            {CANONS.map((canon) => {
              const isSelected = canon.id === selectedCanonId;
              return (
                <button
                  key={canon.id}
                  type="button"
                  onClick={() => setSelectedCanonId(canon.id)}
                  className={`rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all ${
                    isSelected
                      ? "bg-black text-white shadow-xs dark:bg-[#DDFD2C] dark:text-black"
                      : "text-[#666666] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                  }`}
                >
                  {canon.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Canon Detailed Showcase Card */}
        <div className="mt-6 grid grid-cols-1 gap-6 rounded-[20px] border border-black/[0.06] bg-white/80 p-6 sm:grid-cols-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="sm:col-span-1">
            <span className="rounded-[6px] bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#497aa1] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
              {selectedCanon.tradition}
            </span>
            <h3 className="mt-2 text-[22px] font-medium text-black dark:text-white">
              {selectedCanon.name}
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-[38px] font-light text-black dark:text-white">
                {selectedCanon.totalBooks}
              </span>
              <span className="text-[13px] text-[#777777] dark:text-[#9CA3AF]">
                Total Books
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[12px] text-[#666666] dark:text-[#9CA3AF]">
              <span>{selectedCanon.otCount} Old Testament</span>
              <span>•</span>
              <span>{selectedCanon.ntCount} New Testament</span>
            </div>
          </div>

          <div className="sm:col-span-2 border-t border-black/[0.06] pt-4 sm:border-t-0 sm:border-l sm:pl-6 dark:border-white/[0.08]">
            <h4 className="text-[12px] font-medium tracking-wide text-black uppercase dark:text-white">
              Tradition Distinctives & Included Texts:
            </h4>
            <ul className="mt-3 space-y-2.5">
              {selectedCanon.uniqueHighlights.map((highlight) => (
                <li
                  key={highlight}
                  className="flex items-start gap-2.5 text-[13px] text-[#555555] dark:text-[#A1A1AA]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#82ADD4]" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-[12px] bg-black px-4 py-2 text-[12px] font-medium text-white shadow-2xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <span>Track This Canon</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/books"
                className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.08] bg-white px-4 py-2 text-[12px] font-medium text-black shadow-2xs hover:border-black/[0.16] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
              >
                <span>View Books Grid</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Tenets & Pillars Grid */}
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pillar 1 */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#82ADD4]/15 text-[#3b6d94] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
            Multi-Tracker Isolation
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
            Run personal devotions, Bible in a year, and small group studies in
            parallel without cross-contaminating completion matrices.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#DDFD2C]/20 text-black dark:bg-[#DDFD2C]/15 dark:text-[#DDFD2C]">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
            AI Study Companion
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
            Generate 2-paragraph cultural context summaries and Socratic
            comprehension quizzes with instant grading and constructive
            feedback.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <Flame className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
            Grace-Filled Streak Engine
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
            Life happens. Automatic streak freezes and catch-up rebalancing
            ensure a missed day never causes guilt or breaks your momentum.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-[20px] border border-black/[0.08] bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
            Cohort Reading Groups
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
            Read together with private invite links, synchronized start dates,
            and an intuitive 2-tab suite keeping reader views distraction-free.
          </p>
        </div>
      </section>

      {/* Spiritual Sanctuary Scripture Banner */}
      <section className="relative mt-8 overflow-hidden rounded-[24px] bg-[#0D0D0F] p-8 text-white sm:p-12 dark:bg-[#070708]">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <span className="text-[11px] font-medium tracking-[0.2em] text-[#DDFD2C] uppercase">
            PSALM 119:105
          </span>
          <blockquote className="mt-4 text-[24px] font-light leading-relaxed tracking-tight text-white sm:text-[32px]">
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
      <section className="mt-8 rounded-[24px] border border-black/[0.08] bg-white/70 p-8 text-center shadow-xs backdrop-blur-md sm:p-12 dark:border-white/10 dark:bg-white/[0.03]">
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
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[14px] border border-black/[0.08] bg-white px-5 py-3 text-[14px] font-medium text-black shadow-2xs hover:border-black/[0.16] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            <span>Sign In to Existing Account</span>
          </Link>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] py-6 text-[12px] text-[#777777] dark:border-white/[0.08] dark:text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-black dark:text-white">
            Scripture.
          </span>
          <span>•</span>
          <span>Luma Bible Tracker & Cohort Platform</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/books"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Bible Books
          </Link>
          <Link
            href="/plans"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Reading Plans
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="transition-colors hover:text-black dark:hover:text-white"
          >
            Sign Up
          </Link>
        </div>
      </footer>
    </div>
  );
}
