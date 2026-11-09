"use client";

import { useMemo } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { darkTokens, lightTokens } from "./colors";
import type { ThemeTokens } from "./types";

export function useThemeTokens(): {
  readonly tokens: ThemeTokens;
  readonly isDark: boolean;
} {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const tokens = useMemo(() => {
    return isDark ? darkTokens : lightTokens;
  }, [isDark]);

  return { tokens, isDark };
}

export * from "./types";
export * from "./colors";
