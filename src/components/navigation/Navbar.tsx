"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Books", icon: BookOpen },
  { href: "/plans", label: "Plans", icon: Calendar },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <span>Bible Tracker</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/" || pathname === "/books"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
