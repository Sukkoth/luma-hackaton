import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  Database,
  Lock,
  Eye,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LumaIcon } from "@/components/ui/luma-icon";

export const metadata: Metadata = {
  title: "Privacy Policy | Luma Scripture Tracker",
  description:
    "A simple, honest overview of how Luma handles your account, reading plans, and notes.",
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="size-3.5" />
            <span>Plain English Privacy</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Summary Callout */}
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 text-sm leading-relaxed text-foreground space-y-1">
          <p className="font-bold text-primary">Summary</p>
          <p className="text-muted-foreground">
            We built Luma for personal Bible reading. We don&apos;t sell your
            data, we don&apos;t display ads, and your study notes belong 100% to
            you.
          </p>
        </div>

        {/* Policy Body */}
        <div className="max-w-none space-y-7 pt-6 text-sm leading-relaxed text-foreground/90">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              1. What is Luma?
            </h2>
            <p className="text-muted-foreground">
              Luma is a simple Bible reading companion and habit tracker made to
              help you stay in the Word across different traditions (Protestant,
              Catholic, Eastern Orthodox, and Ethiopian).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Database className="size-4 text-primary" />
              <span>2. Information We Collect</span>
            </h2>
            <p className="text-muted-foreground">
              We only collect what&apos;s actually needed to make the app work
              for you:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Your Account:</strong> Your
                name, email, and a hashed password if you register with email.
                If you use Google or GitHub to sign in, we just get your name,
                email, and avatar so you don&apos;t have to remember another
                password.
              </li>
              <li>
                <strong className="text-foreground">Reading Progress:</strong>{" "}
                The chapters you check off, your active plans, streak counts,
                and any notes or highlights you write.
              </li>
              <li>
                <strong className="text-foreground">
                  Reminders (Optional):
                </strong>{" "}
                If you turn on daily reading reminders, your browser generates a
                push notification token so we know where to send your prompt at
                your chosen time.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Eye className="size-4 text-primary" />
              <span>3. How We Use Your Information</span>
            </h2>
            <p className="text-muted-foreground">
              We use your data simply to run the app:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                Letting you log in across your phone, tablet, and computer.
              </li>
              <li>Keeping your reading checklist and streaks in sync.</li>
              <li>Sending password reset links if you forget your password.</li>
              <li>Sending your daily chapter reminder if you asked for one.</li>
            </ul>
            <p className="text-xs text-muted-foreground italic pt-1">
              We never sell, rent, or trade your personal information. Ever.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <span>4. Data Storage &amp; Security</span>
            </h2>
            <p className="text-muted-foreground">
              Everything is stored in a secure database over encrypted
              connections (HTTPS/TLS). Passwords are cryptographically hashed so
              nobody (including us) can see them in plain text.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              5. Third-Party Service Providers
            </h2>
            <p className="text-muted-foreground">
              We use a couple of standard services to help run things smoothly:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Google &amp; GitHub:
                </strong>{" "}
                For one-click sign in.
              </li>
              <li>
                <strong className="text-foreground">Resend:</strong> To deliver
                transactional emails (like password resets).
              </li>
              <li>
                <strong className="text-foreground">Web Push:</strong> Standard
                browser push services so your device can receive scheduled
                prompts.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              6. Cookies &amp; Local Storage
            </h2>
            <p className="text-muted-foreground">
              We keep tracking to zero. We don&apos;t use third-party
              advertising or marketing trackers. We only use:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  Essential Session Cookies:
                </strong>{" "}
                Keeps you logged in securely while you browse.
              </li>
              <li>
                <strong className="text-foreground">
                  Local Browser Storage:
                </strong>{" "}
                Remembers your theme (light/dark) and caches reading progress so
                pages load instantly and work offline.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              7. Data Export &amp; Deletion
            </h2>
            <p className="text-muted-foreground">You own your data:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Export:</strong> Head over
                to{" "}
                <Link
                  href="/settings?tab=export"
                  className="text-primary hover:underline font-medium"
                >
                  Settings &gt; Data Export
                </Link>{" "}
                anytime to download your notes and reading logs.
              </li>
              <li>
                <strong className="text-foreground">Delete:</strong> Want out?
                You can delete your account under{" "}
                <Link
                  href="/settings?tab=profile"
                  className="text-primary hover:underline font-medium"
                >
                  Settings &gt; Profile
                </Link>
                . When you hit delete, your account and reading records are
                permanently erased.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground">
              Luma is intended for general audiences and is not directed at
              children under 13. We do not knowingly collect personal
              information from children under 13. If you believe a child has
              signed up, please reach out and we will delete the account
              immediately.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              9. Updates to this Policy
            </h2>
            <p className="text-muted-foreground">
              If we ever update our practices, we&apos;ll revise the &ldquo;Last
              updated&rdquo; date at the top. For any significant changes, we
              will display a notice inside the app so you are always aware.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              <span>10. Questions or Feedback?</span>
            </h2>
            <p className="text-muted-foreground">
              If you have any questions or want something cleared up, shoot an
              email to{" "}
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
              href="/tos"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
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
