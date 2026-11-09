"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

function emptySubscribe() {
  return () => {};
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps = {}) {
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
        className={`flex size-8 lg:size-9.5 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-60 ${className}`}
        aria-hidden="true"
      >
        <span className="size-3.5 lg:size-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle theme"
      className={`flex size-8 lg:size-9.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform duration-200 active:scale-95 cursor-pointer hover:opacity-90 ${className}`}
    >
      {isDark ? (
        <Sun
          className="size-3.5 lg:size-4 rotate-0 transition-transform duration-300 hover:rotate-45"
          strokeWidth={2}
        />
      ) : (
        <Moon
          className="size-3.5 lg:size-4 rotate-0 transition-transform duration-300 hover:-rotate-12"
          strokeWidth={2}
        />
      )}
    </button>
  );
}
