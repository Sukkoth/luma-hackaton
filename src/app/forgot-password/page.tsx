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
            <span className="font-semibold text-foreground">
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
            className="ui-btn-secondary ui-btn-sm gap-1.5 lg:hidden"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            <span>Sign In</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Centered Form Container */}
        <div className="m-auto w-full max-w-105 py-8">
          <div className="ui-card w-full p-7 sm:p-9">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-[20px] font-bold tracking-tight text-foreground">
                  Scripture
                  <span className="text-foreground-dim">.</span>
                </span>
                <span className="ui-pill-primary text-[10px]">Recovery</span>
              </div>
              <h1 className="mt-3 text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">
                Forgot password?
              </h1>
              <p className="mt-1 text-[13px] text-foreground-secondary">
                Enter your email address to receive password reset instructions.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-[14px] border border-destructive/20 bg-destructive/10 p-3 text-[12px] font-medium text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submittedEmail ? (
              <div className="mt-6 space-y-4">
                <div className="ui-card-elevated p-5 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-foreground">
                    Reset link sent
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-foreground-secondary">
                    We sent instructions to{" "}
                    <strong className="font-bold text-foreground">
                      {submittedEmail}
                    </strong>
                    . Please check your inbox and spam folder.
                  </p>
                </div>

                {/* Direct link for demonstration / UI testing */}
                <Link
                  href="/reset-password"
                  className="ui-btn-primary w-full gap-1.5"
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
                    className="block text-[12px] font-bold text-foreground"
                  >
                    Email address
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-foreground-dim" />
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      required
                      placeholder="james@example.com"
                      className="ui-input ui-input-icon-left w-full"
                    />
                  </div>
                </div>

                <button type="submit" className="ui-btn-primary w-full">
                  Send Reset Link
                </button>
              </form>
            )}

            {/* Footer switch back to sign in */}
            <div className="mt-6 border-t border-border pt-4 text-center text-[12px] text-foreground-dim">
              <span>Remember your credentials? </span>
              <Link
                href="/login"
                className="font-semibold text-foreground transition-colors hover:underline"
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
