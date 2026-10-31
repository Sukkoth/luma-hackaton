"use client";

import { useState } from "react";
import Link from "next/link";
import * as v from "valibot";
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ForgotPasswordSchema } from "@/lib/schemas/auth";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const parsed = v.safeParse(ForgotPasswordSchema, {
      email: formData.get("email"),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.issues[0]?.message || "Invalid email address.");
      return;
    }

    setSubmittedEmail(parsed.output.email);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row">
      {/* LEFT SIDE: Full-Bleed Atmospheric Showcase */}
      <AuthShowcasePanel
        backHref="/login"
        backLabel="Back to Sign In"
        badge="RESTORATION & HOPE"
        quoteTitle={
          <>
            He restoreth my soul: <br />
            he leadeth me in <br />
            <span className="font-normal text-white">
              paths of righteousness.
            </span>
          </>
        }
        scriptureRef="Psalm 23:3"
        description="Regain access to your personal reading record. Your reading history, reflections, and chapter milestone statistics remain secure."
        footerLeft="Account Recovery • Verified Flow"
        footerRight="Identity Safeguard"
      />

      {/* RIGHT SIDE: Authentication Form Experience */}
      <section className="relative flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-18">
        {/* Mobile / Tablet Top Navigation Header */}
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/90 hover:bg-white hover:text-black lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            <span>Sign In</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Centered Form Container */}
        <div className="m-auto w-full max-w-105 py-8">
          <div className="glass-panel w-full rounded-[28px] p-7 sm:p-9">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[20px] font-normal tracking-tight text-black dark:text-white">
                  Scripture<span className="text-[#82ADD4]">.</span>
                </span>
                <span className="rounded-md bg-[#DDFD2C] px-2 py-0.5 text-[10px] font-medium text-black">
                  Recovery
                </span>
              </div>
              <h1 className="mt-3 text-[26px] font-normal tracking-tight text-black sm:text-[28px] dark:text-white">
                Forgot password?
              </h1>
              <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                Enter your email address to receive password reset instructions.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-[14px] border border-red-500/20 bg-red-500/10 p-3 text-[12px] font-normal text-red-600 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submittedEmail ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-[18px] border border-black/6 bg-[#DDFD2C]/15 p-5 text-center dark:border-white/10 dark:bg-[#DDFD2C]/10">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#DDFD2C] text-black shadow-xs">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-medium text-black dark:text-white">
                    Reset link sent
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
                    We sent instructions to{" "}
                    <strong className="font-medium text-black dark:text-white">
                      {submittedEmail}
                    </strong>
                    . Please check your inbox and spam folder.
                  </p>
                </div>

                {/* Direct link for demonstration / UI testing */}
                <Link
                  href="/reset-password"
                  className="flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-black py-2.5 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
                >
                  <span>Continue to Set New Password</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-[12px] font-medium text-black dark:text-white"
                  >
                    Email address
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      required
                      placeholder="james@example.com"
                      className="w-full rounded-[14px] border border-black/8 bg-white/70 py-2.5 pr-4 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/8"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-[14px] bg-black py-2.5 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
                >
                  Send Reset Link
                </button>
              </form>
            )}

            {/* Footer switch back to sign in */}
            <div className="mt-6 border-t border-black/4 pt-4 text-center text-[12px] text-[#777777] dark:border-white/6 dark:text-[#A1A1AA]">
              <span>Remember your credentials? </span>
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
