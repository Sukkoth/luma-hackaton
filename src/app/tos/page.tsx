import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  BookOpen,
  ShieldCheck,
  Heart,
  Mail,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LumaIcon } from "@/components/ui/luma-icon";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Simple, friendly terms of service for Luma Scripture Tracker.",
  alternates: {
    canonical: "/tos",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "November 24, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500/20 selection:text-amber-900 dark:selection:bg-amber-500/30 dark:selection:text-amber-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-border bg-card shadow-xs">
                <LumaIcon className="size-full rounded-lg" size={28} />
              </div>
              <span className="font-bold tracking-tight text-sm text-foreground">
                Luma<span className="text-primary">.</span>
              </span>
            </Link>
            <div className="border-l border-border pl-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Masthead */}
        <div className="space-y-3 border-b border-border/60 pb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Scale className="size-3.5" />
            <span>Simple Terms</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* TL;DR Callout */}
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 text-sm leading-relaxed text-foreground space-y-1">
          <p className="font-bold text-primary">Summary</p>
          <p className="text-muted-foreground">
            Luma is a personal tool for tracking your Bible reading. Be
            respectful, use the service as intended, and enjoy your reading.
            What you write belongs to you.
          </p>
        </div>

        {/* Terms Body */}
        <div className="max-w-none space-y-7 pt-6 text-sm leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By using Luma, you agree to these terms and our{" "}
              <Link
                href="/privacy"
                className="text-primary hover:underline font-semibold"
              >
                Privacy Policy
              </Link>
              . If you ever disagree with any of this, you&apos;re free to stop
              using the app at any time.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <span>2. Description of the Service</span>
            </h2>
            <p className="text-muted-foreground">
              Luma is a personal scripture companion made for tracking daily
              Bible reading across Protestant, Catholic, Orthodox, and Ethiopian
              canons, following reading plans, and jotting down study notes. We
              work on new features regularly to keep improving your experience.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>3. User Accounts &amp; Authentication</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Keep your login credentials secure.</li>
              <li>
                Provide accurate basic info (like your real email so password
                resets work).
              </li>
              <li>Please don&apos;t set up spam accounts or automated bots.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Heart className="size-4 text-primary" />
              <span>4. Intellectual Property &amp; Content Ownership</span>
            </h2>
            <p className="text-muted-foreground">
              Your notes and personal reflections are 100% yours. We don&apos;t
              own your study thoughts and we don&apos;t use them for marketing
              or training.
            </p>
            <p className="text-muted-foreground">
              The Luma design, code, logo, and custom plan curators belong to
              Luma. Scripture chapter divisions and canonical structures are
              presented for educational and personal devotional study.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              5. Acceptable Use
            </h2>
            <p className="text-muted-foreground">
              Please use the app as intended and avoid anything that disrupts or
              abuses the service for others.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              6. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              We pour a lot of love into Luma to make it fast, reliable, and
              delightful. That said, it is provided as-is. We can&apos;t
              guarantee the service will never have a hiccup or that a push
              notification will never arrive late due to browser background
              limits.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              7. Leaving Luma
            </h2>
            <p className="text-muted-foreground">
              You can export your logs and delete your account anytime right in{" "}
              <Link
                href="/settings?tab=profile"
                className="text-primary hover:underline font-medium"
              >
                Settings
              </Link>
              . No lock-in, no hard feelings.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              <span>8. Get in Touch</span>
            </h2>
            <p className="text-muted-foreground">
              Questions, suggestions, or just want to say hi? Reach out at{" "}
              <a
                href="mailto:luma@sukkoth.dev"
                className="text-primary hover:underline font-medium"
              >
                luma@sukkoth.dev
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 Luma. Built with care.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              href="/signup"
              className="hover:text-foreground transition-colors"
            >
              Sign Up
            </Link>
            <span>•</span>
            <Link
              href="/login"
              className="hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
