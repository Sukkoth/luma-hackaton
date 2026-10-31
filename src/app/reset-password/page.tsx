"use client";

import { useState } from "react";
import Link from "next/link";
import * as v from "valibot";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ResetPasswordSchema } from "@/lib/schemas/auth";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const parsed = v.safeParse(ResetPasswordSchema, {
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.issues[0]?.message || "Invalid passwords.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row">
      {/* LEFT SIDE: Full-Bleed Atmospheric Showcase */}
      <section className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#0D0D0F] p-10 text-white lg:flex lg:w-1/2 lg:p-14 xl:p-18 dark:bg-[#070708]">
        {/* Full-bleed generative SVG architectural tapestry */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          viewBox="0 0 900 1200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient
              id="resetGlow"
              cx="45%"
              cy="40%"
              r="60%"
              fx="40%"
              fy="35%"
            >
              <stop offset="0%" stopColor="#1E1E22" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#121215" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#070708" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="resetArc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#71717A" stopOpacity="0.14" />
              <stop offset="75%" stopColor="#DDFD2C" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient
              id="resetVertical"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#71717A" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#71717A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Deep ambient light bloom */}
          <rect width="900" height="1200" fill="url(#resetGlow)" />

          {/* Canonical Horizon Arcs */}
          <g opacity="0.85">
            <circle
              cx="450"
              cy="540"
              r="140"
              stroke="url(#resetArc)"
              strokeWidth="1"
            />
            <circle
              cx="450"
              cy="540"
              r="220"
              stroke="url(#resetArc)"
              strokeWidth="1.25"
              strokeDasharray="3 9"
            />
            <circle
              cx="450"
              cy="540"
              r="330"
              stroke="url(#resetArc)"
              strokeWidth="1"
              opacity="0.6"
            />
            <circle
              cx="450"
              cy="540"
              r="460"
              stroke="url(#resetArc)"
              strokeWidth="1.5"
              strokeDasharray="8 12"
              opacity="0.4"
            />
            <circle
              cx="450"
              cy="540"
              r="610"
              stroke="url(#resetArc)"
              strokeWidth="1"
              strokeDasharray="2 14"
              opacity="0.35"
            />
            <circle
              cx="450"
              cy="540"
              r="780"
              stroke="url(#resetArc)"
              strokeWidth="1"
              opacity="0.2"
            />

            {/* Meridian intersecting guide axes */}
            <line
              x1="450"
              y1="0"
              x2="450"
              y2="1200"
              stroke="url(#resetVertical)"
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.4"
            />
            <line
              x1="0"
              y1="540"
              x2="900"
              y2="540"
              stroke="url(#resetArc)"
              strokeWidth="1"
              strokeDasharray="4 8"
              opacity="0.25"
            />

            {/* Radiant Canonical Crosshairs and Node Markers */}
            <circle cx="450" cy="540" r="4" fill="#DDFD2C" opacity="0.9" />
            <circle cx="450" cy="320" r="3" fill="#FFFFFF" opacity="0.7" />
            <circle cx="450" cy="760" r="3" fill="#71717A" opacity="0.7" />
            <circle cx="230" cy="540" r="3" fill="#FFFFFF" opacity="0.6" />
            <circle cx="670" cy="540" r="3" fill="#71717A" opacity="0.6" />
          </g>
        </svg>

        {/* Top Header Row with Navigation */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[12px] border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12px] font-normal text-white/90 shadow-2xs backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.75]" />
            <span>Back to Sign In</span>
          </Link>

          <span className="text-[14px] font-light tracking-wide text-white/80">
            Scripture<span className="text-[#DDFD2C]">.</span>
          </span>
        </div>

        {/* Center / Lower-middle: Monumental, Refined Typography */}
        <div className="relative z-10 my-auto max-w-lg pt-12">
          <span className="inline-block text-[11px] font-medium tracking-[0.2em] text-[#DDFD2C] uppercase">
            CONFIRMATION & STRENGTH
          </span>

          <h2 className="mt-4 text-[38px] leading-[1.12] font-light tracking-tight text-white xl:text-[46px]">
            Create in me a clean <br />
            heart, O God; and renew <br />
            <span className="font-normal text-white">a right spirit.</span>
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px w-8 bg-[#DDFD2C]/80" />
            <span className="text-[13px] font-normal tracking-wide text-white/75">
              Psalm 51:10
            </span>
          </div>

          <p className="mt-6 max-w-md text-[14px] leading-relaxed font-light text-white/60">
            Establish a strong, updated credential to protect your saved
            meditations, chapter bookmarks, and personalized reading plans.
          </p>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-[12px] text-white/60">
          <span>Security Renewal • Strong Encryption</span>
          <span className="text-white/80">Safe Credentials</span>
        </div>
      </section>

      {/* RIGHT SIDE: Authentication Form Experience */}
      <section className="relative flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-18">
        {/* Mobile / Tablet Top Navigation Header */}
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/90 hover:bg-white hover:text-black lg:hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.75]" />
            <span>Sign In</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Centered Form Container */}
        <div className="mx-auto my-auto w-full max-w-[420px] py-8">
          <div className="glass-panel w-full rounded-[28px] p-7 sm:p-9">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[20px] font-normal tracking-tight text-black dark:text-white">
                  Scripture<span className="text-[#82ADD4]">.</span>
                </span>
                <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[10px] font-medium text-black">
                  Security
                </span>
              </div>
              <h1 className="mt-3 text-[26px] font-normal tracking-tight text-black sm:text-[28px] dark:text-white">
                Set new password
              </h1>
              <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                Create a new secure password for your Scripture account.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-[14px] border border-red-500/20 bg-red-500/10 p-3 text-[12px] font-normal text-red-600 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitted ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[18px] border border-black/[0.06] bg-[#DDFD2C]/15 p-5 text-center dark:border-white/10 dark:bg-[#DDFD2C]/10">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#DDFD2C] text-black shadow-xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-medium text-black dark:text-white">
                    Password updated
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
                    Your new password has been saved. You can now use it to sign
                    in to your Scripture account.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-[14px] bg-black py-2.5 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
                >
                  Sign In With New Password
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[12px] font-medium text-black dark:text-white"
                  >
                    New Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-[14px] border border-black/[0.08] bg-white/70 py-2.5 pr-10 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#888888] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[12px] font-medium text-black dark:text-white"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-[14px] border border-black/[0.08] bg-white/70 py-2.5 pr-4 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
                    />
                  </div>
                </div>

                {/* Password Criteria Checks */}
                <div className="space-y-1.5 pt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/40 dark:bg-[#DDFD2C]/60" />
                    <span>At least 8 characters long</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-black/40 dark:bg-[#DDFD2C]/60" />
                    <span>Must match confirmation password</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center rounded-[14px] bg-black py-2.5 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
                >
                  Update Password
                </button>
              </form>
            )}

            {/* Footer switch to sign in */}
            <div className="mt-6 border-t border-black/[0.04] pt-4 text-center text-[12px] text-[#777777] dark:border-white/[0.06] dark:text-[#A1A1AA]">
              <Link
                href="/login"
                className="font-medium text-black transition-colors hover:underline dark:text-white"
              >
                Back to Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="text-center text-[11px] text-[#888888] dark:text-[#A1A1AA]">
          <span>Scripture Tracker & Planner • Luma</span>
        </div>
      </section>
    </div>
  );
}
