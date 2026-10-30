"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, Settings } from "lucide-react";

type TopNavbarProps = {
  userName?: string;
};

export function TopNavbar({ userName = "James" }: TopNavbarProps) {
  const pathname = usePathname();

  const NAV_TABS = [
    { label: "Overview", href: "/" },
    { label: "Bible Books", href: "/books" },
    { label: "Plans", href: "/plans" },
    { label: "Insights", href: "/insights" },
    { label: "Notes", href: "/notes" },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-3">
      {/* Brand logo */}
      <Link href="/" className="flex items-center gap-1">
        <span className="text-[22px] font-medium tracking-tight text-black">
          Scripture.
        </span>
      </Link>

      {/* Center cluster: Search, Filter, Frosted Glass Tab Tiles */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search icon button */}
        <button
          type="button"
          aria-label="Search scripture and plans"
          className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/60 bg-white/40 text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/80 hover:bg-white hover:text-black"
        >
          <Search className="h-3.5 w-3.5 stroke-[1.75]" />
        </button>

        {/* Filter button */}
        <button
          type="button"
          aria-label="Filter"
          className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/60 bg-white/40 text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/80 hover:bg-white hover:text-black"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 stroke-[1.75]" />
        </button>

        {/* Nav Tabs - each is a distinct frosted glass tile */}
        <nav aria-label="Main Navigation" className="flex items-center gap-2">
          {NAV_TABS.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex items-center justify-center rounded-[14px] px-5 py-2 text-[13px] backdrop-blur-md transition-all ${
                  isActive
                    ? "border border-white/90 bg-white font-medium text-black shadow-xs"
                    : "border border-white/50 bg-white/35 font-normal text-[#555555] hover:border-white/70 hover:bg-white/60 hover:text-black"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right control: Settings button */}
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="Settings"
          className={`flex h-9 w-9 items-center justify-center rounded-[12px] shadow-2xs backdrop-blur-md transition-all ${
            pathname.startsWith("/settings")
              ? "border border-white/90 bg-white text-black shadow-xs"
              : "border border-white/60 bg-white/40 text-black/75 hover:border-white/80 hover:bg-white hover:text-black"
          }`}
          title={`Settings (Signed in as ${userName})`}
        >
          <Settings className="h-3.5 w-3.5 stroke-[1.75]" />
        </Link>
      </div>
    </header>
  );
}
