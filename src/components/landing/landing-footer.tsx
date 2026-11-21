import Link from "next/link";
import { LumaIcon } from "@/components/ui/luma-icon";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function LandingFooter() {
  return (
    <footer className="mt-20 w-full rounded-[32px] bg-[#E29D28] p-8 text-stone-950 sm:p-12 md:p-14 dark:bg-[#1C1917] dark:text-stone-100 dark:border dark:border-white/10 shadow-lg">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        {/* Brand Group with 3 animated bounce-subtle dots (matching reference flourish) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span
              className="size-2 rounded-full bg-stone-950/70 dark:bg-amber-400/90 animate-bounce-subtle"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="size-2 rounded-full bg-stone-950/70 dark:bg-amber-400/90 animate-bounce-subtle"
              style={{ animationDelay: "200ms" }}
            />
            <span
              className="size-2 rounded-full bg-stone-950/70 dark:bg-amber-400/90 animate-bounce-subtle"
              style={{ animationDelay: "400ms" }}
            />
          </div>

          <div className="flex size-11 items-center justify-center overflow-hidden rounded-2xl border border-stone-950/20 bg-stone-950/10 shadow-sm dark:border-white/20 dark:bg-white/10">
            <LumaIcon className="size-full rounded-2xl" size={44} />
          </div>

          <div>
            <span className="text-[22px] font-bold tracking-tight text-stone-950 dark:text-white">
              Luma
              <span className="text-stone-900/60 dark:text-amber-400">.</span>
            </span>
            <p className="text-[12px] font-medium text-stone-900/80 dark:text-stone-400">
              Multi-Canon Scripture Sanctuary
            </p>
          </div>
        </div>

        {/* Center / Category Links + Theme Toggle */}
        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap items-center gap-5 sm:gap-7 text-[14px] font-medium"
        >
          <Link
            href="/plans"
            className="text-stone-950/85 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
          >
            Reading Plans
          </Link>
          <Link
            href="/login"
            className="text-stone-950/85 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-stone-950/85 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white transition-colors"
          >
            Get Started Free
          </Link>
          <div className="sm:border-l sm:border-stone-950/20 sm:pl-5 dark:sm:border-white/15">
            <ThemeToggle />
          </div>
        </nav>
      </div>

      {/* Divider & Copyright */}
      <div className="mt-10 pt-6 border-t border-stone-950/15 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-stone-900/75 dark:text-stone-400">
        <p>© 2026 Luma Scripture Tracker. All rights reserved.</p>
        <p className="text-[11px]">
          Honoring Catholic, Orthodox, Protestant, and Ethiopian traditions.
        </p>
      </div>
    </footer>
  );
}
