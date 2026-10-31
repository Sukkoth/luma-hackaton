import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/6 py-6 text-[12px] text-[#777777] dark:border-white/8 dark:text-[#9CA3AF]">
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
  );
}
