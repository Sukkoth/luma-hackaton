"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

function emptySubscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div
        className="flex size-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5"
        aria-hidden="true"
      >
        <span className="size-3.5" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className="flex size-9 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-black/75 shadow-2xs backdrop-blur-md transition-all hover:border-white/80 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {isDark ? (
        <Sun
          className="size-3.5 rotate-0 text-[#DDFD2C] transition-transform duration-300 hover:rotate-45"
          strokeWidth={1.75}
        />
      ) : (
        <Moon
          className="size-3.5 rotate-0 transition-transform duration-300 hover:-rotate-12"
          strokeWidth={1.75}
        />
      )}
    </button>
  );
}
