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
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";

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
      <AuthShowcasePanel
        backHref="/login"
        backLabel="Back to Sign In"
        badge="CONFIRMATION & STRENGTH"
        quoteTitle={
          <>
            Create in me a clean <br />
            heart, O God; and renew <br />
            <span className="font-semibold text-foreground">
              a right spirit.
            </span>
          </>
        }
        scriptureRef="Psalm 51:10"
        description="Establish a strong, updated credential to protect your saved meditations, chapter bookmarks, and personalized reading plans."
        footerLeft="Security Renewal • Strong Encryption"
        footerRight="Safe Credentials"
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
                <span className="ui-pill-primary text-[10px]">Security</span>
              </div>
              <h1 className="mt-3 text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">
                Set new password
              </h1>
              <p className="mt-1 text-[13px] text-foreground-secondary">
                Create a new secure password for your Scripture account.
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

            {submitted ? (
              <div className="mt-6 space-y-4">
                <div className="ui-card-elevated p-5 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-foreground">
                    Password updated
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-foreground-secondary">
                    Your new password has been saved. You can now use it to sign
                    in to your Scripture account.
                  </p>
                </div>

                <Link href="/login" className="ui-btn-primary w-full">
                  Sign In With New Password
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[12px] font-bold text-foreground"
                  >
                    New Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-foreground-dim" />
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="ui-input w-full px-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-3.5 -translate-y-1/2 text-foreground-dim hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[12px] font-bold text-foreground"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-foreground-dim" />
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="ui-input w-full px-10"
                    />
                  </div>
                </div>

                {/* Password Criteria Checks */}
                <div className="space-y-1.5 pt-1 text-[11px] text-foreground-dim">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span>At least 8 characters long</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span>Must match confirmation password</span>
                  </div>
                </div>

                <button type="submit" className="ui-btn-primary mt-2 w-full">
                  Update Password
                </button>
              </form>
            )}

            {/* Footer switch to sign in */}
            <div className="mt-6 border-t border-border pt-4 text-center text-[12px] text-foreground-dim">
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
