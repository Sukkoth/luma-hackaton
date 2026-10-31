"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as v from "valibot";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { SignUpSchema } from "@/lib/schemas/auth";
import { AuthShowcasePanel } from "@/components/auth/auth-showcase-panel";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/onboarding";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setOauthNotice(null);

    const formData = new FormData(e.currentTarget);
    const parsed = v.safeParse(SignUpSchema, {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      agreeTerms: formData.get("agreeTerms") === "on",
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.issues[0]?.message || "Invalid registration information."
      );
      return;
    }

    setIsLoading(true);

    try {
      const trimmedName = parsed.output.name;
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=74a2d3&color=fff&size=128`;

      const { error } = await authClient.signUp.email({
        name: trimmedName,
        email: parsed.output.email.toLowerCase(),
        password: parsed.output.password,
        image: avatarUrl,
      });

      if (error) {
        setErrorMessage(
          error.message || "Failed to create account. Please try again."
        );
        setIsLoading(false);
        return;
      }

      router.push(redirectTarget);
      router.refresh();
    } catch {
      setErrorMessage(
        "An unexpected network error occurred. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row">
      {/* LEFT SIDE: Full-Bleed Atmospheric Showcase */}
      <AuthShowcasePanel
        badge="GENESIS & COMMENCEMENT"
        quoteTitle={
          <>
            Thy testimonies have I <br />
            taken as an heritage <br />
            <span className="font-normal text-white">for ever.</span>
          </>
        }
        scriptureRef="Psalm 119:111"
        description="Commence your structured journey through biblical wisdom with daily chapter metrics, schedule safeguards, and canon coverage insight."
        footerLeft="Begin Journey • Daily Tracker"
        footerRight="Daily Habit & Metrics"
      />

      {/* RIGHT SIDE: Authentication Form Experience */}
      <section className="relative flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-18">
        {/* Mobile / Tablet Top Navigation Header */}
        <div className="flex items-center justify-between lg:justify-end">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/90 hover:bg-white hover:text-black lg:hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.75]" />
            <span>Dashboard</span>
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
                  Register
                </span>
              </div>
              <h1 className="mt-3 text-[26px] font-normal tracking-tight text-black sm:text-[28px] dark:text-white">
                Create an account
              </h1>
              <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                Start logging your reading habits and tracking canon coverage.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 flex items-center gap-2 rounded-[14px] border border-red-500/20 bg-red-500/10 p-3 text-[12px] font-normal text-red-600 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {oauthNotice && (
              <div
                role="status"
                className="mt-5 flex items-center gap-2 rounded-[14px] border border-blue-500/20 bg-blue-500/10 p-3 text-[12px] font-normal text-blue-700 dark:border-blue-400/20 dark:bg-blue-950/30 dark:text-blue-300"
              >
                <Info className="h-4 w-4 shrink-0" />
                <span>{oauthNotice}</span>
              </div>
            )}

            {/* Social OAuth Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  setOauthNotice(
                    "Google authentication will be enabled soon. Please use email and password to sign up."
                  )
                }
                className="flex items-center justify-center gap-2 rounded-[14px] border border-black/[0.08] bg-white/80 py-2.5 text-[13px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:border-black/[0.16] hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setOauthNotice(
                    "GitHub authentication will be enabled soon. Please use email and password to sign up."
                  )
                }
                className="flex items-center justify-center gap-2 rounded-[14px] border border-black/[0.08] bg-white/80 py-2.5 text-[13px] font-medium text-black shadow-2xs backdrop-blur-md transition-all hover:border-black/[0.16] hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.08]"
              >
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
              </div>
              <span className="relative bg-white/70 px-3 text-[11px] font-normal text-[#888888] backdrop-blur-md dark:bg-[#16161b] dark:text-[#9CA3AF]">
                Or register with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-[12px] font-medium text-black dark:text-white"
                >
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    required
                    placeholder="James Aris"
                    className="w-full rounded-[14px] border border-black/[0.08] bg-white/70 py-2.5 pr-4 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-[12px] font-medium text-black dark:text-white"
                >
                  Email address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="james@example.com"
                    className="w-full rounded-[14px] border border-black/[0.08] bg-white/70 py-2.5 pr-4 pl-10 text-[13px] text-black backdrop-blur-md transition-all placeholder:text-[#888888] focus:border-black/30 focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-[#A1A1AA] dark:focus:border-white/20 dark:focus:bg-white/[0.08]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signup-password"
                    className="block text-[12px] font-medium text-black dark:text-white"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-[#888888] dark:text-[#9CA3AF]">
                    Min. 8 characters
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-[#888888] dark:text-[#9CA3AF]" />
                  <input
                    id="signup-password"
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

              {/* Terms Agreement */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  id="agree-terms"
                  name="agreeTerms"
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded-[4px] border-black/20 text-black accent-black focus:ring-black dark:accent-[#DDFD2C]"
                />
                <label
                  htmlFor="agree-terms"
                  className="text-[12px] leading-snug text-[#666666] select-none dark:text-[#9CA3AF]"
                >
                  I agree to the Scripture Terms of Service and Privacy Policy.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] bg-black py-2.5 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {isLoading ? "Creating account..." : "Create Account"}
                </span>
              </button>
            </form>

            {/* Footer switch to sign in */}
            <div className="mt-6 border-t border-black/[0.04] pt-4 text-center text-[12px] text-[#777777] dark:border-white/[0.06] dark:text-[#A1A1AA]">
              <span>Already have an account? </span>
              <Link
                href="/login"
                className="font-medium text-black transition-colors hover:underline dark:text-white"
              >
                Sign in
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

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#82ADD4]" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
