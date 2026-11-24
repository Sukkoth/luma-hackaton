"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as v from "valibot";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ResetPasswordSchema } from "@/lib/schemas/auth";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";
import { LumaIcon } from "@/components/ui/luma-icon";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(
        "Invalid or missing reset token. Please request a new password reset link."
      );
      return;
    }

    const formData = new FormData(e.currentTarget);
    const parsed = v.safeParse(ResetPasswordSchema, {
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setErrorMessage(parsed.issues[0]?.message || "Invalid passwords.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.resetPassword({
        newPassword: parsed.output.password,
        token,
      });

      if (res.error) {
        setErrorMessage(
          res.error.message ||
            "Unable to reset password. The link may have expired."
        );
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
      setIsLoading(false);
    } catch {
      setErrorMessage(
        "An unexpected network error occurred. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="ui-card w-full p-7 sm:p-9">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#0c0a09] border border-border/80 shadow-2xs overflow-hidden">
            <LumaIcon className="size-full rounded-lg" size={28} priority />
          </span>
          <span className="text-[20px] font-bold tracking-tight text-foreground">
            Luma
            <span className="text-primary">.</span>
          </span>
        </div>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight text-foreground sm:text-[28px]">
          Set new password
        </h1>
        <p className="mt-1 text-[13px] text-foreground-secondary">
          Create a new secure password for your Scripture account.
        </p>
      </div>

      {!token && (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-2 rounded-[14px] border border-destructive/20 bg-destructive/10 p-3.5 text-[12px] font-medium text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>Missing or invalid reset token.</span>
          </div>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary underline underline-offset-2"
          >
            Request a new password reset link
          </Link>
        </div>
      )}

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
              Your new password has been saved. You can now use it to sign in to
              your Scripture account.
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
                disabled={!token || isLoading}
                placeholder="••••••••"
                style={{
                  paddingLeft: "2.75rem",
                  paddingRight: "2.75rem",
                }}
                className="ui-input ui-input-icon-both w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                disabled={!token || isLoading}
                placeholder="••••••••"
                style={{ paddingLeft: "2.75rem" }}
                className="ui-input ui-input-icon-left w-full"
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

          <button
            type="submit"
            disabled={!token || isLoading}
            className="ui-btn-primary mt-2 w-full gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            <span>
              {isLoading ? "Updating Password..." : "Update Password"}
            </span>
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
  );
}

export default function ResetPasswordPage() {
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
        {/* Top bar on right: Back button (on mobile) + ThemeToggle */}
        <div className="flex w-full items-center justify-between">
          <div className="lg:hidden">
            <Link href="/login" className="ui-btn-secondary ui-btn-sm gap-1.5">
              <ArrowLeft className="size-3.5" strokeWidth={1.75} />
              <span>Sign In</span>
            </Link>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>

        {/* Centered Form Container wrapped in Suspense for useSearchParams */}
        <div className="m-auto w-full max-w-105 py-8">
          <Suspense
            fallback={
              <div className="ui-card w-full p-7 text-center">
                <Loader2 className="mx-auto size-6 animate-spin text-primary" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>

        {/* Minimal Footer */}
        <div className="text-center text-[11px] text-[#888888] dark:text-[#A1A1AA]">
          <span>Scripture Tracker & Planner • Luma</span>
        </div>
      </section>
    </div>
  );
}
